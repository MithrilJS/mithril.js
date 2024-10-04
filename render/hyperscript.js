"use strict"

var hasOwn = require("../util/hasOwn")

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

	return Vnode(state.tag, {}, attrs, children)
}

var resolveChildren = (...children) =>
	(children.length === 1 && Array.isArray(children[0]) ? children[0].slice() : children)

// Caution is advised when editing this - it's very perf-critical. It's specially designed to avoid
// allocations in the fast path, especially with fragments.
function m(selector, attrs, ...children) {
	if (typeof selector !== "string" && typeof selector !== "function") {
		throw new Error("The selector must be either a string or a component.");
	}

	if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
		children = resolveChildren(...children)
	} else {
		children = resolveChildren(attrs, ...children)
		attrs = undefined
	}

	if (attrs == null) attrs = {}

	if (typeof selector === "string") {
		children = m.normalizeChildren(children)
		if (selector !== "[") return execSelector(selector, attrs, children)
	}

	return Vnode(selector, {}, attrs, children)
}

m.retain = () => Vnode("!", undefined, undefined, undefined)

m.fragment = (...args) => m("[", ...args)

// When removal is blocked, all ancestors are also blocked. This doesn't block other children, so
// this method also needs to accept an optional list of children to also keep alive while blocked.
//
// Note that the children are still notified of removal *immediately*.
m.key = (key, ...children) => Vnode("=", key, undefined, m.normalizeChildren(resolveChildren(...children)))

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

m.Fragment = "["

module.exports = m
