"use strict"

var Vnode = require("../render/vnode")
var Promise = require("../promise/promise")
var coreRouter = require("../router/router")

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)

	var identity = function(v) {return v}
	var reject = new Promise(identity)
	var render, component, attrs, currentPath
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var update = function(routeResolver, comp, params, path) {
			component = comp || "div", attrs = params, currentPath = path
			render = (routeResolver.render || identity).bind(routeResolver)
			run()
		}
		var run = function() {
			if (render != null) redrawService.render(root, render(Vnode(component, attrs.key, attrs)))
		}
		routeService.defineRoutes(routes, function(payload, params, path) {
			if (payload.view) update({}, payload, params, path)
			else {
				if (payload.onmatch) {
					Promise.resolve(payload.onmatch(params, path, reject)).then(function(resolved) {
						update(payload, resolved, params, path)
					})
				}
				else update(payload, "div", params, path)
			}
		}, function() {
			routeService.setPath(defaultRoute)
		})
		redrawService.subscribe(root, run)
	}
	route.set = routeService.setPath
	route.get = function() {return currentPath}
	route.prefix = routeService.setPrefix
	route.link = routeService.link
	return route
}
