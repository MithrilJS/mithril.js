"use strict"

var hyperscript = require("./hyperscript")

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
	if (vnode == null) return
	assertVnodeIsNew(vnode)
	var tag = vnode.tag
	if (typeof tag === "string") {
		switch (tag) {
			case "!": throw new Error("No node present to retain with `m.retain()`")
			case ">": createLayout(vnode); break
			case "#": createText(vnode); break
			case "=":
			case "[": createNodes(vnode.children, 0); break
			default: createElement(vnode)
		}
	}
	else createComponent(vnode)
}
function createLayout(vnode) {
	vnode.dom = new AbortController()
	currentHooks.push({v: vnode, p: currentParent, i: true})
}
function createText(vnode) {
	insertAfterCurrentRefNode(vnode.dom = currentParent.ownerDocument.createTextNode(vnode.children))
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
	createNode(vnode.instance = hyperscript.normalize(tree))
}

//update
function updateNodes(old, vnodes) {
	if (old === vnodes || old == null && vnodes == null) return
	else if (old == null || old.length === 0) createNodes(vnodes, 0)
	else if (vnodes == null || vnodes.length === 0) removeNodes(old, 0)
	else {
		var isOldKeyed = old[0] != null && old[0].tag === "="
		var isKeyed = vnodes[0] != null && vnodes[0].tag === "="
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
	} else if (vnode.tag === "!") {
		assertVnodeIsNew(vnode)
		// If it's a retain node, transmute it into the node it's retaining. Makes it much easier
		// to implement and work with.
		//
		// Note: this key list *must* be complete.
		vnode.tag = old.tag
		vnode.state = old.state
		vnode.attrs = old.attrs
		vnode.children = old.children
		vnode.dom = old.dom
		vnode.instance = old.instance
	} else if (vnode.tag === old.tag && (vnode.tag !== "=" || vnode.state === old.state)) {
		assertVnodeIsNew(vnode)
		if (typeof vnode.tag === "string") {
			switch (vnode.tag) {
				case ">": updateLayout(old, vnode); break
				case "#": updateText(old, vnode); break
				case "=":
				case "[": updateNodes(old.children, vnode.children); break
				default: updateElement(old, vnode)
			}
		}
		else updateComponent(old, vnode)
	}
	else {
		removeNode(old)
		createNode(vnode)
	}
}
function updateLayout(old, vnode) {
	vnode.dom = old.dom
	currentHooks.push({v: vnode, p: currentParent, i: false})
}
function updateText(old, vnode) {
	if (`${old.children}` !== `${vnode.children}`) old.dom.nodeValue = vnode.children
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
	vnode.instance = hyperscript.normalize((vnode.state = old.state)(vnode.attrs, old.attrs))
	if (vnode.instance === vnode) throw new Error("A view cannot return the vnode it received as argument")
	updateNode(old.instance, vnode.instance)
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
		vnode = vnode.instance
		if (!vnode) return
	}
	if (vnode.tag === "[" || vnode.tag === "=") {
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
			if (vnode.instance != null) removeNode(vnode.instance)
		} else if (vnode.tag === ">") {
			try {
				vnode.dom.abort()
			} catch (e) {
				console.error(e)
			}
		} else {
			var isNode = vnode.tag !== "[" && vnode.tag !== "="

			if (vnode.tag !== "#") {
				removeNodes(vnode.children, 0)
			}

			if (isNode) vnode.dom.remove()
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
		if (value != null && (typeof value === "function" || typeof value === "object")) {
			if (prev == null) vnode.dom.addEventListener(key.slice(2), vnode.state, false)
			vnode.state.set(key, value)
		} else {
			if (prev != null) vnode.dom.removeEventListener(key.slice(2), vnode.state, false)
			vnode.state.delete(key)
		}
	} else if (value != null && (typeof value === "function" || typeof value === "object")) {
		vnode.state = new EventDict()
		vnode.dom.addEventListener(key.slice(2), vnode.state, false)
		vnode.state.set(key, value)
	}
}

var currentlyRendering = []

module.exports = function(dom, vnodes, redraw) {
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
		vnodes = hyperscript.normalizeChildren(Array.isArray(vnodes) ? vnodes.slice() : [vnodes])
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
