"use strict"

var buildQueryString = require("../querystring/build")
var parseQueryString = require("../querystring/parse")

module.exports = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function"
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout

	var prefix = "#!"
	function setPrefix(value) {prefix = value}

	function normalize(fragment) {
		var data = $window.location[fragment].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		if (fragment === "pathname" && data[0] !== "/") data = "/" + data
		return data
	}

	function parsePath(path, queryData, hashData) {
		var queryIndex = path.indexOf("?")
		var hashIndex = path.indexOf("#")
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
			for (var key in queryParams) queryData[key] = queryParams[key]
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1))
			for (var key in hashParams) hashData[key] = hashParams[key]
		}
		return path.slice(0, pathEnd)
	}

	function getPath() {
		var type = prefix.charAt(0)
		switch (type) {
			case "#": return normalize("hash").slice(prefix.length)
			case "?": return normalize("search").slice(prefix.length) + normalize("hash")
			default: return normalize("pathname").slice(prefix.length) + normalize("search") + normalize("hash")
		}
	}

	function setPath(path, data, options) {
		var queryData = {}, hashData = {}
		path = parsePath(path, queryData, hashData)
		if (data != null) {
			for (var key in data) queryData[key] = data[key]
			path = path.replace(/:([^\/]+)/g, function(match, token) {
				delete queryData[token]
				return data[token]
			})
		}

		var query = buildQueryString(queryData)
		if (query) path += "?" + query

		var hash = buildQueryString(hashData)
		if (hash) path += "#" + hash

		if (supportsPushState) {
			if (options && options.replace) $window.history.replaceState(null, null, prefix + path)
			else $window.history.pushState(null, null, prefix + path)
			$window.onpopstate()
		}
		else $window.location.href = prefix + path
	}

	function defineRoutes(routes, resolve, reject, onbeforeresolve) {
		var path, params, route, payload

		if (supportsPushState) $window.onpopstate = resolveRoute
		else if (prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
		resolveRoute()
		
		function resolveRoute() {
			path = getPath()
			params = {}
			var pathname = parsePath(path, params, params)
			
			callAsync(function() {
				if (onbeforeresolve) onbeforeresolve()
				for (route in routes) {
					var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

					if (matcher.test(pathname)) {
						pathname.replace(matcher, function() {
							var keys = route.match(/:[^\/]+/g) || []
							var values = [].slice.call(arguments, 1, -2)
							for (var i = 0; i < keys.length; i++) {
								params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
							}
							payload = routes[route]
							finalizeResolution()
						})
						return
					}
				}

				reject(path, params)
			})
		}

		function finalizeResolution() {
			resolve(payload, params, path, route)
		}

		return finalizeResolution
	}

	function link(vnode) {
		vnode.dom.setAttribute("href", prefix + vnode.attrs.href)
		vnode.dom.onclick = function(e) {
			e.preventDefault()
			e.redraw = false
			setPath(vnode.attrs.href, undefined, undefined)
		}
	}

	return {setPrefix: setPrefix, getPath: getPath, setPath: setPath, defineRoutes: defineRoutes, link: link}
}
