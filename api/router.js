"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var current = {path: null, component: "div", resolver: null}, currentResolutionIdentifier = null
		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
			var resolutionIdentifier = currentResolutionIdentifier = {}
			function resolve(component) {
				if (resolutionIdentifier !== currentResolutionIdentifier) return
				resolutionIdentifier = null
				current.path = path, current.component = component
				renderer.render(root, payload.render(Vnode(component, null, args, undefined, undefined, undefined)))
			}
			if (typeof payload.view !== "function") {
				if (typeof payload.render !== "function") payload.render = function(vnode) {return vnode}
				if (typeof payload.onmatch !== "function") payload.onmatch = function() {resolve(current.component)}
				if (path !== current.path) payload.onmatch(Vnode(payload, null, args, undefined, undefined, undefined), resolve)
				else resolve(current.component)
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
