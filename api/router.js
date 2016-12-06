"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)

	var identity = function(v) {return v}
	var resolver, component, attrs, currentPath, waiting
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var update = function(routeResolver, comp, params, path) {
			resolver = routeResolver, component = comp, attrs = params, currentPath = path, waiting = null
			resolver.render = routeResolver.render || identity
			render()
		}
		var render = function() {
			if (resolver != null) redrawService.render(root, resolver.render(Vnode(component, attrs.key, attrs)))
		}
		routeService.defineRoutes(routes, function(payload, params, path) {
			if (payload.view) update({}, payload, params, path)
			else {
				if (payload.onmatch) {
					if (waiting != null) update(payload, component, params, path)
					else {
						waiting = Promise.resolve(payload.onmatch(params, path))
							.then(function() {update(payload, component, params, path)})
					}
				}
				else update(payload, "div", params, path)
			}
		}, function() {
			routeService.setPath(defaultRoute)
		})
		redrawService.subscribe(root, render)
	}
	route.set = routeService.setPath
	route.get = function() {return currentPath}
	route.prefix = routeService.setPrefix
	route.link = routeService.link
	return route
}
