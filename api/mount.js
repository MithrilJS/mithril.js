"use strict"

var Node = require("../render/node")
var coreRenderer = require("../render/render")
var autoredraw = require("../api/autoredraw")
var dummy = Node({view: function(){}})

module.exports = function(renderer, pubsub) {
	return function(root, component) {
		pubsub.unsubscribe(root.redraw)

		component = component === null ? dummy : component

		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, component.tag ? component : Node(component))
		})

		run()

		if (component === dummy) {
			pubsub.unsubscribe(root.redraw)
			delete root.redraw
		}
	}
}
