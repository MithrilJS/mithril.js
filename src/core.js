/* eslint-disable no-bitwise */
import {hasOwn} from "./util.js"

export {m as default}

/*
Caution: be sure to check the minified output. I've noticed an issue with Terser trying to inline
single-use functions as IIFEs, and this predictably causes perf issues since engines don't seem to
reliably lower this in either their bytecode generation *or* their optimized code.

Rather than painfully trying to reduce that to an MVC and filing a bug against it, I'm just
inlining and commenting everything. It also gives me a better idea of the true cost of various
functions.

In `m`, I do use a no-inline hints (the `__NOINLINE__` in an inline block comment there) to
prevent Terser from inlining a cold function in a very hot code path, to try to squeeze a little
more performance out of the framework. Likewise, to try to preserve this through build scripts,
Terser annotations are preserved in the ESM production bundle (but not the UMD bundle).

Also, be aware: I use some bit operations here. Nothing super fancy like find-first-set, just
mainly ANDs, ORs, and a one-off XOR for inequality.
*/

/*
State note:

If remove on throw is `true` and an error occurs:
- All visited vnodes' new versions are removed.
- All unvisited vnodes' old versions are removed.

If remove on throw is `false` and an error occurs:
- Attribute modification errors are logged.
- Views that throw retain the previous version and log their error.
- Errors other than the above cause the tree to be torn down as if remove on throw was `true`.
*/

/*
This same structure is used for several nodes. Here's an explainer for each type.

Retain:
- `m`: `-1`
- All other properties are unused
- On ingest, the vnode itself is converted into the type of the element it's retaining. This
  includes changing its type.

Fragments:
- `m` bits 0-2: `0`
- `t`: unused
- `s`: unused
- `a`: unused
- `c`: virtual DOM children
- `d`: unused

Keys:
- `m` bits 0-2: `1`
- `t`: `KEY`
- `s`: identity key (may be any arbitrary object)
- `a`: unused
- `c`: virtual DOM children
- `d`: unused

Text:
- `m` bits 0-2: `2`
- `t`: unused
- `s`: text string
- `a`: unused
- `c`: unused
- `d`: abort controller reference

Components:
- `m` bits 0-2: `3`
- `t`: component reference
- `s`: view function, may be same as component reference
- `a`: most recently received attributes
- `c`: instance vnode
- `d`: unused

DOM elements:
- `m` bits 0-2: `4`
- `t`: tag name string
- `s`: event listener dictionary, if any events were ever registered
- `a`: most recently received attributes
- `c`: virtual DOM children
- `d`: element reference

Layout:
- `m` bits 0-2: `5`
- `t`: unused
- `s`: callback to schedule
- `a`: unused
- `c`: unused
- `d`: parent DOM reference, for easier queueing

Remove:
- `m` bits 0-2: `6`
- `t`: unused
- `s`: callback to schedule
- `a`: unused
- `c`: unused
- `d`: parent DOM reference, for easier queueing

The `m` field is also used for various assertions, that aren't described here.
*/

var TYPE_MASK = 7
var TYPE_RETAIN = -1
var TYPE_FRAGMENT = 0
var TYPE_KEY = 1
var TYPE_TEXT = 2
var TYPE_ELEMENT = 3
var TYPE_COMPONENT = 4
var TYPE_LAYOUT = 5
var TYPE_REMOVE = 6
var TYPE_SET_CONTEXT = 7

var FLAG_KEYED = 1 << 3
var FLAG_USED = 1 << 4
var FLAG_IS_REMOVE = 1 << 5
var FLAG_HTML_ELEMENT = 1 << 6
var FLAG_CUSTOM_ELEMENT = 1 << 7
var FLAG_INPUT_ELEMENT = 1 << 8
var FLAG_SELECT_ELEMENT = 1 << 9
var FLAG_OPTION_ELEMENT = 1 << 10
var FLAG_TEXTAREA_ELEMENT = 1 << 11
var FLAG_IS_FILE_INPUT = 1 << 12

var Vnode = (mask, tag, state, attrs, children) => ({
	m: mask,
	t: tag,
	s: state,
	a: attrs,
	c: children,
	// Think of this as either "data" or "DOM" - it's used for both.
	d: null,
})

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorUnescape = /\\(["'\\])/g
var selectorCache = /*@__PURE__*/ new Map()

var compileSelector = (selector) => {
	var match, tag = "div", classes = [], attrs = {}, className, hasAttrs = false

	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2]
		if (type === "" && value !== "") {
			tag = value
		} else {
			hasAttrs = true
			if (type === "#") {
				attrs.id = value
			} else if (type === ".") {
				classes.push(value)
			} else if (match[3][0] === "[") {
				var attrValue = match[6]
				if (attrValue) attrValue = attrValue.replace(selectorUnescape, "$1")
				if (match[4] === "class" || match[4] === "className") classes.push(attrValue)
				else attrs[match[4]] = attrValue == null || attrValue
			}
		}
	}

	if (classes.length > 0) {
		className = classes.join(" ")
	}

	var state = {t: tag, a: hasAttrs ? attrs : null, c: className}
	selectorCache.set(selector, state)
	return state
}

/*
Edit this with caution and profile every change you make. This comprises about 4% of the total
runtime overhead in benchmarks, and any reduction in performance here will immediately be felt.

Also, it's specially designed to only allocate the bare minimum it needs to build vnodes, as part
of this optimization process. It doesn't allocate arguments except as needed to build children, it
doesn't allocate attributes except to replace them for modifications, among other things.
*/
var m = function (selector, attrs) {
	if (typeof selector !== "string" && typeof selector !== "function") {
		throw new Error("The selector must be either a string or a component.");
	}

	var start = 1
	var children

	if (attrs == null || typeof attrs === "object" && typeof attrs.m !== "number" && !Array.isArray(attrs)) {
		start = 2
		if (arguments.length < 3 && attrs && Array.isArray(attrs.children)) {
			children = attrs.children.slice()
		}
	} else {
		attrs = null
	}

	if (children == null) {
		if (arguments.length === start + 1 && Array.isArray(arguments[start])) {
			children = arguments[start].slice()
		} else {
			children = []
			while (start < arguments.length) children.push(arguments[start++])
		}
	}

	// It may seem expensive to inline elements handling, but it's less expensive than you'd think.
	// DOM nodes are about as commonly constructed as vnodes, but fragments are only constructed
	// from JSX code (and even then, they aren't common).

	if (typeof selector !== "string") {
		if (selector === m.Fragment) {
			return createParentVnode(TYPE_FRAGMENT, null, null, null, children)
		} else {
			return Vnode(TYPE_COMPONENT, selector, null, Object.assign({children}, attrs), null)
		}
	}

	attrs = attrs || {}
	var hasClassName = hasOwn.call(attrs, "className")
	var dynamicClass = hasClassName ? attrs.className : attrs.class
	var state = selectorCache.get(selector)
	var original = attrs

	if (state == null) {
		state = /*@__NOINLINE__*/compileSelector(selector)
	}

	if (state.a != null) {
		attrs = Object.assign({}, state.a, attrs)
	}

	if (dynamicClass != null || state.c != null) {
		if (attrs !== original) attrs = Object.assign({}, attrs)
		attrs.class = dynamicClass != null
			? state.c != null ? `${state.c} ${dynamicClass}` : dynamicClass
			: state.c
		if (hasClassName) attrs.className = null
	}

	return createParentVnode(TYPE_ELEMENT, selector, null, attrs, children)
}

m.TYPE_MASK = TYPE_MASK
m.TYPE_RETAIN = TYPE_RETAIN
m.TYPE_FRAGMENT = TYPE_FRAGMENT
m.TYPE_KEY = TYPE_KEY
m.TYPE_TEXT = TYPE_TEXT
m.TYPE_ELEMENT = TYPE_ELEMENT
m.TYPE_COMPONENT = TYPE_COMPONENT
m.TYPE_LAYOUT = TYPE_LAYOUT
m.TYPE_REMOVE = TYPE_REMOVE
m.TYPE_SET_CONTEXT = TYPE_SET_CONTEXT

// Simple and sweet. Also useful for idioms like `onfoo: m.capture` to drop events without
// redrawing.
m.capture = (ev) => {
	ev.preventDefault()
	ev.stopPropagation()
	return false
}

m.retain = () => Vnode(TYPE_RETAIN, null, null, null, null)

m.layout = (callback) => {
	if (typeof callback !== "function") {
		throw new TypeError("Callback must be a function if provided")
	}
	return Vnode(TYPE_LAYOUT, null, callback, null, null)
}

m.remove = (callback) => {
	if (typeof callback !== "function") {
		throw new TypeError("Callback must be a function if provided")
	}
	return Vnode(TYPE_REMOVE, null, callback, null, null)
}

m.Fragment = (attrs) => attrs.children

m.key = (key, ...children) =>
	createParentVnode(TYPE_KEY, key, null, null,
		children.length === 1 && Array.isArray(children[0]) ? children[0].slice() : [...children]
	)

m.set = (entries, ...children) =>
	createParentVnode(TYPE_SET_CONTEXT, null, null, entries,
		children.length === 1 && Array.isArray(children[0]) ? children[0].slice() : [...children]
	)

m.normalize = (node) => {
	if (node == null || typeof node === "boolean") return null
	if (typeof node !== "object") return Vnode(TYPE_TEXT, null, String(node), null, null)
	if (Array.isArray(node)) return createParentVnode(TYPE_FRAGMENT, null, null, null, node.slice())
	return node
}

var createParentVnode = (mask, tag, state, attrs, input) => {
	if (input.length) {
		input[0] = m.normalize(input[0])
		var isKeyed = input[0] != null && (input[0].m & TYPE_MASK) === TYPE_KEY
		var keys = new Set()
		mask |= -isKeyed & FLAG_KEYED
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < input.length; i++) {
			input[i] = m.normalize(input[i])
			if ((input[i] != null && (input[i].m & TYPE_MASK) === TYPE_KEY) !== isKeyed) {
				throw new TypeError(
					isKeyed
						? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit empty key vnode, `m.key()`, instead of a hole."
						: "In fragments, vnodes must either all have keys or none have keys."
				)
			}
			if (isKeyed) {
				if (keys.has(input[i].t)) {
					throw new TypeError(`Duplicate key detected: ${input[i].t}`)
				}
				keys.add(input[i].t)
			}
		}
	}
	return Vnode(mask, tag, state, attrs, input)
}

var xlinkNs = "http://www.w3.org/1999/xlink"
var htmlNs = "http://www.w3.org/1999/xhtml"
var nameSpace = {
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML"
}

var currentHooks
var currentRedraw
var currentParent
var currentRefNode
var currentNamespace
var currentDocument
var currentContext
var currentRemoveOnThrow

var insertAfterCurrentRefNode = (child) => {
	if (currentRefNode) {
		currentRefNode.after(currentRefNode = child)
	} else {
		currentParent.prepend(currentRefNode = child)
	}
}

//update
var moveToPosition = (vnode) => {
	var type
	while ((type = vnode.m & TYPE_MASK) === TYPE_COMPONENT) {
		if (!(vnode = vnode.c)) return
	}
	if ((1 << TYPE_FRAGMENT | 1 << TYPE_KEY | 1 << TYPE_SET_CONTEXT) & 1 << type) {
		vnode.c.forEach(moveToPosition)
	} else if ((1 << TYPE_TEXT | 1 << TYPE_ELEMENT) & 1 << type) {
		insertAfterCurrentRefNode(vnode.d)
	}
}

var updateFragment = (old, vnode) => {
	// Here's the logic:
	// - If `old` or `vnode` is `null`, common length is 0 by default, and it falls back to an
	//   unkeyed empty fragment.
	// - If `old` and `vnode` differ in their keyedness, their children must be wholly replaced.
	// - If `old` and `vnode` are both non-keyed, patch their children linearly.
	// - If `old` and `vnode` are both keyed, patch their children using a map.
	var mask = vnode != null ? vnode.m : 0
	var newLength = vnode != null ? vnode.c.length : 0
	var oldMask = old != null ? old.m : 0
	var oldLength = old != null ? old.c.length : 0
	var commonLength = oldLength < newLength ? oldLength : newLength
	if ((oldMask ^ mask) & FLAG_KEYED) { // XOR is equivalent to bit inequality
		// Key state changed. Replace the subtree
		commonLength = 0
		mask &= ~FLAG_KEYED
	}
	if (!(mask & FLAG_KEYED)) {
		// Not keyed. Patch the common prefix, remove the extra in the old, and create the
		// extra in the new.
		//
		// Can't just take the max of both, because out-of-bounds accesses both disrupts
		// optimizations and is just generally slower.
		//
		// Note: if either `vnode` or `old` is `null`, the common length and its own length are
		// both zero, so it can't actually throw.
		try {
			for (var i = 0; i < commonLength; i++) updateNode(old.c[i], vnode.c[i])
			for (var i = commonLength; i < newLength; i++) updateNode(null, vnode.c[i])
		} finally {
			if (i < newLength) {
				commonLength = i
				for (var i = 0; i < commonLength; i++) updateNode(vnode.c[i], null)
			}
			for (var i = commonLength; i < oldLength; i++) updateNode(old.c[i], null)
		}
	} else {
		// Keyed. I take a pretty straightforward approach here to keep it simple:
		// 1. Build a map from old map to old vnode.
		// 2. Walk the new vnodes, adding what's missing and patching what's in the old.
		// 3. Remove from the old map the keys in the new vnodes, leaving only the keys that
		//    were removed this run.
		// 4. Remove the remaining nodes in the old map that aren't in the new map. Since the
		//    new keys were already deleted, this is just a simple map iteration.

		// Note: if either `vnode` or `old` is `null`, they won't get here. The default mask is
		// zero, and that causes keyed state to differ and thus a forced linear diff per above.

		var oldMap = new Map()
		for (var p of old.c) oldMap.set(p.t, p)

		try {
			for (var i = 0; i < newLength; i++) {
				var n = vnode.c[i]
				var p = oldMap.get(n.t)
				if (p == null) {
					updateFragment(null, n)
				} else {
					oldMap.delete(n.t)
					var prev = currentRefNode
					try {
						moveToPosition(p)
					} finally {
						currentRefNode = prev
					}
					updateFragment(p, n)
				}
			}
		} finally {
			if (i < newLength) {
				for (var j = 0; j < i; j++) updateNode(vnode.c[j], null)
				updateNode(old.c[j], null)
			}
			oldMap.forEach((p) => updateNode(p, null))
		}
	}
}

var updateNode = (old, vnode) => {
	// This is important. Declarative state bindings that rely on dependency tracking, like
	// https://github.com/tc39/proposal-signals and related, memoize their results, but that's the
	// absolute extent of what they necessarily reuse. They don't pool anything. That means all I
	// need to do to support components based on them is just add this neat single line of code
	// here.
	//
	// Code based on streams (see this repo here) will also potentially need this depending on how
	// they do their combinators.
	if (old === vnode) return

	var type
	if (old == null) {
		if (vnode == null) return
		if (vnode.m < 0) {
			throw new Error("No node present to retain with `m.retain()`")
		}
		if (vnode.m & FLAG_USED) {
			throw new TypeError("Vnodes must not be reused")
		}
		type = vnode.m & TYPE_MASK
		vnode.m |= FLAG_USED
	} else {
		type = old.m & TYPE_MASK

		if (vnode == null) {
			try {
				removeNodeDispatch[type](old)
			} catch (e) {
				console.error(e)
			}
			return
		}

		if (vnode.m < 0) {
			// If it's a retain node, transmute it into the node it's retaining. Makes it much easier
			// to implement and work with.
			//
			// Note: this key list *must* be complete.
			vnode.m = old.m
			vnode.t = old.t
			vnode.s = old.s
			vnode.a = old.a
			vnode.c = old.c
			vnode.d = old.d
			return
		}

		if (vnode.m & FLAG_USED) {
			throw new TypeError("Vnodes must not be reused")
		}

		var newType = vnode.m & TYPE_MASK

		if (type === newType && vnode.t === old.t) {
			vnode.m = old.m & ~FLAG_KEYED | vnode.m & FLAG_KEYED
		} else {
			updateNode(old, null)
			type = newType
			old = null
		}
	}

	try {
		updateNodeDispatch[type](old, vnode)
	} catch (e) {
		updateNode(old, null)
		throw e
	}
}

var updateLayout = (_, vnode) => {
	vnode.d = currentParent
	currentHooks.push(vnode)
}

var updateRemove = (_, vnode) => {
	vnode.d = currentParent
}

var emptyObject = {}

var updateSet = (old, vnode) => {
	var descs = Object.getOwnPropertyDescriptors(vnode.a)
	for (var key of Reflect.ownKeys(descs)) {
		// Drop the descriptor entirely if it's not enumerable. Setting it to an empty object
		// avoids changing its shape, which is useful.
		if (!descs[key].enumerable) descs[key] = emptyObject
		// Drop the setter if one is present, to keep it read-only.
		else if ("set" in descs[key]) descs[key].set = undefined
	}
	var prevContext = currentContext
	try {
		currentContext = Object.freeze(Object.create(prevContext, descs))
		updateFragment(old, vnode)
	} finally {
		currentContext = prevContext
	}
}

var updateText = (old, vnode) => {
	if (old == null) {
		insertAfterCurrentRefNode(vnode.d = currentDocument.createTextNode(vnode.s))
	} else {
		if (`${old.s}` !== `${vnode.s}`) old.d.nodeValue = vnode.s
		vnode.d = currentRefNode = old.d
	}
}

var updateElement = (old, vnode) => {
	var prevParent = currentParent
	var prevNamespace = currentNamespace
	var mask = vnode.m
	var attrs = vnode.a
	var element, eventDict, oldAttrs

	if (old == null) {
		var entry = selectorCache.get(vnode.t)
		var tag = entry ? entry.t : vnode.t
		var is = attrs && attrs.is
		var ns = attrs && attrs.xmlns || nameSpace[tag] || prevNamespace
		var opts = is ? {is} : null

		insertAfterCurrentRefNode(element = vnode.d = (
			ns
				? currentDocument.createElementNS(ns, tag, opts)
				: currentDocument.createElement(tag, opts)
		))

		if (ns == null) {
			// Doing it this way since it doesn't seem Terser is smart enough to optimize the `if` with
			// every branch doing `a |= value` for differing `value`s to a ternary. It *is* smart
			// enough to inline the constants, and the following pass optimizes the rest to just
			// integers.
			//
			// Doing a simple constant-returning ternary also makes it easier for engines to emit the
			// right code.
			/* eslint-disable indent */
			vnode.m = mask |= (
				is || tag.includes("-")
					? FLAG_HTML_ELEMENT | FLAG_CUSTOM_ELEMENT
					: (tag = tag.toUpperCase(), (
						tag === "INPUT" ? FLAG_HTML_ELEMENT | FLAG_INPUT_ELEMENT
						: tag === "SELECT" ? FLAG_HTML_ELEMENT | FLAG_SELECT_ELEMENT
						: tag === "OPTION" ? FLAG_HTML_ELEMENT | FLAG_OPTION_ELEMENT
						: tag === "TEXTAREA" ? FLAG_HTML_ELEMENT | FLAG_TEXTAREA_ELEMENT
						: FLAG_HTML_ELEMENT
					))
			)
			/* eslint-enable indent */
		}

		currentParent = element
		currentNamespace = ns
	} else {
		eventDict = vnode.s = old.s
		oldAttrs = old.a
		currentNamespace = (currentParent = element = vnode.d = old.d).namespaceURI
		if (currentNamespace === htmlNs) currentNamespace = null
	}

	currentRefNode = null

	try {
		if (oldAttrs != null && oldAttrs === attrs) {
			throw new Error("Attributes object cannot be reused.")
		}

		if (attrs != null) {
			// The DOM does things to inputs based on the value, so it needs set first.
			// See: https://github.com/MithrilJS/mithril.js/issues/2622
			if (mask & FLAG_INPUT_ELEMENT && attrs.type != null) {
				if (attrs.type === "file") mask |= FLAG_IS_FILE_INPUT
				element.type = attrs.type
			}

			for (var key in attrs) {
				eventDict = setAttr(eventDict, element, mask, key, oldAttrs, attrs)
			}
		}

		for (var key in oldAttrs) {
			mask |= FLAG_IS_REMOVE
			eventDict = setAttr(eventDict, element, mask, key, oldAttrs, attrs)
		}

		updateFragment(old, vnode)

		if (mask & FLAG_SELECT_ELEMENT && old == null) {
			// This does exactly what I want, so I'm reusing it to save some code
			var normalized = getStyleKey(attrs, "value")
			if ("value" in attrs) {
				if (normalized === null) {
					if (element.selectedIndex >= 0) {
						element.value = null
					}
				} else {
					if (element.selectedIndex < 0 || element.value !== normalized) {
						element.value = normalized
					}
				}
			}

			if ("selectedIndex" in attrs) {
				element.selectedIndex = attrs.selectedIndex
			}
		}
	} finally {
		vnode.s = eventDict
		currentParent = prevParent
		currentRefNode = element
		currentNamespace = prevNamespace
	}
}

var updateComponent = (old, vnode) => {
	try {
		var attrs = vnode.a
		var tree, oldInstance, oldAttrs
		rendered: {
			if (old != null) {
				tree = old.s
				oldInstance = old.c
				oldAttrs = old.a
			} else if (typeof (tree = (vnode.s = vnode.t)(attrs, oldAttrs, currentContext)) !== "function") {
				break rendered
			}
			tree = (vnode.s = tree)(attrs, oldAttrs, currentContext)
		}
		if (tree === vnode) {
			throw new Error("A view cannot return the vnode it received as argument")
		}
		tree = m.normalize(tree)
	} catch (e) {
		if (currentRemoveOnThrow) throw e
		console.error(e)
		return
	}
	updateNode(oldInstance, vnode.c = tree)
}

var removeFragment = (old) => updateFragment(old, null)

// Replaces an otherwise necessary `switch`.
var updateNodeDispatch = [
	updateFragment,
	updateFragment,
	updateText,
	updateElement,
	updateComponent,
	updateLayout,
	updateRemove,
	updateSet,
]

var removeNodeDispatch = [
	removeFragment,
	removeFragment,
	(old) => {
		if (!old.d) return
		old.d.remove()
		old.d = null
	},
	(old) => {
		try {
			if (!old.d) return
			old.d.remove()
			old.d = null
		} finally {
			updateFragment(old, null)
		}
	},
	(old) => updateNode(old.c, null),
	() => {},
	(old) => currentHooks.push(old),
	removeFragment,
]

//attrs

/* eslint-disable no-unused-vars */
var ASCII_COLON = 0x3A
var ASCII_LOWER_A = 0x61
var ASCII_LOWER_B = 0x62
var ASCII_LOWER_C = 0x63
var ASCII_LOWER_D = 0x64
var ASCII_LOWER_E = 0x65
var ASCII_LOWER_F = 0x66
var ASCII_LOWER_G = 0x67
var ASCII_LOWER_H = 0x68
var ASCII_LOWER_I = 0x69
var ASCII_LOWER_J = 0x6A
var ASCII_LOWER_K = 0x6B
var ASCII_LOWER_L = 0x6C
var ASCII_LOWER_M = 0x6D
var ASCII_LOWER_N = 0x6E
var ASCII_LOWER_O = 0x6F
var ASCII_LOWER_P = 0x70
var ASCII_LOWER_Q = 0x71
var ASCII_LOWER_R = 0x72
var ASCII_LOWER_S = 0x73
var ASCII_LOWER_T = 0x74
var ASCII_LOWER_U = 0x75
var ASCII_LOWER_V = 0x76
var ASCII_LOWER_W = 0x77
var ASCII_LOWER_X = 0x78
var ASCII_LOWER_Y = 0x79
var ASCII_LOWER_Z = 0x7A
/* eslint-enable no-unused-vars */

var getPropKey = (host, key) => {
	if (host != null && hasOwn.call(host, key)) {
		var value = host[key]
		if (value !== false && value != null) return value
	}
	return null
}

var getStyleKey = (host, key) => {
	if (host != null && hasOwn.call(host, key)) {
		var value = host[key]
		if (value !== false && value != null) return `${value}`
	}
	return null
}

var uppercaseRegex = /[A-Z]/g

var toLowerCase = (capital) => "-" + capital.toLowerCase()

var normalizeKey = (key) => (
	key.startsWith("--") ? key :
		key === "cssFloat" ? "float" :
			key.replace(uppercaseRegex, toLowerCase)
)

var setStyle = (style, old, value, add) => {
	for (var propName of Object.keys(value)) {
		var propValue = getStyleKey(value, propName)
		if (propValue !== null) {
			var oldValue = getStyleKey(old, propName)
			if (add) {
				if (propValue !== oldValue) style.setProperty(normalizeKey(propName), propValue)
			} else {
				if (oldValue === null) style.removeProperty(normalizeKey(propName))
			}
		}
	}
}

/*
Edit this with extreme caution, and profile any change you make.

Not only is this itself a hot spot (it comprises about 3-5% of runtime overhead), but the way it's
compiled can even sometimes have knock-on performance impacts elsewhere. Per some Turbolizer
experiments, this will generate around 10-15 KiB of assembly in its final optimized form.

Some of the optimizations it does:

- For pairs of attributes, I pack them into two integers so I can compare them in
  parallel.
- I reuse the same character loads for `xlink:*` and `on*` to check for other nodes. I do not reuse
  the last load, as the first 2 characters is usually enough just on its own to know if a special
  attribute name is matchable.
- For small attribute names (4 characters or less), the code handles them in full, with no full
  string comparison.
- The events object is read prior to calling this, while the rest of the vnode is already in the
  CPU cache, and it's just passed as an argument. This ensures it's always in easy access, only
  a few cycles of latency away, without becoming too costly for vnodes without events.
- I fuse all the conditions, `hasOwn` and existence checks, and all the add/remove logic into just
  this, to reduce startup overhead and keep outer loop code size down.
- I use a lot of labels to reuse as much code as possible, and thus more ICs, to make optimization
  easier and better-informed.
- Bit flags are used extensively here to merge as many comparisons as possible. This function is
  actually the real reason why I'm using bit flags for stuff like `<input type="file">` in the
  first place - it moves the check to just the create flow where it's only done once.
*/
var setAttr = (eventDict, element, mask, key, old, attrs) => {
	try {
		var newValue = getPropKey(attrs, key)
		var oldValue = getPropKey(old, key)

		if (mask & FLAG_IS_REMOVE && newValue !== null) return eventDict

		forceSetAttribute: {
			forceTryProperty: {
				skipValueDiff: {
					if (key.length > 1) {
						var pair1 = key.charCodeAt(0) | key.charCodeAt(1) << 16

						if (key.length === 2 && pair1 === (ASCII_LOWER_I | ASCII_LOWER_S << 16)) {
							return eventDict
						} else if (pair1 === (ASCII_LOWER_O | ASCII_LOWER_N << 16)) {
							if (newValue === oldValue) return eventDict
							// Update the event
							if (typeof newValue === "function") {
								if (typeof oldValue !== "function") {
									if (eventDict == null) eventDict = new EventDict()
									element.addEventListener(key.slice(2), eventDict, false)
								}
								// Save this, so the current redraw is correctly tracked.
								eventDict._ = currentRedraw
								eventDict.set(key, newValue)
							} else if (typeof oldValue === "function") {
								element.removeEventListener(key.slice(2), eventDict, false)
								eventDict.delete(key)
							}
							return eventDict
						} else if (key.length > 3) {
							var pair2 = key.charCodeAt(2) | key.charCodeAt(3) << 16
							if (
								key.length > 6 &&
								pair1 === (ASCII_LOWER_X | ASCII_LOWER_L << 16) &&
								pair2 === (ASCII_LOWER_I | ASCII_LOWER_N << 16) &&
								(key.charCodeAt(4) | key.charCodeAt(5) << 16) === (ASCII_LOWER_K | ASCII_COLON << 16)
							) {
								key = key.slice(6)
								if (newValue !== null) {
									element.setAttributeNS(xlinkNs, key, newValue)
								} else {
									element.removeAttributeNS(xlinkNs, key)
								}
								return eventDict
							} else if (key.length === 4) {
								if (
									pair1 === (ASCII_LOWER_T | ASCII_LOWER_Y << 16) &&
									pair2 === (ASCII_LOWER_P | ASCII_LOWER_E << 16)
								) {
									if (!(mask & FLAG_INPUT_ELEMENT)) break skipValueDiff
									if (newValue === null) break forceSetAttribute
									break forceTryProperty
								} else if (
									// Try to avoid a few browser bugs on normal elements.
									pair1 === (ASCII_LOWER_H | ASCII_LOWER_R << 16) && pair2 === (ASCII_LOWER_E | ASCII_LOWER_F << 16) ||
									pair1 === (ASCII_LOWER_L | ASCII_LOWER_I << 16) && pair2 === (ASCII_LOWER_S | ASCII_LOWER_T << 16) ||
									pair1 === (ASCII_LOWER_F | ASCII_LOWER_O << 16) && pair2 === (ASCII_LOWER_R | ASCII_LOWER_M << 16)
								) {
									// If it's a custom element, just keep it. Otherwise, force the attribute
									// to be set.
									if (!(mask & FLAG_CUSTOM_ELEMENT)) {
										break forceSetAttribute
									}
								}
							} else if (key.length > 4) {
								switch (key) {
									case "children":
										return eventDict

									case "class":
									case "className":
									case "title":
										if (newValue === null) break forceSetAttribute
										break forceTryProperty

									case "value":
										if (
											// Filter out non-HTML keys and custom elements
											(mask & (FLAG_HTML_ELEMENT | FLAG_CUSTOM_ELEMENT)) !== FLAG_HTML_ELEMENT ||
											!(key in element)
										) {
											break
										}

										if (newValue === null) {
											if (mask & (FLAG_OPTION_ELEMENT | FLAG_SELECT_ELEMENT)) {
												break forceSetAttribute
											} else {
												break forceTryProperty
											}
										}

										if (!(mask & (FLAG_INPUT_ELEMENT | FLAG_TEXTAREA_ELEMENT | FLAG_SELECT_ELEMENT | FLAG_OPTION_ELEMENT))) {
											break
										}

										// It's always stringified, so it's okay to always coerce
										if (element.value === (newValue = `${newValue}`)) {
											// Setting `<input type="file" value="...">` to the same value causes an
											// error to be generated if it's non-empty
											if (mask & FLAG_IS_FILE_INPUT) return eventDict
											// Setting `<input value="...">` to the same value by typing on focused
											// element moves cursor to end in Chrome
											if (mask & (FLAG_INPUT_ELEMENT | FLAG_TEXTAREA_ELEMENT)) {
												if (element === currentDocument.activeElement) return eventDict
											} else {
												if (oldValue != null && oldValue !== false) return eventDict
											}
										}

										if (mask & FLAG_IS_FILE_INPUT) {
											//setting input[type=file][value] to different value is an error if it's non-empty
											// Not ideal, but it at least works around the most common source of uncaught exceptions for now.
											if (newValue !== "") {
												console.error("File input `value` attributes must either mirror the current value or be set to the empty string (to reset).")
												return eventDict
											}
										}

										break forceTryProperty

									case "style":
										if (oldValue === newValue) {
											// Styles are equivalent, do nothing.
										} else if (newValue === null) {
											// New style is missing, just clear it.
											element.style = ""
										} else if (typeof newValue !== "object") {
											// New style is a string, let engine deal with patching.
											element.style = newValue
										} else if (oldValue === null || typeof oldValue !== "object") {
											// `old` is missing or a string, `style` is an object.
											element.style = ""
											// Add new style properties
											setStyle(element.style, null, newValue, true)
										} else {
											// Both old & new are (different) objects, or `old` is missing.
											// Update style properties that have changed, or add new style properties
											setStyle(element.style, oldValue, newValue, true)
											// Remove style properties that no longer exist
											setStyle(element.style, newValue, oldValue, false)
										}
										return eventDict

									case "selected":
										var active = currentDocument.activeElement
										if (
											element === active ||
											mask & FLAG_OPTION_ELEMENT && element.parentNode === active
										) {
											break
										}
										// falls through

									case "checked":
									case "selectedIndex":
										break skipValueDiff

									// Try to avoid a few browser bugs on normal elements.
									case "width":
									case "height":
										// If it's a custom element, just keep it. Otherwise, force the attribute
										// to be set.
										if (!(mask & FLAG_CUSTOM_ELEMENT)) {
											break forceSetAttribute
										}
								}
							}
						}
					}

					if (newValue !== null && typeof newValue !== "object" && oldValue === newValue) return
				}

				// Filter out namespaced keys
				if (!(mask & FLAG_HTML_ELEMENT)) {
					break forceSetAttribute
				}
			}

			// Filter out namespaced keys
			// Defer the property check until *after* we check everything.
			if (key in element) {
				element[key] = newValue
				return eventDict
			}
		}

		if (newValue === null) {
			if (oldValue !== null) element.removeAttribute(key)
		} else {
			element.setAttribute(key, newValue === true ? "" : newValue)
		}
	} catch (e) {
		if (currentRemoveOnThrow) throw e
		console.error(e)
	}

	return eventDict
}

// Here's an explanation of how this works:
// 1. The event names are always (by design) prefixed by `on`.
// 2. The EventListener interface accepts either a function or an object with a `handleEvent` method.
// 3. The object inherits from `Map`, to avoid hitting global setters.
// 4. The event name is remapped to the handler before calling it.
// 5. In function-based event handlers, `ev.currentTarget === this`. We replicate that below.
// 6. In function-based event handlers, `return false` prevents the default action and stops event
//    propagation. Instead of that, we hijack it to control implicit redrawing, and let users
//    return a promise that resolves to it.
class EventDict extends Map {
	async handleEvent(ev) {
		var handler = this.get(`on${ev.type}`)
		if (typeof handler === "function") {
			var result = handler.call(ev.currentTarget, ev)
			if (result === false) return
			if (result && typeof result.then === "function" && (await result) === false) return
			(0, this._)()
		}
	}
}

//event

var currentlyRendering = []

m.render = (dom, vnodes, {redraw, removeOnThrow} = {}) => {
	if (!dom) throw new TypeError("DOM element being rendered to does not exist.")
	if (currentlyRendering.some((d) => d === dom || d.contains(dom))) {
		throw new TypeError("Node is currently being rendered to and thus is locked.")
	}

	if (redraw != null && typeof redraw !== "function") {
		throw new TypeError("Redraw must be a function if given.")
	}

	var active = dom.ownerDocument.activeElement
	var namespace = dom.namespaceURI

	var prevHooks = currentHooks
	var prevRedraw = currentRedraw
	var prevParent = currentParent
	var prevRefNode = currentRefNode
	var prevNamespace = currentNamespace
	var prevDocument = currentDocument
	var prevContext = currentContext
	var prevRemoveOnThrow = currentRemoveOnThrow
	var hooks = currentHooks = []

	try {
		currentlyRendering.push(currentParent = dom)
		currentRedraw = typeof redraw === "function" ? redraw : null
		currentRefNode = null
		currentNamespace = namespace === htmlNs ? null : namespace
		currentDocument = dom.ownerDocument
		currentContext = {redraw}
		// eslint-disable-next-line no-implicit-coercion
		currentRemoveOnThrow = !!removeOnThrow

		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		vnodes = m.normalize(Array.isArray(vnodes) ? vnodes.slice() : [vnodes])
		updateNode(dom.vnodes, vnodes)
		dom.vnodes = vnodes
		// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
		if (active != null && currentDocument.activeElement !== active && typeof active.focus === "function") {
			active.focus()
		}
		for (var {s, d} of hooks) {
			try {
				s(d)
			} catch (e) {
				console.error(e)
			}
		}
	} finally {
		currentRedraw = prevRedraw
		currentHooks = prevHooks
		currentParent = prevParent
		currentRefNode = prevRefNode
		currentNamespace = prevNamespace
		currentDocument = prevDocument
		currentContext = prevContext
		currentRemoveOnThrow = prevRemoveOnThrow
		currentlyRendering.pop()
	}
}

m.mount = (root, view) => {
	if (!root) throw new TypeError("Root must be an element")

	if (typeof view !== "function") {
		throw new TypeError("View must be a function")
	}

	var window = root.ownerDocument.defaultView
	var id = 0
	var unschedule = () => {
		if (id) {
			window.cancelAnimationFrame(id)
			id = 0
		}
	}
	var redraw = () => { if (!id) id = window.requestAnimationFrame(redraw.sync) }
	var Mount = (_, old) => [
		m.remove(unschedule),
		view(!old, redraw)
	]
	redraw.sync = () => {
		unschedule()
		m.render(root, m(Mount), {redraw})
	}

	m.render(root, null)
	redraw.sync()

	return redraw
}
