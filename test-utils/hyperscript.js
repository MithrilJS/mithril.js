"use strict"

var Vnode = require("../render/vnode")

// Sugar, so actual Vnodes are passed.
function makeFactory(create) {
	return function (tag, attrs, children) {
		if (typeof attrs !== "object" || Array.isArray(attrs) || attrs.tag != null) {
			children = attrs
			attrs = undefined
		}
		return create(tag, attrs && attrs.key, attrs || {}, children)
	}
}

// Virtual nodes with multiple children or single non-node child
exports.m = makeFactory(function (tag, key, attrs, children) {
	return Vnode(tag, key, attrs, children != null ? children : [], undefined, undefined)
})

// Virtual nodes with single text child
exports.t = makeFactory(function (tag, key, attrs, text) {
	return Vnode(tag, key, attrs, undefined, text, undefined)
})
