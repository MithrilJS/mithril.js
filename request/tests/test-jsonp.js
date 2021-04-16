"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var xhrMock = require("../../test-utils/xhrMock")
var throttleMocker = require("../../test-utils/throttleMock")
var loadMithril = require("../../test-utils/load").mithril

o.spec("jsonp", function() {
	var mock, jsonp, complete, parseQueryString, throttleMock, Promise

	o.beforeEach(function() {
		var $window = domMock()
		mock = xhrMock()
		complete = o.spy()
		throttleMock = throttleMocker()
		$window.XMLHttpRequest = mock.XMLHttpRequest
		$window.FormData = mock.FormData
		$window.requestAnimationFrame = throttleMock.schedule
		var m = loadMithril({window: $window})
		Promise = $window.Promise
		parseQueryString = m.parseQueryString
		jsonp = function() {
			var promise = m.jsonp.apply(null, arguments)
			mock.$crawlScripts($window)
			return promise
		}
		m.mount($window.document.body, {
			view: complete
		})
	})

	o("works", function() {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "(" + JSON.stringify({a: 1}) + ")"}
			}
		})
		return jsonp({url: "/item"}).then(function(data) {
			o(data).deepEquals({a: 1})
		})
	})
	o("first argument can be a string aliasing url property", function(){
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "(" + JSON.stringify({a: 1}) + ")"}
			}
		})
		return jsonp("/item").then(function(data) {
			o(data).deepEquals({a: 1})
		})
	})
	o("works w/ other querystring params", function() {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "(" + JSON.stringify(queryData) + ")"}
			}
		})
		return jsonp({url: "/item", params: {a: "b", c: "d"}}).then(function(data) {
			delete data["callback"]
			o(data).deepEquals({a: "b", c: "d"})
		})
	})
	o("works w/ custom callbackKey", function() {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["cb"] + "(" + JSON.stringify({a: 2}) + ")"}
			}
		})
		return jsonp({url: "/item", callbackKey: "cb"}).then(function(data) {
			o(data).deepEquals({a: 2})
		})
	})
	o("requests don't block each other", function() {
		var executed = 0
		mock.$defineRoutes({
			"GET /item": function(request) {
				executed++
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "([])"}
			}
		})
		o(complete.callCount).equals(1)
		return Promise.all([
			jsonp("/item").then(function() {
				return jsonp("/item")
			}),
			jsonp("/item").then(function() {
				return jsonp("/item")
			})
		]).then(function() {
			o(executed).equals(4)
			o(complete.callCount).equals(1)
			throttleMock.fire()
			o(complete.callCount).equals(2)
		})
	})
	o("requests trigger finally once with a chained then", function() {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "([])"}
			}
		})
		o(complete.callCount).equals(1)
		var promise = jsonp("/item")
		promise.then(function() {}).then(function() {})
		promise.then(function() {}).then(function() {})
		o(complete.callCount).equals(1)
		return Promise.resolve(promise)
			// Wait an extra microtask for the above chains to resolve
			.then(function() { return Promise.resolve() })
			.then(function() {
				o(complete.callCount).equals(1)
				throttleMock.fire()
				o(complete.callCount).equals(2)
			})
	})
	o("requests does not trigger finally when background: true", function() {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "([])"}
			}
		})
		o(complete.callCount).equals(1)
		var promise = jsonp("/item", {background: true}).then(function() {})
		o(complete.callCount).equals(1)
		return Promise.resolve(promise).then(function() {
			o(complete.callCount).equals(1)
			throttleMock.fire()
			o(complete.callCount).equals(1)
		})
	})
	o("handles error", function() {
		return jsonp({url: "/item", callbackKey: "cb"}).catch(function(e) {
			o(e.message).equals("JSONP request failed")
		})
	})
})
