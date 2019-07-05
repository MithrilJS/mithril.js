"use strict"

var buildPathname = require("../pathname/build")
var parsePathname = require("../pathname/parse")
var compileTemplate = require("../pathname/compileTemplate")
var assign = require("../pathname/assign")

module.exports = function($window) {
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout
	var supportsPushState = typeof $window.history.pushState === "function"
	var fireAsync

	return {
		prefix: "#!",

		getPath: function() {
			// Consider the pathname holistically. The prefix might even be invalid,
			// but that's not our problem.
			var prefix = $window.location.hash
			if (this.prefix[0] !== "#") {
				prefix = $window.location.search + prefix
				if (this.prefix[0] !== "?") {
					prefix = $window.location.pathname + prefix
					if (prefix[0] !== "/") prefix = "/" + prefix
				}
			}
			// This seemingly useless `.concat()` speeds up the tests quite a bit,
			// since the representation is consistently a relatively poorly
			// optimized cons string.
			return prefix.concat()
				.replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
				.slice(this.prefix.length)
		},

		setPath: function(path, data, options) {
			path = buildPathname(path, data)
			if (fireAsync != null) {
				fireAsync()
				var state = options ? options.state : null
				var title = options ? options.title : null
				if (options && options.replace) $window.history.replaceState(state, title, this.prefix + path)
				else $window.history.pushState(state, title, this.prefix + path)
			}
			else {
				$window.location.href = this.prefix + path
			}
		},

		defineRoutes: function(routes, resolve, reject, defaultRoute, subscribe) {
			var self = this
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
			var unsubscribe, asyncId

			fireAsync = null

			if (defaultRoute != null) {
				var defaultData = parsePathname(defaultRoute)

				if (!compiled.some(function (i) { return i.check(defaultData) })) {
					throw new ReferenceError("Default route doesn't match any known routes")
				}
			}

			function resolveRoute() {
				var path = self.getPath()
				var data = parsePathname(path)

				assign(data.params, $window.history.state)

				for (var i = 0; i < compiled.length; i++) {
					if (compiled[i].check(data)) {
						resolve(compiled[i].component, data.params, path, compiled[i].route)
						return
					}
				}

				reject(path, data.params)
			}

			if (supportsPushState) {
				unsubscribe = function() {
					$window.removeEventListener("popstate", fireAsync, false)
				}
				$window.addEventListener("popstate", fireAsync = function() {
					if (asyncId) return
					asyncId = callAsync(function() {
						asyncId = null
						resolveRoute()
					})
				}, false)
			} else if (this.prefix[0] === "#") {
				unsubscribe = function() {
					$window.removeEventListener("hashchange", resolveRoute, false)
				}
				$window.addEventListener("hashchange", resolveRoute, false)
			}

			subscribe(unsubscribe)
			resolveRoute()
		},
	}
}
