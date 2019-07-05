"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("Router.getPath", function() {
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

				o("gets route", function() {
					$window.location.href = prefix + "/test"
					defineRoutes({"/test": {data: 1}})

					o(router.getPath()).equals("/test")
				})
				o("gets route w/ params", function() {
					$window.location.href = prefix + "/other/x/y/z?c=d#e=f"
					defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}})

					o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
				})
				o("gets route w/ escaped unicode", function() {
					$window.location.href = prefix + "/%C3%B6?%C3%B6=%C3%B6#%C3%B6=%C3%B6"
					defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}})

					o(router.getPath()).equals("/ö?ö=ö#ö=ö")
				})
				o("gets route w/ unicode", function() {
					$window.location.href = prefix + "/ö?ö=ö#ö=ö"
					defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}})

					o(router.getPath()).equals("/ö?ö=ö#ö=ö")
				})
			})
		})
	})
})
