import {hasOwn} from "./util.js"

export {m as default}

/*
This same structure is used for several nodes. Here's an explainer for each type.

Components:
- `tag`: component reference
- `state`: view function, may `=== tag`
- `attrs`: most recently received attributes
- `children`: instance vnode
- `dom`: unused

DOM elements:
- `tag`: tag name string
- `state`: event listener dictionary, if any events were ever registered
- `attrs`: most recently received attributes
- `children`: virtual DOM children
- `dom`: element reference

Retain:
- `tag`: `RETAIN`
- All other properties are unused
- On ingest, the vnode itself is converted into the type of the element it's retaining. This
  includes changing its type.

Fragments:
- `tag`: `FRAGMENT`
- `state`: unused
- `attrs`: unused
- `children`: virtual DOM children
- `dom`: unused

Keys:
- `tag`: `KEY`
- `state`: identity key (may be any arbitrary object)
- `attrs`: unused
- `children`: virtual DOM children
- `dom`: unused

Layout:
- `tag`: `LAYOUT`
- `state`: callback to schedule
- `attrs`: unused
- `children`: unused
- `dom`: abort controller reference

Text:
- `tag`: `TEXT`
- `state`: text string
- `attrs`: unused
- `children`: unused
- `dom`: abort controller reference
*/

var RETAIN = Symbol.for("m.retain")
var FRAGMENT = Symbol.for("m.Fragment")
var KEY = Symbol.for("m.key")
var LAYOUT = Symbol.for("m.layout")
var TEXT = Symbol.for("m.text")

function Vnode(tag, state, attrs, children) {
	return {tag, state, attrs, children, dom: undefined}
}

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorUnescape = /\\(["'\\])/g
var selectorCache = /*@__PURE__*/ new Map()

function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {}, hasAttrs = false

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
		attrs.class = classes.join(" ")
	}

	var state = {tag, attrs: hasAttrs ? attrs : null}
	selectorCache.set(selector, state)
	return state
}

function execSelector(selector, attrs, children) {
	attrs = attrs || {}
	var hasClassName = hasOwn.call(attrs, "className")
	var dynamicClass = hasClassName ? attrs.className : attrs.class
	var state = selectorCache.get(selector)
	var original = attrs
	var selectorClass

	if (state == null) {
		state = compileSelector(selector)
	}

	if (state.attrs != null) {
		selectorClass = state.attrs.class
		attrs = Object.assign({}, state.attrs, attrs)
	}

	if (dynamicClass != null || selectorClass != null) {
		if (attrs !== original) attrs = Object.assign({}, attrs)
		attrs.class = dynamicClass != null
			? selectorClass != null ? `${selectorClass} ${dynamicClass}` : dynamicClass
			: selectorClass
		if (hasClassName) attrs.className = null
	}

	return Vnode(state.tag, undefined, attrs, normalizeChildren(children))
}

// Caution is advised when editing this - it's very perf-critical. It's specially designed to avoid
// allocations in the fast path, especially with fragments.
function m(selector, attrs, ...children) {
	if (typeof selector !== "string" && typeof selector !== "function") {
		throw new Error("The selector must be either a string or a component.");
	}

	if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
		children = children.length === 0 && attrs && hasOwn.call(attrs, "children") && Array.isArray(attrs.children)
			? attrs.children.slice()
			: children.length === 1 && Array.isArray(children[0]) ? children[0].slice() : [...children]
	} else {
		children = children.length === 0 && Array.isArray(attrs) ? attrs.slice() : [attrs, ...children]
		attrs = undefined
	}

	if (typeof selector === "string") {
		return execSelector(selector, attrs, children)
	} else if (selector === m.Fragment) {
		return Vnode(FRAGMENT, undefined, undefined, normalizeChildren(children))
	} else {
		return Vnode(selector, undefined, Object.assign({children}, attrs), undefined)
	}
}

// Simple and sweet. Also useful for idioms like `onfoo: m.capture` to drop events without
// redrawing.
m.capture = (ev) => {
	ev.preventDefault()
	ev.stopPropagation()
	return false
}

m.retain = () => Vnode(RETAIN, undefined, undefined, undefined)

m.layout = (f) => Vnode(LAYOUT, f, undefined, undefined)

m.Fragment = (attrs) => attrs.children
m.key = (key, ...children) =>
	Vnode(KEY, key, undefined, normalizeChildren(
		children.length === 1 && Array.isArray(children[0]) ? children[0].slice() : [...children]
	))

m.normalize = (node) => {
	if (node == null || typeof node === "boolean") return null
	if (typeof node !== "object") return Vnode(TEXT, String(node), undefined, undefined)
	if (Array.isArray(node)) return Vnode(FRAGMENT, undefined, undefined, normalizeChildren(node.slice()))
	return node
}

function normalizeChildren(input) {
	if (input.length) {
		input[0] = m.normalize(input[0])
		var isKeyed = input[0] != null && input[0].tag === KEY
		var keys = new Set()
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < input.length; i++) {
			input[i] = m.normalize(input[i])
			if ((input[i] != null && input[i].tag === KEY) !== isKeyed) {
				throw new TypeError(
					isKeyed
						? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit empty key vnode, `m.key()`, instead of a hole."
						: "In fragments, vnodes must either all have keys or none have keys."
				)
			}
			if (isKeyed) {
				if (keys.has(input[i].state)) {
					throw new TypeError(`Duplicate key detected: ${input[i].state}`)
				}
				keys.add(input[i].state)
			}
		}
	}
	return input
}

var xlinkNs = "http://www.w3.org/1999/xlink"
var nameSpace = {
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML"
}

var currentHooks
var currentRedraw
var currentParent
var currentRefNode
var currentNamespace

// Used for tainting nodes, to assert they aren't being reused.
var vnodeAccepted = new WeakSet()

function assertVnodeIsNew(vnode) {
	if (vnodeAccepted.has(vnode)) {
		throw new TypeError("Vnodes must not be reused")
	}
	vnodeAccepted.add(vnode)
}

//create
function createNodes(vnodes, start) {
	for (var i = start; i < vnodes.length; i++) createNode(vnodes[i])
}
function createNode(vnode) {
	if (vnode != null) {
		assertVnodeIsNew(vnode)
		innerCreateNode(vnode)
	}
}
function innerCreateNode(vnode) {
	switch (vnode.tag) {
		case RETAIN: throw new Error("No node present to retain with `m.retain()`")
		case LAYOUT: return createLayout(vnode)
		case TEXT: return createText(vnode)
		case KEY:
		case FRAGMENT: return createNodes(vnode.children, 0)
	}
	if (typeof vnode.tag === "string") createElement(vnode)
	else createComponent(vnode)
}
function createLayout(vnode) {
	vnode.dom = new AbortController()
	currentHooks.push({v: vnode, p: currentParent, i: true})
}
function createText(vnode) {
	insertAfterCurrentRefNode(vnode.dom = currentParent.ownerDocument.createTextNode(vnode.state))
}
function createElement(vnode) {
	var tag = vnode.tag
	var attrs = vnode.attrs
	var is = attrs && attrs.is
	var prevParent = currentParent
	var document = currentParent.ownerDocument
	var prevNamespace = currentNamespace
	var ns = attrs && attrs.xmlns || nameSpace[tag] || prevNamespace

	var element = vnode.dom = ns ?
		is ? document.createElementNS(ns, tag, {is: is}) : document.createElementNS(ns, tag) :
		is ? document.createElement(tag, {is: is}) : document.createElement(tag)

	insertAfterCurrentRefNode(element)

	currentParent = element
	currentRefNode = null
	currentNamespace = ns

	try {
		if (attrs != null) {
			setAttrs(vnode, attrs)
		}

		if (!maybeSetContentEditable(vnode)) {
			if (vnode.children) {
				createNodes(vnode.children, 0)
				if (vnode.tag === "select" && attrs != null) setLateSelectAttrs(vnode, attrs)
			}
		}
	} finally {
		currentRefNode = element
		currentParent = prevParent
		currentNamespace = ns
	}
}
function createComponent(vnode) {
	var tree = (vnode.state = vnode.tag)(vnode.attrs)
	if (typeof tree === "function") tree = (vnode.state = tree)(vnode.attrs)
	if (tree === vnode) throw new Error("A view cannot return the vnode it received as argument")
	createNode(vnode.children = m.normalize(tree))
}

//update
function updateNodes(old, vnodes) {
	if (old == null || old.length === 0) createNodes(vnodes, 0)
	else if (vnodes == null || vnodes.length === 0) removeNodes(old, 0)
	else {
		var isOldKeyed = old[0] != null && old[0].tag === KEY
		var isKeyed = vnodes[0] != null && vnodes[0].tag === KEY
		if (isOldKeyed !== isKeyed) {
			// Key state changed. Replace the subtree
			removeNodes(old, 0)
			createNodes(vnodes, 0)
		} else if (!isKeyed) {
			// Not keyed. Patch the common prefix, remove the extra in the old, and create the
			// extra in the new.
			//
			// Can't just take the max of both, because out-of-bounds accesses both disrupts
			// optimizations and is just generally slower.
			var commonLength = old.length < vnodes.length ? old.length : vnodes.length
			for (var i = 0; i < commonLength; i++) {
				updateNode(old[i], vnodes[i])
			}
			removeNodes(old, commonLength)
			createNodes(vnodes, commonLength)
		} else {
			// Keyed. I take a pretty straightforward approach here to keep it simple:
			// 1. Build a map from old map to old vnode.
			// 2. Walk the new vnodes, adding what's missing and patching what's in the old.
			// 3. Remove from the old map the keys in the new vnodes, leaving only the keys that
			//    were removed this run.
			// 4. Remove the remaining nodes in the old map that aren't in the new map. Since the
			//    new keys were already deleted, this is just a simple map iteration.

			var oldMap = new Map()
			for (var p of old) oldMap.set(p.state, p)

			for (var n of vnodes) {
				var p = oldMap.get(n.state)
				if (p == null) {
					createNodes(n.children, 0)
				} else {
					oldMap.delete(n.state)
					var prev = currentRefNode
					try {
						moveToPosition(p)
					} finally {
						currentRefNode = prev
					}
					updateNodes(p.children, n.children)
				}
			}

			oldMap.forEach(removeNode)
		}
	}
}
function updateNode(old, vnode) {
	if (old == null) {
		createNode(vnode)
	} else if (vnode == null) {
		removeNode(old)
	} else {
		assertVnodeIsNew(vnode)
		if (vnode.tag === RETAIN) {
			// If it's a retain node, transmute it into the node it's retaining. Makes it much easier
			// to implement and work with.
			//
			// Note: this key list *must* be complete.
			vnode.tag = old.tag
			vnode.state = old.state
			vnode.attrs = old.attrs
			vnode.children = old.children
			vnode.dom = old.dom
		} else if (vnode.tag === old.tag && (vnode.tag !== KEY || vnode.state === old.state)) {
			switch (vnode.tag) {
				case LAYOUT: return updateLayout(old, vnode)
				case TEXT: return updateText(old, vnode)
				case KEY:
				case FRAGMENT: return updateNodes(old.children, vnode.children)
			}
			if (typeof vnode.tag === "string") updateElement(old, vnode)
			else updateComponent(old, vnode)
		}
		else {
			removeNode(old)
			innerCreateNode(vnode)
		}
	}
}
function updateLayout(old, vnode) {
	vnode.dom = old.dom
	currentHooks.push({v: vnode, p: currentParent, i: false})
}
function updateText(old, vnode) {
	if (`${old.state}` !== `${vnode.state}`) old.dom.nodeValue = vnode.state
	vnode.dom = currentRefNode = old.dom
}
function updateElement(old, vnode) {
	vnode.state = old.state
	var prevParent = currentParent
	var prevNamespace = currentNamespace
	var namespace = (currentParent = vnode.dom = old.dom).namespaceURI

	currentNamespace = namespace === "http://www.w3.org/1999/xhtml" ? null : namespace
	currentRefNode = null
	try {
		updateAttrs(vnode, old.attrs, vnode.attrs)
		if (!maybeSetContentEditable(vnode)) {
			updateNodes(old.children, vnode.children)
		}
	} finally {
		currentParent = prevParent
		currentRefNode = vnode.dom
		currentNamespace = prevNamespace
	}
}
function updateComponent(old, vnode) {
	vnode.children = m.normalize((vnode.state = old.state)(vnode.attrs, old.attrs))
	if (vnode.children === vnode) throw new Error("A view cannot return the vnode it received as argument")
	updateNode(old.children, vnode.children)
}

function insertAfterCurrentRefNode(child) {
	if (currentRefNode) {
		currentRefNode.after(currentRefNode = child)
	} else {
		currentParent.prepend(currentRefNode = child)
	}
}

function moveToPosition(vnode) {
	while (typeof vnode.tag === "function") {
		vnode = vnode.children
		if (!vnode) return
	}
	if (vnode.tag === FRAGMENT || vnode.tag === KEY) {
		vnode.children.forEach(moveToPosition)
	} else {
		insertAfterCurrentRefNode(vnode.dom)
	}
}

function maybeSetContentEditable(vnode) {
	if (vnode.attrs == null || (
		vnode.attrs.contenteditable == null && // attribute
		vnode.attrs.contentEditable == null // property
	)) return false
	var children = vnode.children
	if (children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted.")
	return true
}

//remove
function removeNodes(vnodes, start) {
	for (var i = start; i < vnodes.length; i++) removeNode(vnodes[i])
}
function removeNode(vnode) {
	if (vnode != null) {
		if (typeof vnode.tag === "function") {
			removeNode(vnode.children)
		} else if (vnode.tag === LAYOUT) {
			try {
				vnode.dom.abort()
			} catch (e) {
				console.error(e)
			}
		} else {
			if (vnode.children != null) {
				removeNodes(vnode.children, 0)
			}

			if (vnode.dom != null) vnode.dom.remove()
		}
	}
}

//attrs
function setAttrs(vnode, attrs) {
	// The DOM does things to inputs based on the value, so it needs set first.
	// See: https://github.com/MithrilJS/mithril.js/issues/2622
	if (vnode.tag === "input" && attrs.type != null) vnode.dom.type = attrs.type
	var isFileInput = attrs != null && vnode.tag === "input" && attrs.type === "file"
	for (var key in attrs) {
		setAttr(vnode, key, null, attrs[key], isFileInput)
	}
}
function setAttr(vnode, key, old, value, isFileInput) {
	if (value == null || key === "is" || key === "children" || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || key === "type" && vnode.tag === "input") return
	if (key.startsWith("on")) updateEvent(vnode, key, value)
	else if (key.startsWith("xlink:")) vnode.dom.setAttributeNS(xlinkNs, key.slice(6), value)
	else if (key === "style") updateStyle(vnode.dom, old, value)
	else if (hasPropertyKey(vnode, key)) {
		if (key === "value") {
			// Only do the coercion if we're actually going to check the value.
			/* eslint-disable no-implicit-coercion */
			switch (vnode.tag) {
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				//setting input[type=file][value] to same value causes an error to be generated if it's non-empty
				case "input":
				case "textarea":
					if (vnode.dom.value === "" + value && (isFileInput || vnode.dom === vnode.dom.ownerDocument.activeElement)) return
					//setting input[type=file][value] to different value is an error if it's non-empty
					// Not ideal, but it at least works around the most common source of uncaught exceptions for now.
					if (isFileInput && "" + value !== "") { console.error("`value` is read-only on file inputs!"); return }
					break
				//setting select[value] or option[value] to same value while having select open blinks select dropdown in Chrome
				case "select":
				case "option":
					if (old !== null && vnode.dom.value === "" + value) return
			}
			/* eslint-enable no-implicit-coercion */
		}
		vnode.dom[key] = value
	} else if (value === false) {
		vnode.dom.removeAttribute(key)
	} else {
		vnode.dom.setAttribute(key, value === true ? "" : value)
	}
}
function removeAttr(vnode, key, old) {
	if (old == null || key === "is" || key === "children") return
	if (key.startsWith("on")) updateEvent(vnode, key, undefined)
	else if (key.startsWith("xlink:")) vnode.dom.removeAttributeNS(xlinkNs, key.slice(6))
	else if (key === "style") updateStyle(vnode.dom, old, null)
	else if (
		hasPropertyKey(vnode, key)
		&& key !== "class"
		&& key !== "title" // creates "null" as title
		&& !(key === "value" && (
			vnode.tag === "option"
			|| vnode.tag === "select" && vnode.dom.selectedIndex === -1 && vnode.dom === vnode.dom.ownerDocument.activeElement
		))
		&& !(vnode.tag === "input" && key === "type")
	) {
		vnode.dom[key] = null
	} else {
		if (old !== false) vnode.dom.removeAttribute(key)
	}
}
function setLateSelectAttrs(vnode, attrs) {
	if ("value" in attrs) {
		if(attrs.value === null) {
			if (vnode.dom.selectedIndex !== -1) vnode.dom.value = null
		} else {
			var normalized = "" + attrs.value // eslint-disable-line no-implicit-coercion
			if (vnode.dom.value !== normalized || vnode.dom.selectedIndex === -1) {
				vnode.dom.value = normalized
			}
		}
	}
	if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined)
}
function updateAttrs(vnode, old, attrs) {
	if (old && old === attrs) {
		throw new Error("Attributes object cannot be reused.")
	}
	if (attrs != null) {
		// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
		//
		// Also, the DOM does things to inputs based on the value, so it needs set first.
		// See: https://github.com/MithrilJS/mithril.js/issues/2622
		if (vnode.tag === "input" && attrs.type != null) vnode.dom.setAttribute("type", attrs.type)
		var isFileInput = vnode.tag === "input" && attrs.type === "file"
		for (var key in attrs) {
			setAttr(vnode, key, old && old[key], attrs[key], isFileInput)
		}
	}
	var val
	if (old != null) {
		for (var key in old) {
			if (((val = old[key]) != null) && (attrs == null || attrs[key] == null)) {
				removeAttr(vnode, key, val)
			}
		}
	}
}
// Try to avoid a few browser bugs on normal elements.
// var propertyMayBeBugged = /^(?:href|list|form|width|height|type)$/
var propertyMayBeBugged = /^(?:href|list|form|width|height)$/
function isFormAttribute(vnode, attr) {
	return attr === "value" || attr === "checked" || attr === "selectedIndex" ||
		attr === "selected" && vnode.dom === vnode.dom.ownerDocument.activeElement ||
		vnode.tag === "option" && vnode.dom.parentNode === vnode.dom.ownerDocument.activeElement
}
function hasPropertyKey(vnode, key) {
	// Filter out namespaced keys
	return currentNamespace == null && (
		// If it's a custom element, just keep it.
		vnode.tag.indexOf("-") > -1 || vnode.attrs != null && vnode.attrs.is ||
		!propertyMayBeBugged.test(key)
		// Defer the property check until *after* we check everything.
	) && key in vnode.dom
}

//style
var uppercaseRegex = /[A-Z]/g
function toLowerCase(capital) { return "-" + capital.toLowerCase() }
function normalizeKey(key) {
	return key[0] === "-" && key[1] === "-" ? key :
		key === "cssFloat" ? "float" :
			key.replace(uppercaseRegex, toLowerCase)
}
function updateStyle(element, old, style) {
	if (old === style) {
		// Styles are equivalent, do nothing.
	} else if (style == null) {
		// New style is missing, just clear it.
		element.style = ""
	} else if (typeof style !== "object") {
		// New style is a string, let engine deal with patching.
		element.style = style
	} else if (old == null || typeof old !== "object") {
		// `old` is missing or a string, `style` is an object.
		element.style.cssText = ""
		// Add new style properties
		for (var key in style) {
			var value = style[key]
			if (value != null) element.style.setProperty(normalizeKey(key), String(value))
		}
	} else {
		// Both old & new are (different) objects.
		// Update style properties that have changed
		for (var key in style) {
			var value = style[key]
			if (value != null && (value = String(value)) !== String(old[key])) {
				element.style.setProperty(normalizeKey(key), value)
			}
		}
		// Remove style properties that no longer exist
		for (var key in old) {
			if (old[key] != null && style[key] == null) {
				element.style.removeProperty(normalizeKey(key))
			}
		}
	}
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
	constructor() {
		super()
		// Save this, so the current redraw is correctly tracked.
		this._ = currentRedraw
	}
	handleEvent(ev) {
		var handler = this.get(`on${ev.type}`)
		if (typeof handler === "function") {
			var result = handler.call(ev.currentTarget, ev)
			if (result !== false) {
				if (result && typeof result.then === "function") {
					Promise.resolve(result).then((value) => {
						if (value !== false) (0, this._)()
					})
				} else {
					(0, this._)()
				}
			}
		}
	}
}

//event
function updateEvent(vnode, key, value) {
	if (vnode.state != null) {
		vnode.state._ = currentRedraw
		var prev = vnode.state.get(key)
		if (prev === value) return
		if (typeof value === "function") {
			if (prev == null) vnode.dom.addEventListener(key.slice(2), vnode.state, false)
			vnode.state.set(key, value)
		} else {
			if (prev != null) vnode.dom.removeEventListener(key.slice(2), vnode.state, false)
			vnode.state.delete(key)
		}
	} else if (typeof value === "function") {
		vnode.state = new EventDict()
		vnode.dom.addEventListener(key.slice(2), vnode.state, false)
		vnode.state.set(key, value)
	}
}

var currentlyRendering = []

m.render = (dom, vnodes, redraw) => {
	if (!dom) throw new TypeError("DOM element being rendered to does not exist.")
	if (currentlyRendering.some((d) => d === dom || d.contains(dom))) {
		throw new TypeError("Node is currently being rendered to and thus is locked.")
	}

	var active = dom.ownerDocument.activeElement
	var namespace = dom.namespaceURI

	var prevHooks = currentHooks
	var prevRedraw = currentRedraw
	var prevParent = currentParent
	var prevRefNode = currentRefNode
	var prevNamespace = currentNamespace
	var hooks = currentHooks = []

	try {
		currentlyRendering.push(currentParent = dom)
		currentRedraw = typeof redraw === "function" ? redraw : undefined
		currentRefNode = null
		currentNamespace = namespace === "http://www.w3.org/1999/xhtml" ? null : namespace

		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		vnodes = normalizeChildren(Array.isArray(vnodes) ? vnodes.slice() : [vnodes])
		updateNodes(dom.vnodes, vnodes)
		dom.vnodes = vnodes
		// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
		if (active != null && dom.ownerDocument.activeElement !== active && typeof active.focus === "function") active.focus()
		for (var {v, p, i} of hooks) {
			try {
				(0, v.state)(p, v.dom.signal, i)
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
		currentlyRendering.pop()
	}
}

var subscriptions = new Map()
var id = 0

function unscheduleFrame() {
	if (id) {
		// eslint-disable-next-line no-undef
		cancelAnimationFrame(id)
		id = 0
	}
}

m.redraw = () => {
	// eslint-disable-next-line no-undef
	if (!id) id = requestAnimationFrame(m.redrawSync)
}

m.redrawSync = () => {
	unscheduleFrame()
	for (const [root, view] of subscriptions) {
		try {
			m.render(root, view(), m.redraw)
		} catch (e) {
			console.error(e)
		}
	}
}

m.mount = (root, view) => {
	if (!root) throw new TypeError("Root must be an element")

	if (view != null && typeof view !== "function") {
		throw new TypeError("View must be a component")
	}

	if (subscriptions.delete(root)) {
		if (!subscriptions.size) unscheduleFrame()
		m.render(root, null)
	}

	if (typeof view === "function") {
		subscriptions.set(root, view)
		m.render(root, view(), m.redraw)
	}
}
