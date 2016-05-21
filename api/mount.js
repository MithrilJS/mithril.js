"use strict"

var coreRenderer = require("../render/render")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, pubsub) {
	var renderer = coreRenderer($window)
	return function(root, component) {
		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, {tag: component})
		})
		
		run()
	}
}
