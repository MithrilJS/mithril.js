"use strict"

var Node = require("../render/node")
var coreRouter = require("../router/router")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var current = {route: null, component: null}
		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
			if (typeof payload.view !== "function") {
				if (typeof payload.render !== "function") payload.render = function(vnode) {return vnode}
				var render = function(component) {
					current.route = route, current.component = component
					renderer.render(root, payload.render(Node(component, null, args, undefined, undefined, undefined)))
				}
				if (typeof payload.resolve !== "function") payload.resolve = function() {render(current.component)}
				if (route !== current.route) payload.resolve(render, args, path, route)
				else render(current.component)
			}
			else {
				renderer.render(root, Node(payload, null, args, undefined, undefined, undefined))
			}
		}, function() {
			router.setPath(defaultRoute, null, {replace: true})
		})
		autoredraw(root, renderer, pubsub, replay)
	}
	route.link = router.link
	route.prefix = router.setPrefix
	route.set = router.setPath
	route.get = router.getPath
	
	return route
}
