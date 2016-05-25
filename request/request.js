"use strict"

var buildQueryString = require("../querystring/build")

module.exports = function($window, Promise) {
	var callbackCount = 0

	function ajax(args) {
		return new Promise(function(resolve, reject) {
			var useBody = args.useBody != null ? args.useBody : args.method !== "GET" && args.method !== "TRACE"
			
			if (typeof args.serialize !== "function") args.serialize = JSON.stringify
			if (typeof args.deserialize !== "function") args.deserialize = deserialize
			if (typeof args.extract !== "function") args.extract = extract
			
			args.url = interpolate(args.url, args.data)
			if (useBody) args.data = args.serialize(args.data)
			else args.url = assemble(args.url, args.data)
			
			var xhr = new $window.XMLHttpRequest()
			xhr.open(args.method, args.url, args.async || true, args.user, args.password)
			
			if (args.serialize === JSON.stringify && useBody) {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
			}
			if (args.deserialize === deserialize) {
				xhr.setRequestHeader("Accept", "application/json, text/*")
			}
			
			if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr
			
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4) {
					try {
						var response = args.deserialize(args.extract(xhr, args))
						if (xhr.status >= 200 && xhr.status < 300) {
							if (typeof args.type === "function") {
								if (response instanceof Array) {
									for (var i = 0; i < response.length; i++) {
										response[i] = new args.type(response[i])
									}
								}
								else response = new args.type(response)
							}
							
							resolve(response)
						}
						else reject(new Error(xhr.responseText))
					}
					catch (e) {
						reject(e)
					}
				}
			}
			
			if (useBody) xhr.send(args.data)
			else xhr.send()
		})
	}

	function jsonp(args) {
		return new Promise(function(resolve, reject) {
			var callbackKey = "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
			var script = $window.document.createElement("script")
			$window[callbackKey] = function(data) {
				script.parentNode.removeChild(script)
				resolve(data)
				$window[callbackKey] = undefined
			}
			script.onerror = function() {
				script.parentNode.removeChild(script)
				reject(new Error("JSONP request failed"))
				$window[callbackKey] = undefined
			}
			if (args.data == null) args.data = {}
			args.url = interpolate(args.url, args.data)
			args.data[args.callbackKey || "callback"] = callbackKey
			script.src = assemble(args.url, args.data)
			$window.document.documentElement.appendChild(script)
		})
	}

	function interpolate(url, data) {
		if (data == null) return url
		
		var tokens = url.match(/:[^\/]+/gi) || []
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1)
			if (data[key] != null) {
				url = url.replace(tokens[i], data[key])
				delete data[key]
			}
		}
		return url
	}

	function assemble(url, data) {
		var querystring = buildQueryString(data)
		if (querystring !== "") {
			var prefix = url.indexOf("?") < 0 ? "?" : "&"
			url += prefix + querystring
		}
		return url
	}

	function deserialize(data) {
		try {return data !== "" ? JSON.parse(data) : null}
		catch (e) {throw new Error(data)}
	}

	function extract(xhr) {return xhr.responseText}
	
	return {ajax: ajax, jsonp: jsonp}
}
