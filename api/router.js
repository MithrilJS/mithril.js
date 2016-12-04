"use strict"

var Vnode = require("../render/vnode")
var coreRouter = require("../router/router")

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)
	
	var identity = function(v) {return v}
	var current = {render: identity, component: null, path: null, resolve: null}
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var render = function(resolver, component, params, path) {
			current.render = resolver.render || identity
			current.component = component
			current.path = path
			current.resolve = null
			redrawService.render(root, current.render(Vnode(component, undefined, params)))
		}
		var run = routeService.defineRoutes(routes, function(component, params, path, route, isAction) {
			if (component.view) render({}, component, params, path)
			else {
				if (component.onmatch) {
					if (isAction === false && current.path === path || current.resolve != null) render(current, current.component, params)
					else {
						current.resolve = function(resolved) {
							render(component, resolved, params, path)
						}
						component.onmatch(function(resolved) {
							if (current.resolve != null) current.resolve(resolved)
						}, params, path)
					}
				}
				else render(component, "div", params, path)
			}
		}, function() {
			routeService.setPath(defaultRoute)
		})
		redrawService.subscribe(root, run)
	}
	route.set = routeService.setPath
	route.get = function() {return current.path}
	route.prefix = routeService.setPrefix
	route.link = routeService.link
	return route
}
