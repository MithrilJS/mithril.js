import {hasOwn} from "../util.js"

/*
This same structure is used for several nodes. Here's an explainer for each type.

Components:
- `tag`: component reference
- `state`: view function, may `=== tag`
- `attrs`: most recently received attributes
- `children`: unused
- `dom`: unused
- `instance`: unused

DOM elements:
- `tag`: tag name string
- `state`: event listener dictionary, if any events were ever registered
- `attrs`: most recently received attributes
- `children`: virtual DOM children
- `dom`: element reference
- `instance`: unused

Fragments:
- `tag`: `"["
- `state`: event listener dictionary, if any events were ever registered
- `attrs`: most recently received attributes
- `children`: virtual DOM children
- `dom`: element reference
- `instance`: unused
*/
function Vnode(tag, state, attrs, children) {
	return {tag, state, attrs, children, dom: undefined, instance: undefined}
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

	return Vnode(state.tag, undefined, attrs, m.normalizeChildren(children))
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
		return Vnode("[", undefined, undefined, m.normalizeChildren(children))
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

m.retain = () => Vnode("!", undefined, undefined, undefined)

m.layout = (f) => Vnode(">", f, undefined, undefined)

m.Fragment = (attrs) => attrs.children
m.key = (key, ...children) =>
	Vnode("=", key, undefined, m.normalizeChildren(
		children.length === 1 && Array.isArray(children[0]) ? children[0].slice() : [...children]
	))

m.normalize = (node) => {
	if (node == null || typeof node === "boolean") return null
	if (typeof node !== "object") return Vnode("#", undefined, undefined, String(node))
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, m.normalizeChildren(node.slice()))
	return node
}

m.normalizeChildren = (input) => {
	if (input.length) {
		input[0] = m.normalize(input[0])
		var isKeyed = input[0] != null && input[0].tag === "="
		var keys = new Set()
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < input.length; i++) {
			input[i] = m.normalize(input[i])
			if ((input[i] != null && input[i].tag === "=") !== isKeyed) {
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

export {m as default}
