"use strict"

var Vnode = require("../render/vnode")

module.exports = function() {
	var attrs = arguments[0], start = 1, children

	if (attrs == null) {
		attrs = {}
	} else if (typeof attrs !== "object" || attrs.tag != null || Array.isArray(attrs)) {
		attrs = {}
		start = 0
	}

	if (arguments.length === start + 1) {
		children = arguments[start]
		if (!Array.isArray(children)) children = [children]
	} else {
		children = []
		while (start < arguments.length) children.push(arguments[start++])
	}

	return Vnode("[", attrs.key, attrs, Vnode.normalizeChildren(children), undefined, undefined)
}
