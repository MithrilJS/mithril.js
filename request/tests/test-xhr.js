"use strict"

var o = require("../../ospec/ospec")
var xhrMock = require("../../test-utils/xhrMock")
var Request = require("../../request/request")

o.spec("xhr", function() {
	var mock, xhr
	o.beforeEach(function() {
		mock = xhrMock()
		xhr = new Request(mock).xhr
	})

	o.spec("success", function() {
		o("works via GET", function(done) {
			var s = new Date
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({method: "GET", url: "/item"}).map(function(data) {
				o(data).deepEquals({a: 1})
			}).map(function() {
				done()
			})
		})
		o("works via POST", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({method: "GET", url: "/item"}).map(function(data) {
				o(data).deepEquals({a: 1})
			}).map(done)
		})
		o("works w/ parameterized data via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", data: {x: "y"}}).map(function(data) {
				o(data).deepEquals({a: "?x=y"})
			}).map(done)
		})
		o("works w/ parameterized data via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item", data: {x: "y"}}).map(function(data) {
				o(data).deepEquals({a: {x: "y"}})
			}).map(done)
		})
		o("works w/ parameterized data containing colon via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", data: {x: ":y"}}).map(function(data) {
				o(data).deepEquals({a: "?x=%3Ay"})
			}).map(done)
		})
		o("works w/ parameterized data containing colon via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item", data: {x: ":y"}}).map(function(data) {
				o(data).deepEquals({a: {x: ":y"}})
			}).map(done)
		})
		o("works w/ parameterized url via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query})}
				}
			})
			xhr({method: "GET", url: "/item/:x", data: {x: "y"}}).map(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}})
			}).map(done)
		})
		o("works w/ parameterized url via POST", function(done) {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item/:x", data: {x: "y"}}).map(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}})
			}).map(done)
		})
		o("ignores unresolved parameter via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			xhr({method: "GET", url: "/item/:x"}).map(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).map(done)
		})
		o("ignores unresolved parameter via POST", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			xhr({method: "GET", url: "/item/:x"}).map(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).map(done)
		})
		o("type parameter works for Array responses", function(done) {
			var Entity = function(args) {
				return {_id: args.id}
			}

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify([{id: 1}, {id: 2}, {id: 3}])}
				}
			})
			xhr({method: "GET", url: "/item", type: Entity}).map(function(data) {
				o(data).deepEquals([{_id: 1}, {_id: 2}, {_id: 3}])
			}).map(done)
		})
		o("type parameter works for Object responses", function(done) {
			var Entity = function(args) {
				return {_id: args.id}
			}

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({id: 1})}
				}
			})
			xhr({method: "GET", url: "/item", type: Entity}).map(function(data) {
				o(data).deepEquals({_id: 1})
			}).map(done)
		})
		o("serialize parameter works in GET", function(done) {
			var serialize = function(data) {
				return "id=" + data.id
			}

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({body: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", serialize: serialize, data: {id: 1}}).map(function(data) {
				o(data.body).equals("?id=1")
			}).map(done)
		})
		o("serialize parameter works in POST", function(done) {
			var serialize = function(data) {
				return "id=" + data.id
			}

			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({body: request.body})}
				}
			})
			xhr({method: "POST", url: "/item", serialize: serialize, data: {id: 1}}).map(function(data) {
				o(data.body).equals("id=1")
			}).map(done)
		})
		o("deserialize parameter works in GET", function(done) {
			var deserialize = function(data) {
				return data
			}

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({test: 123})}
				}
			})
			xhr({method: "GET", url: "/item", deserialize: deserialize}).map(function(data) {
				o(data).equals("{\"test\":123}")
			}).map(done)
		})
		o("deserialize parameter works in POST", function(done) {
			var deserialize = function(data) {
				return data
			}

			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({test: 123})}
				}
			})
			xhr({method: "POST", url: "/item", deserialize: deserialize}).map(function(data) {
				o(data).equals("{\"test\":123}")
			}).map(done)
		})
		o("extract parameter works in GET", function(done) {
			var extract = function(data) {
				return JSON.stringify({test: 123})
			}

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "GET", url: "/item", extract: extract}).map(function(data) {
				o(data).deepEquals({test: 123})
			}).map(done)
		})
		o("extract parameter works in POST", function(done) {
			var extract = function(data) {
				return JSON.stringify({test: 123})
			}

			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", extract: extract}).map(function(data) {
				o(data).deepEquals({test: 123})
			}).map(done)
		})
		o("config parameter works", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", config: config}).map(done)
			
			function config(xhr) {
				o(typeof xhr.setRequestHeader).equals("function")
				o(typeof xhr.open).equals("function")
				o(typeof xhr.send).equals("function")
			}
		})
		o("initialValue parameter works", function() {
			mock.$defineRoutes({
				"GET /items": function() {
					return {status: 200, responseText: JSON.stringify([{a: 1}])}
				}
			})
			var items = xhr({method: "GET", url: "/items", initialValue: []})
			
			o(items()).deepEquals([])
		})
	})
	o.spec("failure", function() {
		o("rejects on server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 500, responseText: JSON.stringify({error: "error"})}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e instanceof Error).equals(true)
				o(e.message).equals(JSON.stringify({error: "error"}))
			}).map(done)
		})
		o("extends Error with JSON response", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 500, responseText: JSON.stringify({message: "error", stack: "error on line 1"})}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e instanceof Error).equals(true)
				o(e.message).equals("error")
				o(e.stack).equals("error on line 1")
			}).map(done)
		})
		o("rejects on non-JSON server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 500, responseText: "error"}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e.message).equals("error")
			}).map(done)
		})
	})
})
