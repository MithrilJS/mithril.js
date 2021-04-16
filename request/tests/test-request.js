"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var xhrMock = require("../../test-utils/xhrMock")
var throttleMocker = require("../../test-utils/throttleMock")
var loadMithril = require("../../test-utils/load").mithril
var utils = require("../../test-utils/utils")

o.spec("request", function() {
	var mock, $window, request, complete, throttleMock
	o.beforeEach(function() {
		$window = domMock()
		mock = xhrMock()
		complete = o.spy()
		throttleMock = throttleMocker()
		$window.XMLHttpRequest = mock.XMLHttpRequest
		$window.FormData = mock.FormData
		$window.requestAnimationFrame = throttleMock.schedule
		var m = loadMithril({window: $window})
		request = m.request
		m.mount($window.document.body, {
			view: function() {},
			onupdate: complete,
		})
	})

	o.spec("success", function() {
		o("works via GET", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({method: "GET", url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("implicit GET method", function(){
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("first argument can be a string aliasing url property", function(){
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request("/item").then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("works via POST", function() {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({method: "POST", url: "/item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("first argument can act as URI with second argument providing options", function() {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request("/item", {method: "POST"}).then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("first argument keeps protocol", function() {
			mock.$defineRoutes({
				"POST /item": function(request) {
					o(request.rawUrl).equals("https://example.com/item")
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request("https://example.com/item", {method: "POST"}).then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("works w/ parameterized data via GET", function() {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			return request({method: "GET", url: "/item", params: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "?x=y"})
			})
		})
		o("works w/ parameterized data via POST", function() {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			return request({method: "POST", url: "/item", body: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: {x: "y"}})
			})
		})
		o("works w/ parameterized data containing colon via GET", function() {
			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.query})}
				}
			})
			return request({method: "GET", url: "/item", params: {x: ":y"}}).then(function(data) {
				o(data).deepEquals({a: "?x=%3Ay"})
			})
		})
		o("works w/ parameterized data containing colon via POST", function() {
			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({a: JSON.parse(request.body)})}
				}
			})
			return request({method: "POST", url: "/item", body: {x: ":y"}}).then(function(data) {
				o(data).deepEquals({a: {x: ":y"}})
			})
		})
		o("works w/ parameterized url via GET", function() {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
				}
			})
			return request({method: "GET", url: "/item/:x", params: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}, c: null})
			})
		})
		o("works w/ parameterized url via POST", function() {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
				}
			})
			return request({method: "POST", url: "/item/:x", params: {x: "y"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}, c: null})
			})
		})
		o("works w/ parameterized url + body via GET", function() {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
				}
			})
			return request({method: "GET", url: "/item/:x", params: {x: "y"}, body: {a: "b"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}, c: {a: "b"}})
			})
		})
		o("works w/ parameterized url + body via POST", function() {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
				}
			})
			return request({method: "POST", url: "/item/:x", params: {x: "y"}, body: {a: "b"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: {}, c: {a: "b"}})
			})
		})
		o("works w/ parameterized url + query via GET", function() {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
				}
			})
			return request({method: "GET", url: "/item/:x", params: {x: "y", q: "term"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: "?q=term", c: null})
			})
		})
		o("works w/ parameterized url + query via POST", function() {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: request.body})}
				}
			})
			return request({method: "POST", url: "/item/:x", params: {x: "y", q: "term"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: "?q=term", c: null})
			})
		})
		o("works w/ parameterized url + query + body via GET", function() {
			mock.$defineRoutes({
				"GET /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
				}
			})
			return request({method: "GET", url: "/item/:x", params: {x: "y", q: "term"}, body: {a: "b"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: "?q=term", c: {a: "b"}})
			})
		})
		o("works w/ parameterized url + query + body via POST", function() {
			mock.$defineRoutes({
				"POST /item/y": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: request.query, c: JSON.parse(request.body)})}
				}
			})
			return request({method: "POST", url: "/item/:x", params: {x: "y", q: "term"}, body: {a: "b"}}).then(function(data) {
				o(data).deepEquals({a: "/item/y", b: "?q=term", c: {a: "b"}})
			})
		})
		o("works w/ array", function() {
			mock.$defineRoutes({
				"POST /items": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url, b: JSON.parse(request.body)})}
				}
			})
			return request({method: "POST", url: "/items", body: [{x: "y"}]}).then(function(data) {
				o(data).deepEquals({a: "/items", b: [{x: "y"}]})
			})
		})
		o("ignores unresolved parameter via GET", function() {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			return request({method: "GET", url: "/item/:x"}).then(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			})
		})
		o("ignores unresolved parameter via POST", function() {
			mock.$defineRoutes({
				"GET /item/:x": function(request) {
					return {status: 200, responseText: JSON.stringify({a: request.url})}
				}
			})
			return request({method: "GET", url: "/item/:x"}).then(function(data) {
				o(data).deepEquals({a: "/item/:x"})
			})
		})
		o("type parameter works for Array responses", function() {
			var Entity = function(args) {
				return {_id: args.id}
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify([{id: 1}, {id: 2}, {id: 3}])}
				}
			})
			return request({method: "GET", url: "/item", type: Entity}).then(function(data) {
				o(data).deepEquals([{_id: 1}, {_id: 2}, {_id: 3}])
			})
		})
		o("type parameter works for Object responses", function() {
			var Entity = function(args) {
				return {_id: args.id}
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({id: 1})}
				}
			})
			return request({method: "GET", url: "/item", type: Entity}).then(function(data) {
				o(data).deepEquals({_id: 1})
			})
		})
		o("serialize parameter works in GET", function() {
			var serialize = function(data) {
				return "id=" + data.id
			}

			mock.$defineRoutes({
				"GET /item": function(request) {
					return {status: 200, responseText: JSON.stringify({body: request.query})}
				}
			})
			return request({method: "GET", url: "/item", serialize: serialize, params: {id: 1}}).then(function(data) {
				o(data.body).equals("?id=1")
			})
		})
		o("serialize parameter works in POST", function() {
			var serialize = function(data) {
				return "id=" + data.id
			}

			mock.$defineRoutes({
				"POST /item": function(request) {
					return {status: 200, responseText: JSON.stringify({body: request.body})}
				}
			})
			return request({method: "POST", url: "/item", serialize: serialize, body: {id: 1}}).then(function(data) {
				o(data.body).equals("id=1")
			})
		})
		o("deserialize parameter works in GET", function() {
			var deserialize = function(data) {
				return data
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({test: 123})}
				}
			})
			return request({method: "GET", url: "/item", deserialize: deserialize}).then(function(data) {
				o(data).deepEquals({test: 123})
			})
		})
		o("deserialize parameter works in POST", function() {
			var deserialize = function(data) {
				return data
			}

			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({test: 123})}
				}
			})
			return request({method: "POST", url: "/item", deserialize: deserialize}).then(function(data) {
				o(data).deepEquals({test: 123})
			})
		})
		o("extract parameter works in GET", function() {
			var extract = function() {
				return {test: 123}
			}

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			return request({method: "GET", url: "/item", extract: extract}).then(function(data) {
				o(data).deepEquals({test: 123})
			})
		})
		o("extract parameter works in POST", function() {
			var extract = function() {
				return {test: 123}
			}

			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			return request({method: "POST", url: "/item", extract: extract}).then(function(data) {
				o(data).deepEquals({test: 123})
			})
		})
		o("ignores deserialize if extract is defined", function() {
			var extract = function(data) {
				return data.status
			}
			var deserialize = o.spy()

			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			return request({method: "GET", url: "/item", extract: extract, deserialize: deserialize}).then(function(data) {
				o(data).equals(200)
			}).then(function() {
				o(deserialize.callCount).equals(0)
			})
		})
		o("config parameter works", function() {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})

			function config(xhr) {
				o(typeof xhr.setRequestHeader).equals("function")
				o(typeof xhr.open).equals("function")
				o(typeof xhr.send).equals("function")
			}

			return request({method: "POST", url: "/item", config: config})
		})
		o("requests don't block each other", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			request("/item").then(function() {
				return request("/item")
			})
			request("/item").then(function() {
				return request("/item")
			})
			return utils.delay(10).then(function() {
				throttleMock.fire()
				o(complete.callCount).equals(1)
			})
		})
		o("requests trigger finally once with a chained then", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			var promise = request("/item")
			promise.then(function() {}).then(function() {})
			promise.then(function() {}).then(function() {})
			return utils.delay(10).then(function() {
				throttleMock.fire()
				o(complete.callCount).equals(1)
			})
		})
		o("requests does not trigger finally when background: true", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			request("/item", {background: true}).then(function() {})

			return utils.delay(10).then(function() {
				throttleMock.fire()
				o(complete.callCount).equals(0)
			})
		})
		o("headers are set when header arg passed", function() {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})

			function config(xhr) {
				o(xhr.getRequestHeader("Custom-Header")).equals("Value")
			}

			return request({method: "POST", url: "/item", config: config, headers: {"Custom-Header": "Value"}})
		})
		o("headers are with higher precedence than default headers", function() {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: ""}
				}
			})

			function config(xhr) {
				o(xhr.getRequestHeader("Content-Type")).equals("Value")
			}

			return request({method: "POST", url: "/item", config: config, headers: {"Content-Type": "Value"}})
		})
		o("doesn't fail on abort", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})

			var state = "pending"
			return new Promise(function(resolve) {
				request({
					method: "GET",
					url: "/item",
					config: function(xhr) {
						var onreadystatechange = xhr.onreadystatechange
						xhr.onreadystatechange = function() {
							onreadystatechange.call(xhr, {target: xhr})
							resolve()
						}
						xhr.abort()
					}
				}).then(
					function() { state = "resolved" },
					function() { state = "rejected" }
				)
			})
				// allow promises to (not) resolve first
				.then(function() { return utils.delay(10) })
				.then(function() {
					o(state).equals("pending")
				})
		})
		o("doesn't fail on replaced abort", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})

			var state = "pending"
			var abortSpy = o.spy()
			var replacement
			return new Promise(function(resolve) {
				request({
					method: "GET",
					url: "/item",
					config: function(xhr) {
						var onreadystatechange = xhr.onreadystatechange
						xhr.onreadystatechange = function() {
							onreadystatechange.call(xhr, {target: xhr})
							resolve()
						}
						return replacement = {
							send: function(body) { xhr.send(body) },
							abort: abortSpy,
						}
					}
				}).then(
					function() { state = "resolved" },
					function() { state = "rejected" }
				)
				replacement.abort()
				o(abortSpy.callCount).equals(1)
			})
				// allow promises to (not) resolve first
				.then(function() { return utils.delay(10) })
				.then(function() {
					o(state).equals("pending")
				})
		})
		o("doesn't fail on file:// status 0", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 0, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({method: "GET", url: "file:///item"}).then(function(data) {
				o(data).deepEquals({a: 1})
			})
		})
		o("set timeout to xhr instance", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			return request({
				method: "GET", url: "/item",
				timeout: 42,
				config: function(xhr) {
					o(xhr.timeout).equals(42)
				}
			})
		})
		o("set responseType to request instance", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: ""}
				}
			})
			var responseType
			var p = request({
				method: "GET", url: "/item",
				responseType: "blob",
				config: function(xhr) { responseType = xhr.responseType }
			})
			o(responseType).equals("blob")
			return p
		})
		o("params unmodified after interpolate", function() {
			mock.$defineRoutes({
				"PUT /items/1": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			var params = {x: 1, y: 2}
			var p = request({method: "PUT", url: "/items/:x", params: params})

			o(params).deepEquals({x: 1, y: 2})

			return p
		})
		o("can return replacement from config", function() {
			mock.$defineRoutes({
				"GET /a": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			var result
			return request({
				url: "/a",
				config: function(xhr) {
					return result = {
						send: o.spy(xhr.send.bind(xhr)),
					}
				},
			})
				.then(function () {
					o(result.send.callCount).equals(1)
				})
		})
	})
	o.spec("failure", function() {
		o("rejects on server error", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: JSON.stringify({error: "error"})}
				}
			})
			return request({method: "GET", url: "/item"}).then(
				function() { throw new Error("Expected an error to be thrown") },
				function(e) {
					o(e instanceof Error).equals(true)
					o(e.message).equals("[object Object]")
					o(e.response).deepEquals({error: "error"})
					o(e.code).equals(500)
				}
			)
		})
		o("adds response to Error", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: JSON.stringify({message: "error", stack: "error on line 1"})}
				}
			})
			return request({method: "GET", url: "/item"}).then(
				function() { throw new Error("Expected an error to be thrown") },
				function(e) {
					o(e instanceof Error).equals(true)
					o(e.response.message).equals("error")
					o(e.response.stack).equals("error on line 1")
				}
			)
		})
		o("rejects on non-JSON server error", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: "error"}
				}
			})
			return request({method: "GET", url: "/item"}).then(
				function() { throw new Error("Expected an error to be thrown") },
				function(e) {
					o(e.message).equals("null")
					o(e.response).equals(null)
				}
			)
		})
		o("triggers all branched catches upon rejection", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: "error"}
				}
			})
			var promise = request({method: "GET", url: "/item"})
			var then = o.spy()
			var catch1 = o.spy()
			var catch2 = o.spy()
			var catch3 = o.spy()

			promise.catch(catch1)
			promise.then(then, catch2)
			promise.then(then).catch(catch3)

			return utils.delay(10).then(function() {
				o(catch1.callCount).equals(1)
				o(then.callCount).equals(0)
				o(catch2.callCount).equals(1)
				o(catch3.callCount).equals(1)
			})
		})
		o("rejects on cors-like error", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 0}
				}
			})
			return request({method: "GET", url: "/item"}).then(
				function() { throw new Error("Expected an error to be thrown") },
				function(e) {
					o(e instanceof Error).equals(true)
				}
			)
		})
		o("rejects on request timeout", function() {
			var timeout = 50
			mock.$defineRoutes({
				"GET /item": function() {
					return utils.delay(timeout + 5)
						.then(function() { return {status: 200} })
				}
			})
			return request({method: "GET", url: "/item", timeout: timeout}).then(
				function() { throw new Error("Expected an error to be thrown") },
				function(e) {
					o(e instanceof Error).equals(true)
					o(e.message).equals("Request timed out")
					o(e.code).equals(0)
				}
			)
		})
		o("does not reject when time to request resource does not exceed timeout", function() {
			var timeout = 50
			mock.$defineRoutes({
				"GET /item": function() {
					return utils.delay(timeout - 5)
						.then(function() { return {status: 200} })
				}
			})
			return request({method: "GET", url: "/item", timeout: timeout})
		})
		o("does not reject on status error code when extract provided", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 500, responseText: JSON.stringify({message: "error"})}
				}
			})
			return request({
				method: "GET", url: "/item",
				extract: function(xhr) {return JSON.parse(xhr.responseText)}
			}).then(function(data) {
				o(data.message).equals("error")
			})
		})
		o("rejects on error in extract", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "GET", url: "/item",
				extract: function() {throw new Error("error")}
			}).then(
				function() { throw new Error("Expected an error to be thrown") },
				function(e) {
					o(e instanceof Error).equals(true)
					o(e.message).equals("error")
				}
			)
		})
	})
	o.spec("json header", function() {
		o("doesn't set header on GET without body", function() {
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "GET", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on GET with body", function() {
			mock.$defineRoutes({
				"GET /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "GET", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})

		o("doesn't set header on HEAD without body", function() {
			mock.$defineRoutes({
				"HEAD /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "HEAD", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on HEAD with body", function() {
			mock.$defineRoutes({
				"HEAD /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "HEAD", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})

		o("doesn't set header on OPTIONS without body", function() {
			mock.$defineRoutes({
				"OPTIONS /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "OPTIONS", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on OPTIONS with body", function() {
			mock.$defineRoutes({
				"OPTIONS /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "OPTIONS", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})

		o("doesn't set header on POST without body", function() {
			mock.$defineRoutes({
				"POST /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "POST", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on POST with body", function() {
			mock.$defineRoutes({
				"POST /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "POST", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})

		o("doesn't set header on PUT without body", function() {
			mock.$defineRoutes({
				"PUT /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "PUT", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on PUT with body", function() {
			mock.$defineRoutes({
				"PUT /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "PUT", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})

		o("doesn't set header on DELETE without body", function() {
			mock.$defineRoutes({
				"DELETE /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "DELETE", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on DELETE with body", function() {
			mock.$defineRoutes({
				"DELETE /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "DELETE", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})

		o("doesn't set header on PATCH without body", function() {
			mock.$defineRoutes({
				"PATCH /item": function() {
					return {status: 200, responseText: JSON.stringify({a: 1})}
				}
			})
			return request({
				method: "PATCH", url: "/item",
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals(undefined)
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({a: 1})
			})
		})

		o("sets header on PATCH with body", function() {
			mock.$defineRoutes({
				"PATCH /item": function(response) {
					return {
						status: 200,
						responseText: JSON.stringify({body: JSON.parse(response.body)}),
					}
				}
			})
			return request({
				method: "PATCH", url: "/item", body: {foo: "bar"},
				config: function(xhr) {
					var header = xhr.getRequestHeader("Content-Type")
					o(header).equals("application/json; charset=utf-8")
					header = xhr.getRequestHeader("Accept")
					o(header).equals("application/json, text/*")
				}
			}).then(function(result) {
				o(result).deepEquals({body: {foo: "bar"}})
			})
		})
	})

	// See: https://github.com/MithrilJS/mithril.js/issues/2426
	//
	// TL;DR: lots of subtlety. Make sure you read the ES spec closely before
	// updating this code or the corresponding finalizer code in
	// `request/request` responsible for scheduling autoredraws, or you might
	// inadvertently break things.
	//
	// The precise behavior here is that it schedules a redraw immediately after
	// the second tick *after* the promise resolves, but `await` in engines that
	// have implemented the change in https://github.com/tc39/ecma262/pull/1250
	// will only take one tick to get the value. Engines that haven't
	// implemented that spec change would wait until the tick after the redraw
	// was scheduled before it can see the new value. But this only applies when
	// the engine needs to coerce the value, and this is where things get a bit
	// hairy. As per spec, V8 checks the `.constructor` property of promises and
	// if that `=== Promise`, it does *not* coerce it using `.then`, but instead
	// just resolves it directly. This, of course, can screw with our autoredraw
	// behavior, and we have to work around that. At the time of writing, no
	// other browser checks for this additional constraint, and just blindly
	// invokes `.then` instead, and so we end up working as anticipated. But for
	// obvious reasons, it's a bad idea to rely on a spec violation for things
	// to work unless the spec itself is clearly broken (in this case, it's
	// not). And so we need to test for this very unusual edge case.
	//
	// I evaluate it immediately inside a `try`/`catch` instead of inside the
	// test code so any relevant syntax error can be detected ahead of time and
	// the test skipped entirely. It might trigger mental alarms because dynamic
	// evaluation is normally asking for problems, but this is a rare case where
	// it's genuinely safe and rational.
	try {
		// eslint-disable-next-line no-new-func
		var runAsyncTest = Function(
			"'use strict'\n" +
			"return async (o, request, complete, throttleMock) => {\n" +
			"    var p = request('/item')\n" +
			"    throttleMock.fire()\n" +
			"    o(complete.callCount).equals(0)\n" +
			// Note: this step does *not* invoke `.then` on the promise returned
			// from `p.then(resolve, reject)`.
			"    await p\n" +
			// The spec prior to https://github.com/tc39/ecma262/pull/1250 used
			// to take 3 ticks instead of 1, so `complete` would have been
			// called already and we would've been done. After it, it now takes
			// 1 tick and so `complete` wouldn't have yet been called - it takes
			// 2 ticks to get called. And so we have to wait for one more ticks
			// for `complete` to get called.
			"    await null\n" +
			"    throttleMock.fire()\n" +
			"    o(complete.callCount).equals(1)\n" +
			"}"
		)()

		o("invokes the redraw in native async/await", function () {
			// This test will fail if you use the polyfill, as it's based on
			// `setImmediate` (falling back to `setTimeout`), and native promise
			// microtasks are run at higher priority than either of those.
			mock.$defineRoutes({
				"GET /item": function() {
					return {status: 200, responseText: "[]"}
				}
			})
			return runAsyncTest(o, request, complete, throttleMock)
		})
	} catch (e) {
		// ignore - this is just for browsers that natively support
		// `async`/`await`, like most modern browsers.
		// it's just a syntax error anyways.
	}
})
