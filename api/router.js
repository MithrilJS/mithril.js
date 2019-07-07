"use strict"

var Vnode = require("../render/vnode")
var Promise = require("../promise/promise")

var buildPathname = require("../pathname/build")
var parsePathname = require("../pathname/parse")
var compileTemplate = require("../pathname/compileTemplate")
var assign = require("../pathname/assign")

var sentinel = {}

module.exports = function($window, mountRedraw) {
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout
	var supportsPushState = typeof $window.history.pushState === "function"
	var routePrefix = "#!"
	var fireAsync

	function setPath(path, data, options) {
		path = buildPathname(path, data)
		if (fireAsync != null) {
			fireAsync()
			var state = options ? options.state : null
			var title = options ? options.title : null
			if (options && options.replace) $window.history.replaceState(state, title, routePrefix + path)
			else $window.history.pushState(state, title, routePrefix + path)
		}
		else {
			$window.location.href = routePrefix + path
		}
	}

	var currentResolver = sentinel, component, attrs, currentPath, lastUpdate
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		// 0 = start
		// 1 = init
		// 2 = ready
		var state = 0

		var compiled = Object.keys(routes).map(function(route) {
			if (route[0] !== "/") throw new SyntaxError("Routes must start with a `/`")
			if ((/:([^\/\.-]+)(\.{3})?:/).test(route)) {
				throw new SyntaxError("Route parameter names must be separated with either `/`, `.`, or `-`")
			}
			return {
				route: route,
				component: routes[route],
				check: compileTemplate(route),
			}
		})
		var onremove, asyncId

		fireAsync = null

		if (defaultRoute != null) {
			var defaultData = parsePathname(defaultRoute)

			if (!compiled.some(function (i) { return i.check(defaultData) })) {
				throw new ReferenceError("Default route doesn't match any known routes")
			}
		}

		function resolveRoute() {
			// Consider the pathname holistically. The prefix might even be invalid,
			// but that's not our problem.
			var prefix = $window.location.hash
			if (routePrefix[0] !== "#") {
				prefix = $window.location.search + prefix
				if (routePrefix[0] !== "?") {
					prefix = $window.location.pathname + prefix
					if (prefix[0] !== "/") prefix = "/" + prefix
				}
			}
			// This seemingly useless `.concat()` speeds up the tests quite a bit,
			// since the representation is consistently a relatively poorly
			// optimized cons string.
			var path = prefix.concat()
				.replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
				.slice(routePrefix.length)
			var data = parsePathname(path)

			assign(data.params, $window.history.state)

			for (var i = 0; i < compiled.length; i++) {
				if (compiled[i].check(data)) {
					var payload = compiled[i].component
					var route = compiled[i].route
					var update = lastUpdate = function(routeResolver, comp) {
						if (update !== lastUpdate) return
						component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
						attrs = data.params, currentPath = path, lastUpdate = null
						currentResolver = routeResolver.render ? routeResolver : null
						if (state === 2) mountRedraw.redraw()
						else {
							state = 2
							mountRedraw.redraw.sync()
						}
					}
					if (payload.view || typeof payload === "function") update({}, payload)
					else {
						if (payload.onmatch) {
							Promise.resolve(payload.onmatch(data.params, path, route)).then(function(resolved) {
								update(payload, resolved)
							}, function () {
								if (path === defaultRoute) throw new Error("Could not resolve default route " + defaultRoute)
								setPath(defaultRoute, null, {replace: true})
							})
						}
						else update(payload, "div")
					}
					return
				}
			}

			if (path === defaultRoute) throw new Error("Could not resolve default route " + defaultRoute)
			setPath(defaultRoute, null, {replace: true})
		}

		if (supportsPushState) {
			onremove = function() {
				$window.removeEventListener("popstate", fireAsync, false)
			}
			$window.addEventListener("popstate", fireAsync = function() {
				if (asyncId) return
				asyncId = callAsync(function() {
					asyncId = null
					resolveRoute()
				})
			}, false)
		} else if (routePrefix[0] === "#") {
			onremove = function() {
				$window.removeEventListener("hashchange", resolveRoute, false)
			}
			$window.addEventListener("hashchange", resolveRoute, false)
		}

		return mountRedraw.mount(root, {
			onbeforeupdate: function() {
				state = state ? 2 : 1
				return !(!state || sentinel === currentResolver)
			},
			oncreate: resolveRoute,
			onremove: onremove,
			view: function() {
				if (!state || sentinel === currentResolver) return
				// Wrap in a fragment to preserve existing key semantics
				var vnode = [Vnode(component, attrs.key, attrs)]
				if (currentResolver) vnode = currentResolver.render(vnode[0])
				return vnode
			},
		})
	}
	route.set = function(path, data, options) {
		if (lastUpdate != null) {
			options = options || {}
			options.replace = true
		}
		lastUpdate = null
		setPath(path, data, options)
	}
	route.get = function() {return currentPath}
	route.prefix = function(prefix) {routePrefix = prefix}
	var link = function(options, vnode) {
		vnode.dom.setAttribute("href", routePrefix + vnode.attrs.href)
		vnode.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault()
			e.redraw = false
			var href = this.getAttribute("href")
			if (href.indexOf(routePrefix) === 0) href = href.slice(routePrefix.length)
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
