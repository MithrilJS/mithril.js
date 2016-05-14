var createRenderer = require("./render/render")

module.exports = function($window, redraw) {
	return function(root, component) {
		var render = createRenderer($window, draw).render
		
		function draw() {
			render(root, component)
		}
		
		redraw.run = redraw
	}
}