"use strict"

var Vnode = require("../render/vnode")

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}

function isArray(obj) {
	return obj instanceof Array
}

function hyperscript(selector) {
	if (selector == null || typeof selector !== "string" && selector.view == null) {
		throw Error("The selector must be either a string or a component.");
	}

	if (typeof selector === "string" && selectorCache[selector] === undefined) {
		var match, tag, classes = [], attributes = {}
		while (match = selectorParser.exec(selector)) {
			var type = match[1], value = match[2]
			if (type === "" && value !== "") tag = value
			else if (type === "#") attributes.id = value
			else if (type === ".") classes.push(value)
			else if (match[3][0] === "[") {
				var attrValue = match[6]
				if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
				attributes[match[4]] = attrValue || true
			}
		}
		if (classes.length > 0) attributes.className = classes.join(" ")
		selectorCache[selector] = function(attrs, children) {
			var hasAttrs = false, childList, text
			var className = attrs.className || attrs.class
			for (var key in attributes) attrs[key] = attributes[key]
			if (className !== undefined) {
				if (attrs.class !== undefined) {
					attrs.class = undefined
					attrs.className = className
				}
				if (attributes.className !== undefined) attrs.className = attributes.className + " " + className
			}
			for (var key in attrs) {
				if (key !== "key") {
					hasAttrs = true
					break
				}
			}
			if (isArray(children) && children.length == 1 && children[0] != null && children[0].tag === "#") text = children[0].children
			else childList = children

			return Vnode(tag || "div", attrs.key, hasAttrs ? attrs : undefined, childList, text, undefined)
		}
	}

	var attrs = {}, children = []
	function processArgument(arg) {
		if (arg == null || typeof arg === "object" && arg.tag === undefined && !isArray(arg)) {
			Object.keys(arg || {}).forEach(function(key) {
				attrs[key] = arg[key]
			})
		} else {
			if (isArray(arg)) children = children.concat(arg)
				else children.push(arg)
		}
	}
	for (var i = 1; i < arguments.length; i++) processArgument(arguments[i])

	if (typeof selector === "string") return selectorCache[selector](attrs, Vnode.normalizeChildren(children))

	return Vnode(selector, attrs && attrs.key, attrs, Vnode.normalizeChildren(children), undefined, undefined)
}

module.exports = hyperscript
