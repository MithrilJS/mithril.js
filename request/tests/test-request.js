"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var xhrMock = require("../../test-utils/xhrMock")
var Request = require("../../request/request")
var Promise = require("../../promise/promise")

o.spec("xhr", function() {
	var mock, xhr, complete
	o.beforeEach(function() {
		mock = xhrMock()
		var requestService = Request(mock, Promise)
		xhr = requestService.request
		complete = o.spy()
		requestService.setCompletionCallback(complete)
	})

	o.spec("success", function() {
		o("works via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({method: "GET", url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(function() {
				done()
			})
		})
		o("implicit GET method", function(done){
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(function() {
				done()
			})
		})
		o("first argument can be a string aliasing url property", function(done){
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr("/item").then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(function() {
				done()
			})
		})
		o("works via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr({method: "POST", url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(done)
		})
		o("first argument can act as URI with second argument providing options", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			xhr("/item", {method: "POST"}).then(function(data) {
				o(data).deepEquals({a: 1})
			}).then(done)
		})
		o("works w/ parameterized data via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "?x=y"})
			}).then(done)
		})
		o("works w/ parameterized data via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: {x: "y"}})
			}).then(done)
		})
		o("works w/ parameterized data containing colon via GET", function(done) {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			xhr({method: "GET", url: "/item", data: {x: ":y"}}).then(function(data) {
				o(data).deepEquals({a: "?x=%3Ay"})
			}).then(done)
		})
		o("works w/ parameterized data containing colon via POST", function(done) {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item", data: {x: ":y"}}).then(function(data) {
				o(data).deepEquals({a: {x: ":y"}})
			}).then(done)
		})
		o("works w/ parameterized url via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query})}
				}
			})
			xhr({method: "GET", url: "/item/:x", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: "?x=y"})
			}).then(done)
		})
		o("works w/ parameterized url via POST", function(done) {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/item/:x", data: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {x: "y"}})
			}).then(done)
		})
		o("works w/ array", function(done) {
			mock.$defineRoutes({
				"POST /items": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
				}
			})
			xhr({method: "POST", url: "/items", data: [{x: "y"}]}).then(function(data) {
				o(data).deepEquals({a: "/items", b: [{x: "y"}]})
			}).then(done)
		})
		o("ignores unresolved parameter via GET", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			xhr({method: "GET", url: "/item/:x"}).then(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).then(done)
		})
		o("ignores unresolved parameter via POST", function(done) {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			xhr({method: "GET", url: "/item/:x"}).then(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			}).then(done)
		})
		o("type parameter works for Array responses", function(done) {
			var Entity = function(args) {
				return {_id: args.id}
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify([{id: 1}, {id: 2}, {id: 3}])}
				}
			})
			xhr({method: "GET", url: "/item", type: Entity}).then(function(data) {
				o(data).deepEquals([{_id: 1}, {_id: 2}, {_id: 3}])
			}).then(done)
		})
		o("type parameter works for Object responses", function(done) {
			var Entity = function(args) {
				return {_id: args.id}
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({id: 1})}
				}
			})
			xhr({method: "GET", url: "/item", type: Entity}).then(function(data) {
				o(data).deepEquals({_id: 1})
			}).then(done)
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
			xhr({method: "GET", url: "/item", serialize: serialize, data: {id: 1}}).then(function(data) {
				o(data.body).equals("?id=1")
			}).then(done)
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
			xhr({method: "POST", url: "/item", serialize: serialize, data: {id: 1}}).then(function(data) {
				o(data.body).equals("id=1")
			}).then(done)
		})
		o("deserialize parameter works in GET", function(done) {
			var deserialize = function(data) {
				return data
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({test: 123})}
				}
			})
			xhr({method: "GET", url: "/item", deserialize: deserialize}).then(function(data) {
				o(data).equals('{"test":123}')
			}).then(done)
		})
		o("deserialize parameter works in POST", function(done) {
			var deserialize = function(data) {
				return data
			}

			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({test: 123})}
				}
			})
			xhr({method: "POST", url: "/item", deserialize: deserialize}).then(function(data) {
				o(data).equals('{"test":123}')
			}).then(done)
		})
		o("extract parameter works in GET", function(done) {
			var extract = function() {
				return JSON.stringify({test: 123})
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "GET", url: "/item", extract: extract}).then(function(data) {
				o(data).equals('{"test":123}')
			}).then(done)
		})
		o("extract parameter works in POST", function(done) {
			var extract = function() {
				return JSON.stringify({test: 123})
			}

			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", extract: extract}).then(function(data) {
				o(data).equals('{"test":123}')
			}).then(done)
		})
		o("ignores deserialize if extract is defined", function(done) {
			var extract = function(data) {
				return data.status
			}
			var deserialize = o.spy()

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "GET", url: "/item", extract: extract, deserialize: deserialize}).then(function(data) {
				o(data).equals(200)
			}).then(function() {
				o(deserialize.callCount).equals(0)
			}).then(done)
		})
		o("config parameter works", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", config: config}).then(done)

			function config(xhr) {
				o(typeof xhr.setRequestHeader).equals("function")
				o(typeof xhr.open).equals("function")
				o(typeof xhr.send).equals("function")
			}
		})
		o("requests don't block each other", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			xhr("/item").then(function() {
				return xhr("/item")
			})
			xhr("/item").then(function() {
				return xhr("/item")
			})
			setTimeout(function() {
				o(complete.callCount).equals(4)
				done()
			}, 20)
		})
		o("requests trigger finally once with a chained then", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			var promise = xhr("/item")
			promise.then(function() {}).then(function() {})
			promise.then(function() {}).then(function() {})
			setTimeout(function() {
				o(complete.callCount).equals(1)
				done()
			}, 20)
		})
		o("requests does not trigger finally when background: true", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			xhr("/item", {background: true}).then(function() {})

			setTimeout(function() {
				o(complete.callCount).equals(0)
				done()
			}, 20)
		})
		o("headers are set when header arg passed", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", config: config, headers: {"Custom-Header": "Value"}}).then(done)

			function config(xhr) {
				o(xhr.getRequestHeader("Custom-Header")).equals("Value")
			}
		})
		o("headers are with higher precedence than default headers", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", config: config, headers: {"Content-Type": "Value"}}).then(done)

			function config(xhr) {
				o(xhr.getRequestHeader("Content-Type")).equals("Value")
			}
		})
		o("json headers are set to the correct default value", function(done) {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			xhr({method: "POST", url: "/item", config: config}).then(done)

			function config(xhr) {
				o(xhr.getRequestHeader("Content-Type")).equals("application/json; charset=utf-8")
				o(xhr.getRequestHeader("Accept")).equals("application/json, text/*")
			}
		})
		o("doesn't fail on abort", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})

			var failed = false
			var resolved = false
			function handleAbort(xhr) {
				var onreadystatechange = xhr.onreadystatechange // probably not set yet
				var testonreadystatechange = function() {
					onreadystatechange.call(xhr)
					setTimeout(function() { // allow promises to (not) resolve first
						o(failed).equals(false)
						o(resolved).equals(false)
						done()
					}, 0)
				}
				Object.defineProperty(xhr, "onreadystatechange", {
					set: function(val) { onreadystatechange = val },
					get: function() { return testonreadystatechange }
				})
				xhr.abort()
			}
			xhr({method: "GET", url: "/item", config: handleAbort}).catch(function() {
				failed = true
			})
			.then(function() {
				resolved = true
			})
		})
		o("doesn't fail on file:// status 0", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 0, responseText: JSON.stringify({a: 1})}
				}
			})
			var failed = false
			xhr({method: "GET", url: "file:///item"}).catch(function() {
				failed = true
			}).then(function(data) {
				o(failed).equals(false)
				o(data).deepEquals({a: 1})
			}).then(function() {
				done()
			})
		})
		/*o("data maintains after interpolate", function() {
			mock.$defineRoutes({
				"PUT /items/:x": function() {
					return {status: 200, responseText: ""}
				}
			})
			var data = {x: 1, y: 2}
			var dataCopy = Object.assign({}, data);
			xhr({method: "PUT", url: "/items/:x", data})

			o(data).deepEquals(dataCopy)
		})*/
	})
	o.spec("failure", function() {
		o("rejects on server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: JSON.stringify({error: "error"})}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e instanceof Error).equals(true)
				o(e.message).equals(JSON.stringify({error: "error"}))
			}).then(done)
		})
		o("extends Error with JSON response", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: JSON.stringify({message: "error", stack: "error on line 1"})}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e instanceof Error).equals(true)
				o(e.message).equals("error")
				o(e.stack).equals("error on line 1")
			}).then(done)
		})
		o("rejects on non-JSON server error", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: "error"}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e.message).equals("error")
			}).then(done)
		})
		o("triggers all branched catches upon rejection", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: "error"}
				}
			})
			var request = xhr({method: "GET", url: "/item"})
			var then = o.spy()
			var catch1 = o.spy()
			var catch2 = o.spy()
			var catch3 = o.spy()

			request.catch(catch1)
			request.then(then, catch2)
			request.then(then).catch(catch3)

			callAsync(function() {
				callAsync(function() {
					o(catch1.callCount).equals(1)
					o(then.callCount).equals(0)
					o(catch2.callCount).equals(1)
					o(catch3.callCount).equals(1)
					done()
				})
			})
		})
		o("rejects on cors-like error", function(done) {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 0}
				}
			})
			xhr({method: "GET", url: "/item"}).catch(function(e) {
				o(e instanceof Error).equals(true)
			}).then(done)
		})
	})
})
