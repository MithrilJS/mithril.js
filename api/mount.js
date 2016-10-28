"use strict"

var Vnode = require("../render/vnode")
var autoredraw = require("../api/autoredraw")

module.exports = function(renderer, pubsub) {
	return function(root, component) {
		if (component === null) {
			renderer.render(root, [])
			pubsub.unsubscribe(root.redraw)
			delete root.redraw
			return
		}
		
		if (component.view == null) throw new Error("m.mount(element, component) expects a component, not a vnode")

		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, Vnode(component, undefined, undefined, undefined, undefined, undefined))
		})

		run()
	}
}
