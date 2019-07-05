"use strict"

var Vnode = require("../render/vnode")
var Promise = require("../promise/promise")
var coreRouter = require("../router/router")

var sentinel = {}

module.exports = function($window, redrawService) {
	var routeService = coreRouter($window)

	var currentResolver = sentinel, component, attrs, currentPath, lastUpdate
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var init = false
		var bail = function(path) {
			if (path !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true})
			else throw new Error("Could not resolve default route " + defaultRoute)
		}
		function run() {
			init = true
			if (sentinel !== currentResolver) {
				var vnode = Vnode(component, attrs.key, attrs)
				if (currentResolver) vnode = currentResolver.render(vnode)
				return vnode
			}
		}
		routeService.defineRoutes(routes, function(payload, params, path, route) {
			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return
				component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
				attrs = params, currentPath = path, lastUpdate = null
				currentResolver = routeResolver.render ? routeResolver : null
				if (init) redrawService.redraw()
				else {
					init = true
					redrawService.redraw.sync()
				}
			}
			if (payload.view || typeof payload === "function") update({}, payload)
			else {
				if (payload.onmatch) {
					Promise.resolve(payload.onmatch(params, path, route)).then(function(resolved) {
						update(payload, resolved)
					}, function () { bail(path) })
				}
				else update(payload, "div")
			}
		}, bail, defaultRoute, function (unsubscribe) {
			redrawService.subscribe(root, function(sub) {
				sub.c = run
				return sub
			}, unsubscribe)
		})
	}
	route.set = function(path, data, options) {
		if (lastUpdate != null) {
			options = options || {}
			options.replace = true
		}
		lastUpdate = null
		routeService.setPath(path, data, options)
	}
	route.get = function() {return currentPath}
	route.prefix = function(prefix) {routeService.prefix = prefix}
	var link = function(options, vnode) {
		vnode.dom.setAttribute("href", routeService.prefix + vnode.attrs.href)
		vnode.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault()
			e.redraw = false
			var href = this.getAttribute("href")
			if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length)
			route.set(href, undefined, options)
		}
	}
	route.link = function(args) {
		if (args.tag == null) return link.bind(link, args)
		return link({}, args)
	}
	route.param = function(key) {
		if(typeof attrs !== "undefined" && typeof key !== "undefined") return attrs[key]
		return attrs
	}

	return route
}
