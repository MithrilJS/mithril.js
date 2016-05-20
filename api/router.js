"use strict"

var createRenderer = require("../render/render")
var createRouter = require("../router/router")
var throttle = require("../api/throttle")

module.exports = function($window, renderers) {
	var renderer = createRenderer($window)
	var router = createRouter($window)
	var route = function(root, defaultRoute, routes) {
		var replay = router.defineRoutes(routes, function(component, args) {
			renderer.render(root, {tag: component, attrs: args})
		}, function() {
			router.setPath(defaultRoute)
		})
		var run = throttle(replay)
		
		renderer.setEventCallback(run)
		renderers.push(run)
	}
	route.link = router.link
	route.prefix = router.setPrefix
	
	return route
}
