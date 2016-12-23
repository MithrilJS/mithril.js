"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("Router.setPath", function() {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		void ["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var $window, router, onRouteChange, onFail

				o.beforeEach(function() {
					$window = pushStateMock(env)
					router = new Router($window)
					router.prefix = prefix
					onRouteChange = o.spy()
					onFail = o.spy()
				})

				o("setPath calls onRouteChange asynchronously", function(done) {
					$window.location.href = prefix + "/a"
					router.defineRoutes({"/a": {data: 1}, "/b": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/b")

						o(onRouteChange.callCount).equals(1)
						callAsync(function() {
							o(onRouteChange.callCount).equals(2)
							done()
						})
					})
				})
				o("setPath calls onFail asynchronously", function(done) {
					$window.location.href = prefix + "/a"
					router.defineRoutes({"/a": {data: 1}, "/b": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/c")

						o(onFail.callCount).equals(0)
						callAsync(function() {
							o(onFail.callCount).equals(1)
							done()
						})
					})
				})
				o("sets route via API", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/other/x/y/z?c=d#e=f")

						o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
						
						done()
					})
				})
				o("sets route w/ escaped unicode", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/%C3%B6?%C3%B6=%C3%B6#%C3%B6=%C3%B6")

						o(router.getPath()).equals("/ö?ö=ö#ö=ö")
						
						done()
					})
				})
				o("sets route w/ unicode", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/ö?ö=ö#ö=ö")

						o(router.getPath()).equals("/ö?ö=ö#ö=ö")
						
						done()
					})
				})

				o("sets route on fallback mode", function(done) {
					$window.location.href = "file://" + prefix + "/test"

					router = new Router($window)
					router.prefix = prefix

					router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/other/x/y/z?c=d#e=f")

						o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
						
						done()
					})
				})
				o("sets route via pushState/onpopstate", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						$window.history.pushState(null, null, prefix + "/other/x/y/z?c=d#e=f")
						$window.onpopstate()

						o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
						
						done()
					})
				})
				o("sets parameterized route", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/other/:a/:b", {a: "x", b: "y/z", c: "d", e: "f"})

						o(router.getPath()).equals("/other/x/y/z?c=d&e=f")
						
						done()
					})
				})
				o("replace:true works", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/other", null, {replace: true})
						$window.history.back()

						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + "/")
						
						done()
					})
				})
				o("replace:false works", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/other", null, {replace: false})
						$window.history.back()

						var slash = prefix[0] === "/" ? "" : "/"

						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : "") + "test")
						
						done()
					})
				})
				o("state works", function(done) {
					$window.location.href = prefix + "/test"
					router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)

					callAsync(function() {
						router.setPath("/other", null, {state: {a: 1}})

						o($window.history.state).deepEquals({a: 1})
						
						done()
					})
				})
			})
		})
	})
})
