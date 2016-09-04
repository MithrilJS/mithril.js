"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")

module.exports = function($window, mount) {
	var router = coreRouter($window)
	var reject = {} // used as a unique value

	var currentRoute = {args: {}, path: null, prev: null}
	var currentRender, routeInitialRenderCache

	var RouteComponent = {view: function() {
		if (routeInitialRenderCache) {
			var temp = routeInitialRenderCache
			routeInitialRenderCache = null
			return temp
		}
		else {
			return currentRender(currentRoute, reject)
		}
	}}
	function renderComponent(component) {
		return function (route) {
			return Vnode(component, null, route.args, undefined, undefined, undefined)
		}
	}
	var route = function(root, defaultRoute, routes) {

		currentRender = renderComponent("div")

		mount(root, RouteComponent)

		router.defineRoutes(routes, function onmatch(payload, args, path, route) {
			var render = typeof payload === "function" ? payload : renderComponent(payload)

			var newRoute = {
				prev: {path: currentRoute.path, args: currentRoute.args},
				path: path,
				args: args
			}

			var result = render(newRoute, reject)

			if (result !== reject) {
				currentRoute = newRoute
				currentRender = render

				routeInitialRenderCache = result
				root.redraw(true)
			}
			else if (currentRoute.path === null) {
				// Rejected on first route without a redirect.
				// Handle this strange case by remembering route without caching.
				currentRoute = newRoute
				currentRender = render
			}
			else {
				if (
					currentRoute.path && 			// If this isn't our first route...
					path === router.getPath() // and the route function did not call m.route.set()...
				) {
					// revert to previous route.
					router.setPath(currentRoute.path, currentRoute.args, {replace: true})
				}
			}

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
