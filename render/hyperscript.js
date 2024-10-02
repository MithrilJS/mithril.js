"use strict"

var Vnode = require("./vnode")
var hasOwn = require("../util/hasOwn")

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

	return Vnode(state.tag, null, attrs, children)
}

// Caution is advised when editing this - it's very perf-critical. It's specially designed to avoid
// allocations in the fast path, especially with fragments.
function hyperscript(selector, attrs, ...children) {
	if (typeof selector !== "string" && typeof selector !== "function") {
		throw new Error("The selector must be either a string or a component.");
	}

	if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
		if (children.length === 1 && Array.isArray(children[0])) children = children[0].slice()
	} else {
		children = children.length === 0 && Array.isArray(attrs) ? attrs.slice() : [attrs, ...children]
		attrs = undefined
	}

	if (attrs == null) attrs = {}

	if (typeof selector === "string") {
		children = Vnode.normalizeChildren(children)
		if (selector !== "[") return execSelector(selector, attrs, children)
	}

	return Vnode(selector, null, attrs, children)
}

hyperscript.fragment = function(...args) {
	return hyperscript("[", ...args)
}

hyperscript.key = function(key, ...children) {
	if (children.length === 1 && Array.isArray(children[0])) {
		children = children[0].slice()
	}
	return Vnode("=", key, null, Vnode.normalizeChildren(children))
}

module.exports = hyperscript
