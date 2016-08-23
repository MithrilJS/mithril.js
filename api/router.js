"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var current = {path: null, component: "div"}
		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
			args.path = path, args.route = route
			if (typeof payload.onmatch === "function") {
				if (typeof payload.view !== "function") payload.view = function(vnode) {return vnode}
				var resolved = false
				var resolve = function(component) {
					if (!resolved){
						current.path = path, current.component = component
						renderer.render(root, payload.view(Vnode(component, null, args, undefined, undefined, undefined)))
						resolved = true
					}
				}
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
