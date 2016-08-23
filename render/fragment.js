"use strict"

var Vnode = require("../render/vnode")

module.exports = function(attrs, children) {
	return Vnode("[", attrs.key, attrs, Vnode.normalizeChildren(children), undefined, undefined)
}
