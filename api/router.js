"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")
var autoredraw = require("../api/autoredraw")

module.exports = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var identity = function(o){return o}
	var globalId
	var routeRequested = false
	function onbeforeresolve(){routeRequested = true}

	var route = function(root, defaultRoute, routes) {
		var current = {path: null, component: "div", render:identity}
		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
			if (!routeRequested) {
				renderer.render(root, current.render.call(payload, Vnode(current.component, null, args, undefined, undefined, undefined)))
				return
			}
			routeRequested = false
			var render = route.render || identity
			var currentId = globalId = {}
			var resolved = false
			function resolve (component) {
				if (currentId !== globalId || resolved) return
				resolved = true
				current.path = path, current.component = component || current.component, current.render = render
				renderer.render(root, current.render.call(payload, Vnode(current.component, null, args, undefined, undefined, undefined)))
			}
			var onmatch = function(resolve){resolve(current.component)}
			if (typeof payload.view !== "function") {
				if (typeof payload.render === "function") render = payload.render
				if (typeof payload.onmatch === "function") onmatch = payload.onmatch
			} else {
				current.component = payload
			}
			onmatch.call(payload, resolve, args, path, route)
		}, function() {
			router.setPath(defaultRoute, null, {replace: true})
		}, onbeforeresolve)
		autoredraw(root, renderer, pubsub, replay)
	}
	route.link = router.link
	route.prefix = router.setPrefix
	route.set = router.setPath
	route.get = router.getPath

	return route
}
