"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var domMock = require("../../test-utils/domMock")

var m = require("../../render/hyperscript")
var apiRouter = require("../../api/router")

o.spec("m.route", function() {
	var FRAME_BUDGET = 1000 / 60
	var $window, root, route, redraw
	
	o.beforeEach(function() {
		$window = {}
		
		var dom = domMock()
		for (var key in dom) $window[key] = dom[key]
		
		var loc = pushStateMock()
		for (var key in loc) $window[key] = loc[key]
		
		root = $window.document.body
		
		redraw = {}
		route = apiRouter($window, redraw)
	})
	
	o("updates redraw object", function() {
		route(root, "/", {
			"/" : {
				view: function() {
					return m("div")
				}
			}
		})
		
		o(typeof redraw.run).equals("function")
	})
	
	o("renders into `root`", function() {
		route(root, "/", {
			"/" : {
				view: function() {
					return m("div")
				}
			}
		})
		
		o(root.firstChild.nodeName).equals("DIV")
	})
	
	o("redraws on redraw.run()", function(done) {
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
		
		o(oninit.callCount).equals(1)
		
		redraw.run()
		
		// Wrapped to give time for the rate-limited redraw to fire
		setTimeout(function() {
			o(onupdate.callCount).equals(1)
			
			done()
		}, FRAME_BUDGET)
	})
	
	o("redraws on events", function(done, timeout) {
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
	
	o("changes location on route.link", function() {
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
		
		o($window.location.href).equals("http://localhost/?/")
		
		root.firstChild.dispatchEvent(e)
		
		o($window.location.href).equals("http://localhost/?/test")
	})
})
