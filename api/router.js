"use strict"

var coreRenderer = require("../render/render")
var coreRouter = require("../router/router")
var throttle = require("../api/throttle")

module.exports = function($window, redraw) {
	var renderer = coreRenderer($window)
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var replay = router.defineRoutes(routes, function(component, args) {
			renderer.render(root, {tag: component, attrs: args})
		}, function() {
			router.setPath(defaultRoute)
		})
		var run = throttle(replay)
		
		renderer.setEventCallback(run)
		redraw.run = run
	}
	route.link = router.link
	route.prefix = router.setPrefix
	
	return route
}
