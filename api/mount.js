"use strict"

var coreRenderer = require("../render/render")
var autoredraw = require("../api/autoredraw")

module.exports = function(renderer, pubsub) {
	return function(root, component) {
		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, {tag: component})
		})

		run()
	}
}
