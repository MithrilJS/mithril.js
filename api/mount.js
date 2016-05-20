"use strict"

var createRenderer = require("../render/render")
var throttle = require("../api/throttle")

module.exports = function($window, redraw) {
	var renderer = createRenderer($window)
	return function(root, component) {
		var run = throttle(function() {
			renderer.render(root, {tag: component})
		})
		
		renderer.setEventCallback(run)
	
		redraw.run = run
		run()
	}
}
