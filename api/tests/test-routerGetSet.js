"use strict"

// Low-priority TODO: remove the dependency on the renderer here.
var o = require("ospec")
var browserMock = require("../../test-utils/browserMock")
var throttleMocker = require("../../test-utils/throttleMock")
var loadMithril = require("../../test-utils/load").mithril

var apiMountRedraw = require("../../api/mount-redraw")
var coreRenderer = require("../../render/render")
var apiRouter = require("../../api/router")

o.spec("route.get/route.set", function() {
	[{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var $window, root, mountRedraw, route, throttleMock
				var route2

				o.beforeEach(function() {
					$window = browserMock(env)
					throttleMock = throttleMocker()
					$window.setTimeout = setTimeout

					root = $window.document.body

					$window.requestAnimationFrame = throttleMock.schedule
					route2 = loadMithril({window: $window}).route
					route2.prefix = prefix
					mountRedraw = apiMountRedraw(coreRenderer($window), throttleMock.schedule, console)
					route = apiRouter($window, mountRedraw)
					route.prefix = prefix
				})

				o.afterEach(function() {
					o(throttleMock.queueLength()).equals(0)
				})

				o("gets route", function() {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {"/test": {view: function() {}}})

					o(route2.get()).equals("/test")
				})

				o("gets route w/ params", function() {
					$window.location.href = prefix + "/other/x/y/z?c=d#e=f"

					route2(root, "/other/x/y/z?c=d#e=f", {
						"/test": {view: function() {}},
						"/other/:a/:b...": {view: function() {}},
					})

					o(route2.get()).equals("/other/x/y/z?c=d#e=f")
				})

				o("gets route w/ escaped unicode", function() {
					$window.location.href = prefix + encodeURI("/ö/é/å?ö=ö#ö=ö")

					route2(root, "/ö/é/å?ö=ö#ö=ö", {
						"/test": {view: function() {}},
						"/ö/:a/:b...": {view: function() {}},
					})

					o(route2.get()).equals("/ö/é/å?ö=ö#ö=ö")
				})

				o("gets route w/ unicode", function() {
					$window.location.href = prefix + "/ö/é/å?ö=ö#ö=ö"

					route2(root, "/ö/é/å?ö=ö#ö=ö", {
						"/test": {view: function() {}},
						"/ö/:a/:b...": {view: function() {}},
					})

					o(route2.get()).equals("/ö/é/å?ö=ö#ö=ö")
				})

				o("sets path asynchronously", function(done) {
					$window.location.href = prefix + "/a"
					var spy1 = o.spy()
					var spy2 = o.spy()

					route(root, "/a", {
						"/a": {view: spy1},
						"/b": {view: spy2},
					})

					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)
					route.set("/b")
					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)
					setTimeout(function() {
						throttleMock.fire()

						o(spy1.callCount).equals(1)
						o(spy2.callCount).equals(1)
						done()
					})
				})

				o("sets fallback asynchronously", function(done) {
					$window.location.href = prefix + "/b"
					var spy1 = o.spy()
					var spy2 = o.spy()

					route(root, "/a", {
						"/a": {view: spy1},
						"/b": {view: spy2},
					})

					o(spy1.callCount).equals(0)
					o(spy2.callCount).equals(1)
					route.set("/c")
					o(spy1.callCount).equals(0)
					o(spy2.callCount).equals(1)
					setTimeout(function() {
						// Yep, before even the throttle mechanism takes hold.
						o(route.get()).equals("/b")
						setTimeout(function() {
							// Yep, before even the throttle mechanism takes hold.
							o(route.get()).equals("/a")
							throttleMock.fire()

							o(spy1.callCount).equals(1)
							o(spy2.callCount).equals(1)
							done()
						})
					})
				})

				o("exposes new route asynchronously", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other/:a/:b...": {view: function() {}},
					})

					route2.set("/other/x/y/z?c=d#e=f")
					setTimeout(function() {
						// Yep, before even the throttle mechanism takes hold.
						o(route2.get()).equals("/other/x/y/z?c=d#e=f")
						throttleMock.fire()
						done()
					})
				})

				o("exposes new escaped unicode route asynchronously", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/ö": {view: function() {}},
					})

					route2.set(encodeURI("/ö?ö=ö#ö=ö"))
					setTimeout(function() {
						// Yep, before even the throttle mechanism takes hold.
						o(route2.get()).equals("/ö?ö=ö#ö=ö")
						throttleMock.fire()
						done()
					})
				})

				o("exposes new unescaped unicode route asynchronously", function(done) {
					$window.location.href = "file://" + prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/ö": {view: function() {}},
					})

					route2.set("/ö?ö=ö#ö=ö")
					setTimeout(function() {
						// Yep, before even the throttle mechanism takes hold.
						o(route2.get()).equals("/ö?ö=ö#ö=ö")
						throttleMock.fire()
						done()
					})
				})

				o("exposes new route asynchronously on fallback mode", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other/:a/:b...": {view: function() {}},
					})

					route2.set("/other/x/y/z?c=d#e=f")
					setTimeout(function() {
						// Yep, before even the throttle mechanism takes hold.
						o(route2.get()).equals("/other/x/y/z?c=d#e=f")
						throttleMock.fire()
						done()
					})
				})

				o("sets route via pushState/onpopstate", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other/:a/:b...": {view: function() {}},
					})

					setTimeout(function() {
						$window.history.pushState(null, null, prefix + "/other/x/y/z?c=d#e=f")
						$window.onpopstate()

						setTimeout(function() {
							// Yep, before even the throttle mechanism takes hold.
							o(route2.get()).equals("/other/x/y/z?c=d#e=f")
							throttleMock.fire()

							done()
						})
					})
				})

				o("sets parameterized route", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other/:a/:b...": {view: function() {}},
					})

					route2.set("/other/:a/:b", {a: "x", b: "y/z", c: "d", e: "f"})
					setTimeout(function() {
						// Yep, before even the throttle mechanism takes hold.
						o(route2.get()).equals("/other/x/y%2Fz?c=d&e=f")
						throttleMock.fire()
						done()
					})
				})

				o("replace:true works", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other": {view: function() {}},
					})

					route2.set("/other", null, {replace: true})

					setTimeout(function() {
						throttleMock.fire()
						$window.history.back()
						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + "/")
						done()
					})
				})

				o("replace:false works", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other": {view: function() {}},
					})

					route2.set("/other", null, {replace: false})

					setTimeout(function() {
						throttleMock.fire()
						$window.history.back()
						var slash = prefix[0] === "/" ? "" : "/"
						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : "") + "test")
						done()
					})
				})

				o("state works", function(done) {
					$window.location.href = prefix + "/test"
					route2(root, "/test", {
						"/test": {view: function() {}},
						"/other": {view: function() {}},
					})

					route2.set("/other", null, {state: {a: 1}})
					setTimeout(function() {
						throttleMock.fire()
						o($window.history.state).deepEquals({a: 1})
						done()
					})
				})
			})
		})
	})
})
