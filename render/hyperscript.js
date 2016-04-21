"use strict"

var normalizeChildren = require("../render/normalizeChildren")

var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:\s*=\s*("|'|)(.*?)\2)?\]/
var selectorCache = {}
function hyperscript(selector) {
	if (selectorCache[selector] === undefined) {
		var match, tag, id, classes = [], attributes = {}
		while (match = selectorParser.exec(selector)) {
			var type = match[1], value = match[2]
			if (type === "" && value !== "") tag = value
			else if (type === "#") attributes.id = value
			else if (type === ".") classes.push(value)
			else if (match[3][0] === "[") {
				var pair = attrParser.exec(match[3])
				attributes[pair[1]] = pair[3] || true
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
			if (children instanceof Array && children.length == 1 && children[0] != null && children[0].tag === "#") text = children[0].children
			else childList = children
			return namespace({tag: tag || "div", key: attrs.key, attrs: hasAttrs ? attrs : undefined, children: childList, text: text})
		}
	}
	var attrs, children, childrenIndex
	if (arguments[1] == null || typeof arguments[1] === "object" && arguments[1].tag === undefined && !(arguments[1] instanceof Array)) {
		attrs = arguments[1]
		childrenIndex = 2
	}
	else childrenIndex = 1
	if (arguments.length === childrenIndex + 1) {
		children = arguments[childrenIndex] instanceof Array ? arguments[childrenIndex] : [arguments[childrenIndex]]
	}
	else {
		children = []
		for (var i = childrenIndex; i < arguments.length; i++) children.push(arguments[i])
	}
	
	return selectorCache[selector](attrs || {}, normalizeChildren(children))
}

function namespace(vnode) {
	switch (vnode.tag) {
		case "svg": changeNS("http://www.w3.org/2000/svg", vnode); break
		case "math": changeNS("http://www.w3.org/1998/Math/MathML", vnode); break
	}
	return vnode
}

function changeNS(ns, vnode) {
	vnode.ns = ns
	if (vnode.children != null) {
		for (var i = 0; i < vnode.children.length; i++) changeNS(ns, vnode.children[i])
	}
}

module.exports = hyperscript