"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("Router.defineRoutes", function() {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		void ["#", "?", "", "#!", "?!", "/foo", "?#", "##"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var $window, router, onRouteChange, onFail

				function defineRoutes(routes, defaultRoute) {
					router.defineRoutes(routes, onRouteChange, onFail, defaultRoute, function() {})
				}

				o.beforeEach(function() {
					$window = pushStateMock(env)
					router = new Router($window)
					router.prefix = prefix
					onRouteChange = o.spy()
					onFail = o.spy()
				})

				o("calls onRouteChange on init", function(done) {
					$window.location.href = prefix + "/a"
					var subscribe = o.spy()

					router.defineRoutes({"/a": {data: 1}}, onRouteChange, onFail, null, subscribe)
					o(subscribe.callCount).equals(1)

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)

						done()
					})
				})

				o("resolves to route", function(done) {
					$window.location.href = prefix + "/test"
					defineRoutes({"/test": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {}, "/test", "/test"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("resolves to route w/ escaped unicode", function(done) {
					$window.location.href = prefix + "/%C3%B6?%C3%B6=%C3%B6"
					defineRoutes({"/ö": {data: 2}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 2}, {"ö": "ö"}, "/ö?ö=ö", "/ö"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("resolves to route w/ unicode", function(done) {
					$window.location.href = prefix + "/ö?ö=ö"
					defineRoutes({"/ö": {data: 2}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 2}, {"ö": "ö"}, "/ö?ö=ö", "/ö"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("resolves to route on fallback mode", function(done) {
					$window.location.href = "file://" + prefix + "/test"

					router = new Router($window)
					router.prefix = prefix

					defineRoutes({"/test": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {}, "/test", "/test"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("handles parameterized route", function(done) {
					$window.location.href = prefix + "/test/x"
					defineRoutes({"/test/:a": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {a: "x"}, "/test/x", "/test/:a"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("handles multi-parameterized route", function(done) {
					$window.location.href = prefix + "/test/x/y"
					defineRoutes({"/test/:a/:b": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {a: "x", b: "y"}, "/test/x/y", "/test/:a/:b"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("handles rest parameterized route", function(done) {
					$window.location.href = prefix + "/test/x/y"
					defineRoutes({"/test/:a...": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {a: "x/y"}, "/test/x/y", "/test/:a..."])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("handles route with search", function(done) {
					$window.location.href = prefix + "/test?a=b&c=d"
					defineRoutes({"/test": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {a: "b", c: "d"}, "/test?a=b&c=d", "/test"])
						o(onFail.callCount).equals(0)

						done()
					})
				})

				o("calls reject", function(done) {
					$window.location.href = prefix + "/test"
					defineRoutes({"/other": {data: 1}})

					callAsync(function() {
						o(onFail.callCount).equals(1)
						o(onFail.args).deepEquals(["/test", {}])

						done()
					})
				})

				o("handles out of order routes", function(done) {
					$window.location.href = prefix + "/z/y/x"
					defineRoutes({"/z/y/x": {data: 1}, "/:a...": {data: 2}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {}, "/z/y/x", "/z/y/x"])

						done()
					})
				})

				o("handles reverse out of order routes", function(done) {
					$window.location.href = prefix + "/z/y/x"
					defineRoutes({"/:a...": {data: 2}, "/z/y/x": {data: 1}})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 2}, {a: "z/y/x"}, "/z/y/x", "/:a..."])

						done()
					})
				})

				o("handles dynamically added out of order routes", function(done) {
					var routes = {}
					routes["/z/y/x"] = {data: 1}
					routes["/:a..."] = {data: 2}

					$window.location.href = prefix + "/z/y/x"
					defineRoutes(routes)

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {}, "/z/y/x", "/z/y/x"])

						done()
					})
				})

				o("handles reversed dynamically added out of order routes", function(done) {
					var routes = {}
					routes["/:a..."] = {data: 2}
					routes["/z/y/x"] = {data: 1}

					$window.location.href = prefix + "/z/y/x"
					defineRoutes(routes)

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 2}, {a: "z/y/x"}, "/z/y/x", "/:a..."])

						done()
					})
				})

				o("handles mixed out of order routes", function(done) {
					var routes = {"/z/y/x": {data: 1}}
					routes["/:a..."] = {data: 2}

					$window.location.href = prefix + "/z/y/x"
					defineRoutes(routes)

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 1}, {}, "/z/y/x", "/z/y/x"])

						done()
					})
				})

				o("handles reverse mixed out of order routes", function(done) {
					var routes = {"/:a...": {data: 2}}
					routes["/z/y/x"] = {data: 12}

					$window.location.href = prefix + "/z/y/x"
					defineRoutes(routes)

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)
						o(onRouteChange.args).deepEquals([{data: 2}, {a: "z/y/x"}, "/z/y/x", "/:a..."])

						done()
					})
				})

				o("handles non-ascii routes", function(done) {
					$window.location.href = prefix + "/ö"
					defineRoutes({"/ö": "aaa"})

					callAsync(function() {
						o(onRouteChange.callCount).equals(1)

						done()
					})
				})
			})
		})
	})
})
