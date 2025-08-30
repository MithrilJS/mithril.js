"use strict"

var Vnode = require("../render/vnode")
var hyperscriptVnode = require("./hyperscriptVnode")

module.exports = function(attrs, ...children) {
	var vnode = hyperscriptVnode(attrs, children)

	if (vnode.attrs == null) vnode.attrs = {}
	vnode.tag = "["
	vnode.children = Vnode.normalizeChildren(vnode.children)
	return vnode
}
