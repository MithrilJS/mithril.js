"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")

module.exports = function($window, mount) {
	var router = coreRouter($window)
	var globalId, currentComponent, currentRender, currentArgs

	var RouteComponent = {view: function() {
		return currentRender(Vnode(currentComponent, null, currentArgs, undefined, undefined, undefined))
	}}
	function defaultRender(vnode){
		return vnode
	}
	var route = function(root, defaultRoute, routes) {
		currentComponent = "div"
		currentRender = defaultRender
		currentArgs = null

		mount(root, RouteComponent)

		router.defineRoutes(routes, function(payload, args, path, route) {
			var resolutionIdentifier = globalId = {}
			var isResolver = typeof payload.view !== "function"
			var render = defaultRender

			function resolve (component) {
				if (resolutionIdentifier !== globalId) return
				globalId = null

				currentComponent = component != null ? component: isResolver ? "div" : payload
				currentRender = render
				currentArgs = args

				root.redraw(true)
			}
			function onmatch() {
				resolve()
			}
			if (isResolver) {
				if (typeof payload.render === "function") render = payload.render.bind(payload)
				if (typeof payload.onmatch === "function") onmatch = payload.onmatch
			}

			onmatch.call(payload, {attrs: args}, resolve)
		}, function() {
			router.setPath(defaultRoute, null, {replace: true})
		})
	}
	route.link = router.link
	route.prefix = router.setPrefix
	route.set = router.setPath
	route.get = router.getPath

	return route
}
