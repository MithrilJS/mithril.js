"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var pushStateMock = require("../../test-utils/pushStateMock")
var domMock = require("../../test-utils/domMock")

var m = require("../../render/hyperscript")
var coreRenderer = require("../../render/render")
var apiPubSub = require("../../api/pubsub")
var apiRouter = require("../../api/router")

o.spec("route", function() {
	var FRAME_BUDGET = Math.floor(1000 / 60)
	var $window, root, redraw, route

	o.beforeEach(function() {
		$window = {}

		var dom = domMock()
		for (var key in dom) $window[key] = dom[key]

		var loc = pushStateMock()
		for (var key in loc) $window[key] = loc[key]

		root = $window.document.body

		redraw = apiPubSub()
		route = apiRouter($window, coreRenderer($window), redraw)
	})

	o("renders into `root`", function(done) {
		route(root, "/", {
			"/" : {
				view: function() {
					return m("div")
				}
			}
		})

		callAsync(function() {
			o(root.firstChild.nodeName).equals("DIV")
			
			done()
		})
	})

	o("redraws when render function is executed", function(done) {
		var onupdate = o.spy()
		var oninit = o.spy()

		route(root, "/", {
			"/" : {
				view: function() {
					return m("div", {
						oninit: oninit,
						onupdate: onupdate
					})
				}
			}
		})

		callAsync(function() {
			o(oninit.callCount).equals(1)

			redraw.publish()

			// Wrapped to give time for the rate-limited redraw to fire
			setTimeout(function() {
				o(onupdate.callCount).equals(1)

				done()
			}, FRAME_BUDGET)
		})
	})

	o("redraws on events", function(done) {
		var onupdate = o.spy()
		var oninit   = o.spy()
		var onclick  = o.spy()
		var e = $window.document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		route(root, "/", {
			"/" : {
				view: function() {
					return m("div", {
						oninit: oninit,
						onupdate: onupdate,
						onclick: onclick,
					})
				}
			}
		})

		callAsync(function() {
			root.firstChild.dispatchEvent(e)

			o(oninit.callCount).equals(1)

			o(onclick.callCount).equals(1)
			o(onclick.this).equals(root.firstChild)
			o(onclick.args[0].type).equals("click")
			o(onclick.args[0].target).equals(root.firstChild)

			// Wrapped to give time for the rate-limited redraw to fire
			setTimeout(function() {
				o(onupdate.callCount).equals(1)

				done()
			}, FRAME_BUDGET)
		})
	})

	o("event handlers can skip redraw", function(done) {
		var onupdate = o.spy()
		var oninit   = o.spy()
		var onclick  = o.spy()
		var e = $window.document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		route(root, "/", {
			"/" : {
				view: function() {
					return m("div", {
						oninit: oninit,
						onupdate: onupdate,
						onclick: function(e) {
							e.redraw = false
						},
					})
				}
			}
		})

		callAsync(function() {
			root.firstChild.dispatchEvent(e)

			o(oninit.callCount).equals(1)

			// Wrapped to ensure no redraw fired
			setTimeout(function() {
				o(onupdate.callCount).equals(0)

				done()
			}, FRAME_BUDGET)
		})
	})

	o("changes location on route.link", function(done) {
		var e = $window.document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		route.prefix("?")

		route(root, "/", {
			"/" : {
				view: function() {
					return m("a", {
						href: "/test",
						oncreate: route.link
					})
				}
			},
			"/test" : {
				view : function() {
					return m("div")
				}
			}
		})

		callAsync(function() {
			o($window.location.href).equals("http://localhost/?/")

			root.firstChild.dispatchEvent(e)

			o($window.location.href).equals("http://localhost/?/test")
			
			done()
		})
	})
})
