"use strict"

var autoredraw = require("../api/autoredraw")
var Vnode = require("../render/vnode")

module.exports = function(renderer, pubsub) {
	return function(root, component) {
		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, Vnode(component, undefined, {}, [], undefined, undefined))
		})

		run()
	}
}
