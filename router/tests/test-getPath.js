"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

var x = function(){}
x.spec = x

o.spec("Router.getPath", function() {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		void ["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var $window, router, onRouteChange, onFail

				function init(href) {
					env.href = href || ""
					$window = pushStateMock(env)
					router = new Router($window)
					router.prefix = prefix
					onRouteChange = o.spy()
					onFail = o.spy()
				}

				o("gets route", function() {
					init(prefix + "/test")
					router.defineRoutes({"/test": {data: 1}}, onRouteChange, onFail)

					o(router.getPath()).equals("/test")
				})
				o("gets route w/ params", function() {
					init(prefix + "/other/x/y/z?c=d#e=f")
					router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

					o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
				})
				o("gets route w/ escaped unicode", function() {
					init(prefix + "/%C3%B6?%C3%B6=%C3%B6#%C3%B6=%C3%B6")
					router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)

					o(router.getPath()).equals("/ö?ö=ö#ö=ö")
				})
				o("gets route w/ unicode", function() {
					init(prefix + "/ö?ö=ö#ö=ö")
					router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)

					o(router.getPath()).equals("/ö?ö=ö#ö=ö")
				})
			})
		})
	})
})
