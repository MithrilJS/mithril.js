"use strict"

var o = require("../../ospec/ospec")
var xhrMock = require("../../test-utils/xhrMock")
var Request = require("../../request/request")
var parseQueryString = require("../../querystring/parse")

o.spec("jsonp", function() {
	var mock, jsonp
	o.beforeEach(function() {
		mock = xhrMock()
		jsonp = new Request(mock).jsonp
	})
	
	o("works", function(done) {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "(" + JSON.stringify({a: 1}) + ")"}
			}
		})
		jsonp({url: "/item"}).map(function(data) {
			o(data).deepEquals({a: 1})
		}).map(done)
	})
	o("works w/ other querystring params", function(done) {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["callback"] + "(" + JSON.stringify(queryData) + ")"}
			}
		})
		jsonp({url: "/item", data: {a: "b", c: "d"}}).map(function(data) {
			delete data["callback"]
			o(data).deepEquals({a: "b", c: "d"})
		}).map(done)
	})
	o("works w/ custom callbackKey", function(done) {
		mock.$defineRoutes({
			"GET /item": function(request) {
				var queryData = parseQueryString(request.query)
				return {status: 200, responseText: queryData["cb"] + "(" + JSON.stringify({a: 2}) + ")"}
			}
		})
		jsonp({url: "/item", callbackKey: "cb"}).map(function(data) {
			o(data).deepEquals({a: 2})
		}).map(done)
	})
	o("handles error", function(done) {
		jsonp({url: "/item", callbackKey: "cb"}).catch(function(e) {
			o(e.message).equals("JSONP request failed")
			done()
		})
	})
})