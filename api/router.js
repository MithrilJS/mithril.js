"use strict"

var coreRenderer = require("../render/render")
var coreRouter = require("../router/router")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var replay = router.defineRoutes(routes, function(component, args) {
			renderer.render(root, {tag: component, attrs: args})
		}, function() {
			router.setPath(defaultRoute)
		})
		autoredraw(root, renderer, pubsub, replay)
	}
	route.link = router.link
	route.prefix = router.setPrefix
	
	return route
}
