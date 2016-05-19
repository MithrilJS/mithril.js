"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var domMock = require("../../test-utils/domMock")
var async = require("./async")

var m = require("../../render/hyperscript")
var createRouter = require("../router")

o.spec("m.route", function() {
	var $window, root, router
	
	[
		"setTimeout",
		"requestAnimationFrame"
	].forEach(function(timing) {
		o.spec(timing, function() {
			[
				"#",
				"?",
				"#!",
				"?!",
				""
			].forEach(function(prefix) {
				var spec = prefix ? "prefix " + prefix : "pushstate";
				
				o.spec(spec, function() {
					o.beforeEach(function() {
						var dom = domMock()
						var location = pushStateMock()
						
						// Generate a DOM + Location mock
						Object.keys(location).forEach(function(key) {
							dom[key] = location[key]
						})
						
						$window = dom
						async[timing]($window)
						root = $window.document.body
					})
					
					o("is a function", function() {
						o(typeof createRouter).equals("function")
					})
					
					o("returns a function after invocation", function() {
						o(typeof createRouter($window)).equals("function")
					})
					
					o("updates passed in redraw object", function() {
						var redraw = {}
						var router = createRouter($window, redraw)
						
						router.prefix(prefix)
						
						router(root, "/", {
							"/" : {
								view: function() {
									return m("div")
								}
							}
						})
						
						o(typeof redraw.run).equals("function")
					})
					
					o("renders into `root`", function() {
						var router = createRouter($window, {})
						
						router.prefix(prefix)
						
						router(root, "/", {
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
						var redraw = {}
						var router = createRouter($window, redraw)
						
						router.prefix(prefix)
						
						router(root, "/", {
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
						}, 20)
					})
					
					o("redraws on events", function(done, timeout) {
						var onupdate = o.spy()
						var oninit   = o.spy()
						var onclick  = o.spy()
						var router = createRouter($window, {})
						var e = $window.document.createEvent("MouseEvents")
						
						e.initEvent("click", true, true)
						
						router.prefix(prefix)
						
						router(root, "/", {
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
						}, 20)
					})
					
					o("changes location on route.link", function() {
						var router = createRouter($window, {})
						var e = $window.document.createEvent("MouseEvents")
						
						e.initEvent("click", true, true)
						
						router.prefix(prefix)
						
						router(root, "/", {
							"/" : {
								view: function() {
									return m("a", {
										href: "/test",
										oncreate: router.link
									})
								}
							},
							"/test" : {
								view : function() {
									return m("div")
								}
							}
						})
						
						o($window.location.href).equals("http://localhost/" + (prefix ? prefix + "/" : ""))
						
						root.firstChild.dispatchEvent(e)
						
						o($window.location.href).equals("http://localhost/" + (prefix ? prefix + "/test" : "test"))
					})
				})
			})
		})
	})
})
