"use strict"

var Vnode = require("../render/vnode")
var hyperscriptVnode = require("./hyperscriptVnode")
var hasOwn = require("../util/hasOwn")
var emptyAttrs = require("./emptyAttrs")
var cachedAttrsIsStaticMap = require("./cachedAttrsIsStaticMap")

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = Object.create(null)

function isEmpty(object) {
	for (var key in object) if (hasOwn.call(object, key)) return false
	return true
}

function isFormAttributeKey(key) {
	return key === "value" || key === "checked" || key === "selectedIndex" || key === "selected"
}

function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {}, isStatic = true
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2]
		if (type === "" && value !== "") tag = value
		else if (type === "#") attrs.id = value
		else if (type === ".") classes.push(value)
		else if (match[3][0] === "[") {
			var attrValue = match[6]
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
			if (match[4] === "class") classes.push(attrValue)
			else {
				attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true
				if (isFormAttributeKey(match[4])) isStatic = false
			}
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ")
	if (isEmpty(attrs)) attrs = emptyAttrs
	else cachedAttrsIsStaticMap.set(attrs, isStatic)
	return selectorCache[selector] = {tag: tag, attrs: attrs, is: attrs.is}
}

function execSelector(state, vnode) {
	vnode.tag = state.tag

	var attrs = vnode.attrs
	if (attrs == null) {
		vnode.attrs = state.attrs
		vnode.is = state.is
		return vnode
	}

	if (hasOwn.call(attrs, "class")) {
		if (attrs.class != null) attrs.className = attrs.class
		attrs.class = null
	}

	if (state.attrs !== emptyAttrs) {
		var className = attrs.className
		attrs = Object.assign({}, state.attrs, attrs)

		if (state.attrs.className != null) attrs.className =
			className != null
				? String(state.attrs.className) + " " + String(className)
				: state.attrs.className
	}

	// workaround for #2622 (reorder keys in attrs to set "type" first)
	// The DOM does things to inputs based on the "type", so it needs set first.
	// See: https://github.com/MithrilJS/mithril.js/issues/2622
	if (state.tag === "input" && hasOwn.call(attrs, "type")) {
		attrs = Object.assign({type: attrs.type}, attrs)
	}

	// This reduces the complexity of the evaluation of "is" within the render function.
	vnode.is = attrs.is

	vnode.attrs = attrs

	return vnode
}

function hyperscript(selector, attrs, ...children) {
	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}

	var vnode = hyperscriptVnode(attrs, children)

	if (typeof selector === "string") {
		vnode.children = Vnode.normalizeChildren(vnode.children)
		if (selector !== "[") return execSelector(selectorCache[selector] || compileSelector(selector), vnode)
	}

	if (vnode.attrs == null) vnode.attrs = {}
	vnode.tag = selector
	return vnode
}

module.exports = hyperscript
