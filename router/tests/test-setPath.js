"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("Router.setPath", function() {
	void ["pushState", "onhashchange"].forEach(function(mode) {
		void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
			void (mode === "pushState" ? ["#", "?", "", "#!", "?!", "/foo"] : ["#", "#!"]).forEach(function(prefix) {
				o.spec("router mode: `" + mode + "`, using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
					var $window, router, onRouteChange, onFail

					function init(href) {
						env.href = href || ""
						$window = pushStateMock(env)
						router = new Router($window)
						router.prefix = prefix
						if (mode === "onhashchange") router.usePushState = false
						onRouteChange = o.spy()
						onFail = o.spy()
					}
					o("setPath calls onRouteChange asynchronously", function(done) {
						init(prefix + "/a")
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
						init(prefix + "/a")
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
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/other/x/y/z?c=d#e=f")

							o(router.getPath()).equals("/other/x/y/z?c=d#e=f")

							done()
						})
					})
					o("sets route w/ escaped unicode", function(done) {
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/%C3%B6?%C3%B6=%C3%B6#%C3%B6=%C3%B6")

							o(router.getPath()).equals("/ö?ö=ö#ö=ö")

							done()
						})
					})
					o("sets route w/ unicode", function(done) {
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/ö/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/ö?ö=ö#ö=ö")

							o(router.getPath()).equals("/ö?ö=ö#ö=ö")

							done()
						})
					})

					o("sets route on fallback mode", function(done) {
						init("file://" + prefix + "/test")

						router = new Router($window)
						router.prefix = prefix

						router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/other/x/y/z?c=d#e=f")

							o(router.getPath()).equals("/other/x/y/z?c=d#e=f")

							done()
						})
					})
					if (mode === "pushState") o("sets route via pushState/onpopstate", function(done) {
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							$window.history.pushState(null, null, prefix + "/other/x/y/z?c=d#e=f")
							$window.onpopstate()

							o(router.getPath()).equals("/other/x/y/z?c=d#e=f")
							callAsync(function() {
								o(onRouteChange.callCount).equals(2)
								o(onRouteChange.args).deepEquals([{data: 2}, {c: "d", e: "f", a: "x", b: "y/z"}, "/other/x/y/z?c=d#e=f", "/other/:a/:b..."])

								done()
							})
						})
					})
					if (mode === "onhashchange") o("sets route via onhashchange", function(done) {
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							$window.location.href = prefix + "/other/x/y/z?c=d#e=f"

							o(router.getPath()).equals("/other/x/y/z?c=d#e=f")

							callAsync(function() {
								o(onRouteChange.callCount).equals(2)
								o(onRouteChange.args).deepEquals([{data: 2}, {c: "d", e: "f", a: "x", b: "y/z"}, "/other/x/y/z?c=d#e=f", "/other/:a/:b..."])

								done()
							})
						})
					})
					o("sets parameterized route", function(done) {
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/other/:a/:b...": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/other/:a/:b", {a: "x", b: "y/z", c: "d", e: "f"})

							o(router.getPath()).equals("/other/x/y/z?c=d&e=f")

							done()
						})
					})
					if (mode === "pushState") o("replace:true works", function(done) {
						// FIXME: somehow, pushstate doesn't work correctly
						// when called on the initial path.
						init("")
						$window.location.href = prefix + "/test"
						router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/other", null, {replace: true})
							$window.history.back()

							o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + "/")

							done()
						})
					})
					if (mode === "pushState") o("replace:false works", function(done) {
						init(prefix + "/test")
						router.defineRoutes({"/test": {data: 1}, "/other": {data: 2}}, onRouteChange, onFail)

						callAsync(function() {
							router.setPath("/other", null, {replace: false})
							$window.history.back()

							var slash = prefix[0] === "/" ? "" : "/"

							o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : "") + "test")

							done()
						})
					})
					if (mode === "pushState") o("state works", function(done) {
						init(prefix + "/test")
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
})
