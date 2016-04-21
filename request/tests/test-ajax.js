"use strict"

var o = require("../../ospec/ospec")
var ajaxMock = require("../../test-utils/ajaxMock")
var Request = require("../../request/request")

o.spec("ajax", function() {
	var mock, ajax
	o.beforeEach(function() {
		mock = ajaxMock()
		ajax = new Request(mock, Promise).ajax
	})
	
	o.spec("success", function() {
		o("works via GET", function(done) {
			var s = new Date
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			ajax({method: "GET", url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(function() {
				done()
			})
		})
		o("works via POST", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			ajax({method: "GET", url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(done)
		})
		o("works w/ parameterized data via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			ajax({method: "GET", url: "/item", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "?x=y"})
			}).then(done)
		})
		o("works w/ parameterized data via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			ajax({method: "POST", url: "/item", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: {x: "y"}})
			}).then(done)
		})
		o("works w/ parameterized data containing colon via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			ajax({method: "GET", url: "/item", data: {x: ":y"}}).then(function(data) {
				o(data).deepEquals({a: "?x=%3Ay"})
			}).then(done)
		})
		o("works w/ parameterized data containing colon via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			ajax({method: "POST", url: "/item", data: {x: ":y"}}).then(function(data) {
				o(data).deepEquals({a: {x: ":y"}})
			}).then(done)
		})
		o("works w/ parameterized url via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query})}
				}
			})
			ajax({method: "GET", url: "/item/:x", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}})
			}).then(done)
		})
		o("works w/ parameterized url via POST", function(done) {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
				}
			})
			ajax({method: "POST", url: "/item/:x", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}})
			}).then(done)
		})
		o("ignores unresolved parameter via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			ajax({method: "GET", url: "/item/:x"}).then(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).then(done)
		})
		o("ignores unresolved parameter via POST", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			ajax({method: "GET", url: "/item/:x"}).then(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).then(done)
		})
	})
	o.spec("failure", function() {
		o("rejects on server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 500, responseText: JSON.stringify({error: "error"})}
				}
			})
			ajax({method: "GET", url: "/item"}).catch(function(e) {
				o(e.message).equals(JSON.stringify({error: "error"}))
			}).then(done)
		})
		o("rejects on non-JSON server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 500, responseText: "error"}
				}
			})
			ajax({method: "GET", url: "/item"}).catch(function(e) {
				o(e.message).equals("error")
			}).then(done)
		})
	})
})