"use strict"

var o = require("../../ospec/ospec")
var xhrMock = require("../../test-utils/xhrMock")
var Request = require("../../request/request")
var StreamFactory = require("../../util/stream")

o.spec("xhr", function() {
	var mock, xhr, spy
	o.beforeEach(function() {
		mock = xhrMock()
		spy = o.spy()
		xhr = new Request(mock, StreamFactory(spy)).request
	})

	o.spec("success", function() {
		o("works via GET", function(done) {
			var s = new Date
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({method: "GET", url: "/item"}).run(function(data) {
				o(data).deepEquals({a: 1})
			}).run(function() {
				done()
			})
		})
		o("implicit GET method", function(done){
			var s = new Date
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({url: "/item"}).run(function(data) {
				o(data).deepEquals({a: 1})
			}).run(function() {
				done()
			})
		})
		o("first argument can be a string aliasing url property", function(done){
			var s = new Date
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr("/item").run(function(data) {
				o(data).deepEquals({a: 1})
			}).run(function() {
				done()
			})
		})
		o("works via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({method: "POST", url: "/item"}).run(function(data) {
				o(data).deepEquals({a: 1})
			}).run(done)
		})
		o("first argument can act as URI with second argument providing options", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr("/item", {method: "POST"}).run(function(data) {
				o(data).deepEquals({a: 1})
			}).run(done)
		})
		o("works w/ parameterized data via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", data: {x: "y"}}).run(function(data) {
				o(data).deepEquals({a: "?x=y"})
			}).run(done)
		})
		o("works w/ parameterized data via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item", data: {x: "y"}}).run(function(data) {
				o(data).deepEquals({a: {x: "y"}})
			}).run(done)
		})
		o("works w/ parameterized data containing colon via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", data: {x: ":y"}}).run(function(data) {
				o(data).deepEquals({a: "?x=%3Ay"})
			}).run(done)
		})
		o("works w/ parameterized data containing colon via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item", data: {x: ":y"}}).run(function(data) {
				o(data).deepEquals({a: {x: ":y"}})
			}).run(done)
		})
		o("works w/ parameterized url via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query})}
				}
			})
			xhr({method: "GET", url: "/item/:x", data: {x: "y"}}).run(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}})
			}).run(done)
		})
		o("works w/ parameterized url via POST", function(done) {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item/:x", data: {x: "y"}}).run(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}})
			}).run(done)
		})
		o("ignores unresolved parameter via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			xhr({method: "GET", url: "/item/:x"}).run(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).run(done)
		})
		o("ignores unresolved parameter via POST", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			xhr({method: "GET", url: "/item/:x"}).run(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).run(done)
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
			xhr({method: "GET", url: "/item", type: Entity}).run(function(data) {
				o(data).deepEquals([{_id: 1}, {_id: 2}, {_id: 3}])
			}).run(done)
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
			xhr({method: "GET", url: "/item", type: Entity}).run(function(data) {
				o(data).deepEquals({_id: 1})
			}).run(done)
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
			xhr({method: "GET", url: "/item", serialize: serialize, data: {id: 1}}).run(function(data) {
				o(data.body).equals("?id=1")
			}).run(done)
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
			xhr({method: "POST", url: "/item", serialize: serialize, data: {id: 1}}).run(function(data) {
				o(data.body).equals("id=1")
			}).run(done)
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
			xhr({method: "GET", url: "/item", deserialize: deserialize}).run(function(data) {
				o(data).equals("{\"test\":123}")
			}).run(done)
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
			xhr({method: "POST", url: "/item", deserialize: deserialize}).run(function(data) {
				o(data).equals("{\"test\":123}")
			}).run(done)
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
			xhr({method: "GET", url: "/item", extract: extract}).run(function(data) {
				o(data).equals("{\"test\":123}")
			}).run(done)
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
			xhr({method: "POST", url: "/item", extract: extract}).run(function(data) {
				o(data).equals("{\"test\":123}")
			}).run(done)
		})
		o("ignores deserialize if extract is defined", function(done) {
			var extract = function(data) {
				return data.status
			}
			var deserialize = o.spy()

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "GET", url: "/item", extract: extract, deserialize: deserialize}).run(function(data) {
				o(data).equals(200)
			}).run(function() {
				o(deserialize.callCount).equals(0)
			}).run(done)
		})
		o("config parameter works", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", config: config}).run(done)

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
			}).run(done)
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
			}).run(done)
		})
		o("rejects on non-JSON server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 500, responseText: "error"}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e.message).equals("error")
			}).run(done)
		})
	})
})
