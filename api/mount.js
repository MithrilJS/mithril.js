"use strict"

var Vnode = require("../render/vnode")
var autoredraw = require("../api/autoredraw")

module.exports = function(renderer, pubsub) {
	return function(root, component) {
		pubsub.unsubscribe(root.redraw)
		if (component === null) {
			renderer.render(root, [])
			delete root.redraw
			return
		}

		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(
				root,
				Vnode(component, undefined, undefined, undefined, undefined, undefined)
			)
		})

		run()
	}
}
