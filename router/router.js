"use strict"

var buildQueryString = require("../querystring/build")
var parseQueryString = require("../querystring/parse")

module.exports = function($window, prefix) {
	var supportsPushState = typeof $window.history.pushState === "function" && $window.location.protocol !== "file:"

	function parsePath(path) {
		var params = {}
		var queryIndex = path.indexOf("?")
		var hashIndex = path.indexOf("#")
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
			for (var key in queryParams) params[key] = queryParams[key]
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1))
			for (var key in hashParams) params[key] = hashParams[key]
		}
		return {name: path.slice(0, pathEnd), params: params}
	}

	function getPath() {
		var type = prefix.charAt(0)
		switch (type) {
			case "#": return $window.location.hash.slice(prefix.length)
			case "?": return $window.location.search.slice(prefix.length) + $window.location.hash
			default: return $window.location.pathname + $window.location.search + $window.location.hash
		}
	}

	function setPath(path, data, options) {
		if (supportsPushState) {
			var queryData = {}
			if (data != null) {
				for (var key in data) queryData[key] = data[key]
				path = path.replace(/:([^\/]+)/g, function(match, token) {
					delete queryData[token]
					return data[token]
				})
			}
			
			var query = buildQueryString(queryData)
			if (query) path = path + "?" + query
			
			if (options && options.replace) $window.history.replaceState(null, null, prefix + path)
			else $window.history.pushState(null, null, prefix + path)
			$window.onpopstate()
		}
		else $window.location.href = prefix + path
	}
	
	function defineRoutes(routes, resolve, reject) {
		if (supportsPushState) $window.onpopstate = resolveRoute
		else if (prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
		resolveRoute()
		
		function resolveRoute(e) {
			var path = getPath()
			var data = parsePath(path)
			
			for (var route in routes) {
				var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")
				
				if (matcher.test(data.name)) {
					data.name.replace(matcher, function() {
						var keys = route.match(/:[^\/]+/g) || []
						var values = [].slice.call(arguments, 1, -2)
						for (var i = 0; i < keys.length; i++) {
							data.params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
						}
						resolve(routes[route], data.params, path, route)
					})
					return
				}
			}
			
			reject(path, data.params)
		}
		return resolveRoute
	}
	
	return {getPath: getPath, setPath: setPath, defineRoutes: defineRoutes}
}