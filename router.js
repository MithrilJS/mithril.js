var createRenderer = require("./render/render")
var createRouter = require("./router/router")
var limiter = require("./limiter")

module.exports = function($window, redraw) {
	var renderer = createRenderer($window)
	var router = createRouter($window)
	var route = function(root, defaultRoute, routes) {
		var replay = limiter($window, router.defineRoutes(routes, function(component, args) {
			renderer.render(root, {tag: component, attrs: args})
		}, function() {
			router.setPath(defaultRoute)
		}))
		
		renderer.setEventCallback(replay)
		redraw.run = replay
		
		replay()
	}
	route.link = router.link
	route.prefix = router.setPrefix
	
	return route
}
