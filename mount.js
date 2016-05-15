var createRenderer = require("./render/render")

module.exports = function($window, redraw) {
	return function(root, component) {
		var renderer = createRenderer($window)
		renderer.setEventCallback(draw)
		
		function draw() {
			renderer.render(root, {tag: component})
		}
		
		redraw.run = draw
		draw()
	}
}