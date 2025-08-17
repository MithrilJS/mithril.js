"use strict"

var Vnode = require("../render/vnode")

module.exports = function(attrs, children) {
	if (attrs == null || typeof attrs === "object" && attrs.tag == null && !Array.isArray(attrs)) {
		if (children.length === 1 && Array.isArray(children[0])) children = children[0]
	} else {
		children = children.length === 0 && Array.isArray(attrs) ? attrs : [attrs, ...children]
		attrs = undefined
	}

	if (attrs == null) attrs = {}
	return Vnode("", attrs.key, attrs, children)
}
