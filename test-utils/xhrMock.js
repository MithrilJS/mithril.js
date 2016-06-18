"use strict"

var callAsync = require("../test-utils/callAsync")
var parseURL = require("../test-utils/parseURL")
var parseQueryString = require("../querystring/parse")

module.exports = function() {
	var routes = {}
	var callback = "callback"
	var serverErrorHandler = function() {
		return {status: 500, responseText: "server error, most likely the URL was not defined"}
	}

	var $window = {
		XMLHttpRequest: function XMLHttpRequest() {
			var args = {}
			this.setRequestHeader = function(header, value) {}
			this.open = function(method, url, async, user, password) {
				var urlData = parseURL(url, {protocol: "http:", hostname: "localhost", port: "", pathname: "/"})
				args.method = method
				args.pathname = urlData.pathname
				args.search = urlData.search
				args.async = async != null ? async : true
				args.user = user
				args.password = password
			}
			this.send = function(body) {
				var self = this
				var handler = routes[args.method + " " + args.pathname] || serverErrorHandler
				var data = handler({url: args.pathname, query: args.search || {}, body: body || null})
				self.readyState = 4
				self.status = data.status
				self.responseText = data.responseText
				if (args.async === true) {
					var s = new Date
					callAsync(function() {
						if (typeof self.onreadystatechange === "function") self.onreadystatechange()
					})
				}
			}
		},
		document: {
			createElement: function(tag) {
				return {nodeName: tag.toUpperCase(), parentNode: null}
			},
			documentElement: {
				appendChild: function(element) {
					element.parentNode = this
					if (element.nodeName === "SCRIPT") {
						var urlData = parseURL(element.src, {protocol: "http:", hostname: "localhost", port: "", pathname: "/"})
						var handler = routes["GET " + urlData.pathname] || serverErrorHandler
						var data = handler({url: urlData.pathname, query: urlData.search, body: null})
						var query = parseQueryString(urlData.search)
						callAsync(function() {
							if (data.status === 200) {
								new Function("$window", "with ($window) return " + data.responseText).call($window, $window)
							}
							else if (typeof element.onerror === "function") {
								element.onerror({type: "error"})
							}
						})
					}
				},
				removeChild: function(element) {
					element.parentNode = null
				},
			},
		},
		$defineRoutes: function(rules) {
			routes = rules
		},
		$defineJSONPCallbackKey: function(key) {
			callback = key
		},
	}
	return $window
}
