"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var current = {path: null, component: "div"}
		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
			if (typeof payload.view !== "function") {
				if (typeof payload.render !== "function") payload.render = function(vnode) {return vnode}
				var use = function(component) {
					current.path = path, current.component = component
					renderer.render(root, payload.render(Vnode(component, null, args, undefined, undefined, undefined)))
				}
				if (typeof payload.resolve !== "function") payload.resolve = function() {use(current.component)}
				if (path !== current.path) payload.resolve(use, args, path, route)
				else use(current.component)
			}
			else {
				renderer.render(root, Vnode(payload, null, args, undefined, undefined, undefined))
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
