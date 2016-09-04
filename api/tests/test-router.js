"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var browserMock = require("../../test-utils/browserMock")

var m = require("../../render/hyperscript")
var coreRenderer = require("../../render/render")
var apiPubSub = require("../../api/pubsub")
var apiRouter = require("../../api/router")
var apiMounter = require("../../api/mount")

o.spec("route", function() {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		void ["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var FRAME_BUDGET = Math.floor(1000 / 60)
				var $window, root, redraw, mount, routeLib

				o.beforeEach(function() {
					$window = browserMock(env)

					root = $window.document.body

					redraw = apiPubSub()
					mount = apiMounter(coreRenderer($window), redraw)
					routeLib = apiRouter($window, mount)
					routeLib.prefix(prefix)
				})

				o("renders into `root`", function(done) {
					$window.location.href = prefix + "/"
					routeLib(root, "/", {
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

				o("default route doesn't break back button", function(done) {
					$window.location.href = "http://google.com"
					routeLib(root, "/a", {
						"/a" : {
							view: function() {
								return m("div")
							}
						}
					})

					setTimeout(function() {
						o(root.firstChild.nodeName).equals("DIV")
						
						$window.history.back()
						
						o($window.location.pathname).equals("/")
						
						done()
					}, FRAME_BUDGET)
				})

				o("default route does not inherit params", function(done) {
					$window.location.href = "/invalid?foo=bar"
					routeLib(root, "/a", {
						"/a" : {
							oninit: init,
							view: function() {
								return m("div")
							}
						}
					})

					function init(vnode) {
						o(vnode.attrs.foo).equals(undefined)
						
						done()
					}
				})

				o("redraws when render function is executed", function(done) {
					var onupdate = o.spy()
					var oninit = o.spy()

					$window.location.href = prefix + "/"
					routeLib(root, "/", {
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

					$window.location.href = prefix + "/"
					routeLib(root, "/", {
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

					$window.location.href = prefix + "/"
					routeLib(root, "/", {
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

					$window.location.href = prefix + "/"
					routeLib(root, "/", {
						"/" : {
							view: function() {
								return m("a", {
									href: "/test",
									oncreate: routeLib.link
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
						var slash = prefix[0] === "/" ? "" : "/"

						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : ""))

						root.firstChild.dispatchEvent(e)

						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : "") + "test")
						
						done()
					})
				})
				
				o("accepts a route function", function(done) {
					var renderCount = 0
					var Component = {
						view: function() {
							return m("h1")
						}
					}

					$window.location.href = prefix + "/"
					routeLib(root, "/abc", {
						"/:id" : function (route) {
							renderCount++
							o(route.args.id).equals("abc")
							o(route.path).equals("/abc")
							o(routeLib.get()).equals("/abc")

							return m(Component, route.args)
						}
					})


					setTimeout(function() {
						o(renderCount).equals(1)
						o(root.firstChild.nodeName).equals("H1")

						done()
					}, FRAME_BUDGET)
				})

				o("accepts a route function with a reject parameter", function(done, timeout) {
					var rejectCount = 0
					var renderCount = 0
					var Component = {
						view: function() {
							return m("H1")
						}
					}

					$window.location.href = prefix + "/"
					routeLib(root, "/abc", {
						"/:id" : function (route, reject) {
							if ( rejectCount === 0 ) {
								rejectCount++
								return reject
							}
							renderCount++
							o(route.args.id).equals("abc")
							o(routeLib.get()).equals("/abc")

							return m(Component, route.args)
						}
					})

					setTimeout(function() {
						o(rejectCount).equals(1)
						o(renderCount).equals(0)
						o(root.firstChild.nodeName).equals("DIV")

						redraw.publish()

						callAsync(function() {
							o(rejectCount).equals(1)
							o(renderCount).equals(1)
							o(root.firstChild.nodeName).equals("H1")

							done()
						})

					}, FRAME_BUDGET)
				})

				o("route function does not have component semantics", function(done, timeout) {
					timeout(60)
					
					var renderCount = 0
					
					$window.location.href = prefix + "/"
					routeLib(root, "/a", {
						"/a" : function(route) {
							return m("div")
						},
						"/b" : function(route) {
							return m("div")
						},
					})
					
					setTimeout(function() {
						var dom = root.firstChild
						o(root.firstChild.nodeName).equals("DIV")
						
						routeLib.set("/b")
						
						setTimeout(function() {
							o(root.firstChild).equals(dom)
							
							done()
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

				o("render function can redirect to another route", function(done) {
						var redirected = false

						$window.location.href = prefix + "/"
						routeLib(root, "/a", {
							"/a" : function (params, reject) {
								routeLib.set("/b")
								return reject
							},
							"/b" : function(params){
								redirected = true
							}
						})

						setTimeout(function() {
							o(redirected).equals(true)

							done()
						}, FRAME_BUDGET)
				})

				o("render function can redirect back to previous route", function(done, timeout) {
					timeout(FRAME_BUDGET * 4)
					var view1Count = 0
					var view2Count = 0

					$window.location.href = prefix + "/"
					routeLib(root, "/v1", {
						"/v1": function () {
							view1Count++
							return m('h1')
						},
						"/v2": function (route, reject) {
							view2Count++
							return reject
						}
					})

					setTimeout(function() {
						o(view1Count).equals(1) // Initial route
						o(view2Count).equals(0)
						checkState()

						routeLib.set("/v2")

						setTimeout(function(){
							o(view1Count).equals(2) // Initial route
							o(view2Count).equals(1) // Reject route
							checkState()

							// This should redraw the initial route
							redraw.publish()

							setTimeout(function() {
								o(view1Count).equals(3) // Initial route
								o(view2Count).equals(1)
								checkState()

								done()
							}, FRAME_BUDGET)
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)

					function checkState () {
						o(root.firstChild.nodeName).equals("H1")
						o(routeLib.get()).equals("/v1")
					}
				})

				o("route.retry()", function(done, timeout) {
					timeout(FRAME_BUDGET * 5)
					var view1Count = 0
					var view2Count = 0
					var asyncResource = null

					$window.location.href = prefix + "/"
					routeLib(root, "/v1", {
						"/v1": function () {
							view1Count++
							return m('h1')
						},
						"/v2": function (route, reject) {
							view2Count++
							if (asyncResource === null) {

								setTimeout(function(){
									asyncResource = 'h2'
									route.retry()
								}, FRAME_BUDGET)

								return reject
							}

							return m(asyncResource)
						},
					})

					setTimeout(function() {
						o(view1Count).equals(1)
						o(view2Count).equals(0)

						o(root.firstChild.nodeName).equals("H1")
						o(routeLib.get()).equals("/v1")

						routeLib.set("/v2")

						setTimeout(function(){
							o(view1Count).equals(2)
							o(view2Count).equals(1)

							setTimeout(function(){
								o(view1Count).equals(2)
								o(view2Count).equals(2)

								o(root.firstChild.nodeName).equals("H2")
								o(routeLib.get()).equals("/v2")

								done()
							}, FRAME_BUDGET)
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)

				})

				o("handles route race conditions (#1267)", function(done, timeout) {
					timeout(FRAME_BUDGET * 8)
					var view1Count = 0
					var view2Count = 0
					var view3Count = 0

					var rejected = true
					var asyncResource = null

					$window.location.href = prefix + "/"
					routeLib(root, "/v1", {
						"/v1": function () {
							view1Count++
							return m('h1')
						},
						"/v2": function (route, reject) {
							view2Count++

							if ( asyncResource === null ) {

								setTimeout(function mockLoad () {
									asyncResource = 'h2'
									route.retry()
								}, FRAME_BUDGET*3)

								rejected = true
								return reject
							}
							else {
								return m(asyncResource)
							}
						},
						"/v3": function (route, reject) {
							view3Count++
							return m('h3')
						}
					})

					setTimeout(function() {
						o(view1Count).equals(1)
						o(view2Count).equals(0)
						o(view3Count).equals(0)

						o(root.firstChild.nodeName).equals("H1")
						o(routeLib.get()).equals("/v1")

						routeLib.set("/v2")

						setTimeout(function(){
							o(view1Count).equals(2)
							o(view2Count).equals(1)
							o(view3Count).equals(0)

							o(rejected).equals(true)
							o(asyncResource).equals(null)
							o(routeLib.get()).equals("/v1")

							// Route to different resource while asyncResource is still loading
							routeLib.set("/v3")

							setTimeout(function(){
								o(view1Count).equals(2)
								o(view2Count).equals(1)
								o(view3Count).equals(1)

								o(root.firstChild.nodeName).equals("H3")
								o(routeLib.get()).equals("/v3")

								o(asyncResource).equals(null)
								// After asyncResource loads, the m.route.set should fail

								setTimeout(function(){
									o(asyncResource).equals('h2')

									o(view1Count).equals(2)
									o(view2Count).equals(1)
									o(view3Count).equals(1)

									setTimeout(function() {
										o(root.firstChild.nodeName).equals("H3")
										o(routeLib.get()).equals("/v3")

										done()
									}, FRAME_BUDGET)
								}, FRAME_BUDGET*2)
							}, FRAME_BUDGET)
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)

				})

				o("routed mount points can redraw synchronoulsy (#1275)", function(done) {
					var view = o.spy()

					$window.location.href = prefix + "/"
					routeLib(root, "/", {"/":{view:view}})

					setTimeout(function() {
						o(view.callCount).equals(1)

						redraw.publish(true)

						o(view.callCount).equals(2)

						done()
					}, FRAME_BUDGET)
				})

				o("m.routeLib.set(m.routeLib.get()) re-runs the resolution logic (#1180)", function(done, timeout){
					timeout(FRAME_BUDGET * 3)

					var renderCount = 0

					$window.location.href = prefix + "/"
					routeLib(root, '/', {
						"/": { view: function(){
							renderCount++
							return m("div")
						}}
					})

					setTimeout(function() {
						o(renderCount).equals(1)

						routeLib.set(routeLib.get())

						setTimeout(function() {
							o(renderCount).equals(2)

							done()
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

				o("route function has access to previous route", function(done){
					$window.location.href = prefix + "/"

					var prev = null

					routeLib(root, "/", {
						"/": function(route){
							prev = route.prev
						},
						"/2": function(route){
							prev = route.prev
						}
					})


					setTimeout(function() {
						o(routeLib.get()).equals("/")
						o(prev.path).equals(null)

						routeLib.set("/2")

						callAsync(function() {
							o(routeLib.get()).equals("/2")
							o(prev.path).equals("/")
							done()
						})

					}, FRAME_BUDGET)
				})

				o("routing with RouteResolver works more than once (#1286)", function(done, timeout){
					timeout(FRAME_BUDGET * 4)

					$window.location.href = prefix + "/a"
					routeLib(root, '/a', {
						'/a': function() {
							return m("a", "a")
						},
						'/b': function() {
							return m("b", "b")
						}
					})

					setTimeout(function(){
						routeLib.set('/b')

						setTimeout(function(){
							routeLib.set('/a')

							setTimeout(function(){
								o(root.firstChild.nodeName).equals("A")

								done()
							}, FRAME_BUDGET)
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

			})
		})
	})
})
