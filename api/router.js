"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)
	
	var identity = function(v) {return v}
	var current = {}
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var update = function(resolver, component, params, path) {
			current = {resolver: resolver, component: component, params: params, path: path, resolve: null}
			current.resolver.render = resolver.render || identity
			render()
		}
		var render = function() {
			redrawService.render(root, current.resolver.render(Vnode(current.component, current.params.key, current.params)))
		}
		routeService.defineRoutes(routes, function(component, params, path) {
			if (component.view) update({}, component, params, path)
			else {
				if (component.onmatch) {
					if (current.resolve != null) update(component, current.component, params, path)
					else {
						current.resolve = function(resolved) {
							update(component, resolved, params, path)
						}
						component.onmatch(function(resolved) {
							if (current.resolve != null) current.resolve(resolved)
						}, params, path)
					}
				}
				else update(component, "div", params, path)
			}
		}, function() {
			routeService.setPath(defaultRoute)
		})
		redrawService.subscribe(root, render)
	}
	route.set = routeService.setPath
	route.get = function() {return current.path}
	route.prefix = routeService.setPrefix
	route.link = routeService.link
	return route
}
