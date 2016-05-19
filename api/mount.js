var createRenderer = require("../render/render")
var limiter = require("./limiter");

module.exports = function($window, redraw) {
	return function(root, component) {
		var renderer = createRenderer($window)
		var draw = limiter($window, function draw() {
			renderer.render(root, {tag: component})
		})
		
		renderer.setEventCallback(draw)
	
		redraw.run = draw
		draw()
	}
}
