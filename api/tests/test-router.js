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
				var $window, root, redraw, mount, route

				o.beforeEach(function() {
					$window = browserMock(env)

					root = $window.document.body

					redraw = apiPubSub()
					mount = apiMounter(coreRenderer($window), redraw)
					route = apiRouter($window, mount)
					route.prefix(prefix)
				})

				o("renders into `root`", function(done) {
					$window.location.href = prefix + "/"
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

				o("default route doesn't break back button", function(done) {
					$window.location.href = "http://google.com"
					route(root, "/a", {
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
					route(root, "/a", {
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

					$window.location.href = prefix + "/"
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

					$window.location.href = prefix + "/"
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

					$window.location.href = prefix + "/"
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
						var slash = prefix[0] === "/" ? "" : "/"

						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : ""))

						root.firstChild.dispatchEvent(e)

						o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : "") + "test")

						done()
					})
				})

				o("accepts RouteResolver", function(done) {
					var matchCount = 0
					var renderCount = 0
					var Component = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/"
					route(root, "/abc", {
						"/:id" : {
							onmatch: function(vnode, resolve) {
								matchCount++

								o(vnode.attrs.id).equals("abc")
								o(route.get()).equals("/abc")

								resolve(Component)
							},
							render: function(vnode) {
								renderCount++

								o(vnode.attrs.id).equals("abc")

								return vnode
							},
						},
					})

					setTimeout(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)
						o(root.firstChild.nodeName).equals("DIV")

						done()
					}, FRAME_BUDGET)
				})

				o("accepts RouteResolver without `render` method as payload", function(done) {
					var matchCount = 0
					var Component = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/"
					route(root, "/abc", {
						"/:id" : {
							onmatch: function(vnode, resolve) {
								matchCount++

								o(vnode.attrs.id).equals("abc")
								o(route.get()).equals("/abc")

								resolve(Component)
							},
						},
					})

					setTimeout(function() {
						o(matchCount).equals(1)

						o(root.firstChild.nodeName).equals("DIV")

						done()
					}, FRAME_BUDGET)
				})

				o("accepts RouteResolver without `onmatch` method as payload", function(done) {
					var renderCount = 0
					var Component = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/"
					route(root, "/abc", {
						"/:id" : {
							render: function(vnode) {
								renderCount++

								o(vnode.attrs.id).equals("abc")

								return m(Component)
							},
						},
					})

					setTimeout(function() {
						o(root.firstChild.nodeName).equals("DIV")

						done()
					}, FRAME_BUDGET)
				})

				o("RouteResolver `render` does not have component semantics", function(done, timeout) {
					timeout(60)

					var renderCount = 0
					var A = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/"
					route(root, "/a", {
						"/a" : {
							render: function(vnode) {
								return m("div")
							},
						},
						"/b" : {
							render: function(vnode) {
								return m("div")
							},
						},
					})

					setTimeout(function() {
						var dom = root.firstChild
						o(root.firstChild.nodeName).equals("DIV")

						route.set("/b")

						setTimeout(function() {
							o(root.firstChild).equals(dom)

							done()
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

				o("calls onmatch and view correct number of times", function(done) {
					var matchCount = 0
					var renderCount = 0
					var Component = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/"
					route(root, "/", {
						"/" : {
							onmatch: function(vnode, resolve) {
								matchCount++
								resolve(Component)
							},
							render: function(vnode) {
								renderCount++
								return vnode
							},
						},
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)

						redraw.publish()

						setTimeout(function() {
							o(matchCount).equals(1)
							o(renderCount).equals(2)

							done()
						}, FRAME_BUDGET)
					})
				})

				o("onmatch can redirect to another route", function(done) {
					var redirected = false

					$window.location.href = prefix + "/"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								route.set("/b")
							}
						},
						"/b" : {
							view: function(vnode){
								redirected = true
							}
						}
					})

					setTimeout(function() {
						o(redirected).equals(true)

						done()
					}, FRAME_BUDGET)
				})

				o("onmatch can redirect to another route that has RouteResolver", function(done) {
					var redirected = false

					$window.location.href = prefix + "/"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								route.set("/b")
							}
						},
						"/b" : {
							render: function(vnode){
								redirected = true
							}
						}
					})

					setTimeout(function() {
						o(redirected).equals(true)

						done()
					}, FRAME_BUDGET)
				})

				o("onmatch resolution callback resolves at most once", function(done) {
					var resolveCount = 0
					var resolvedComponent
					var A = {view: function() {}}
					var B = {view: function() {}}
					var C = {view: function() {}}

					$window.location.href = prefix + "/"
					route(root, "/", {
						"/": {
							onmatch: function(vnode, resolve) {
								resolve(A)
								resolve(B)
								callAsync(function() {resolve(C)})
							},
							render: function(vnode) {
								resolveCount++
								resolvedComponent = vnode.tag
							}
						},
					})
					setTimeout(function() {
						o(resolveCount).equals(1)
						o(resolvedComponent).equals(A)

						done()
					}, FRAME_BUDGET)
				})

				o("the previous view redraws while onmatch resolution is pending (#1268)", function(done, timeout) {
					timeout(FRAME_BUDGET * 5)
					var view = o.spy()
					var onmatch = o.spy()

					$window.location.href = prefix + "/"
					route(root, "/", {
						"/": {view: view},
						"/2": {onmatch: onmatch}
					})

					setTimeout(function() {
						o(view.callCount).equals(1)
						o(onmatch.callCount).equals(0)

						route.set("/2")

						setTimeout(function(){
							o(view.callCount).equals(1)
							o(onmatch.callCount).equals(1)

							redraw.publish()

							setTimeout(function() {
								o(view.callCount).equals(2)
								o(onmatch.callCount).equals(1)

								done()
							}, FRAME_BUDGET)
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

				o("routed mount points can redraw synchronoulsy (#1275)", function(done) {
					var view = o.spy()

					$window.location.href = prefix + "/"
					route(root, "/", {"/":{view:view}})

					setTimeout(function() {
						o(view.callCount).equals(1)

						redraw.publish(true)

						o(view.callCount).equals(2)

						done()
					}, FRAME_BUDGET)
				})

				o("m.route.set(m.route.get()) re-runs the resolution logic (#1180)", function(done, timeout){
					timeout(FRAME_BUDGET * 3)

					var onmatch = o.spy(function(vnode, resolve){resolve()})

					$window.location.href = prefix + "/"
					route(root, '/', {
						"/":{
							onmatch: onmatch,
							render: function(){return m("div")}
						}
					})

					setTimeout(function() {
						o(onmatch.callCount).equals(1)

						route.set(route.get())

						setTimeout(function() {
							o(onmatch.callCount).equals(2)

							done()
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

				o("m.route.get() returns the last fully resolved route (#1276)", function(done){
					$window.location.href = prefix + "/"

					route(root, "/", {
						"/": {view: function(){}},
						"/2": {onmatch: function(){}}
					})


					setTimeout(function() {
						o(route.get()).equals("/")
						
						route.set("/2")
						
						o(route.get()).equals("/")

						done()
					}, FRAME_BUDGET)
				})

				o("routing with RouteResolver works more than once (#1286)", function(done, timeout){
					timeout(FRAME_BUDGET * 4)

					$window.location.href = prefix + "/a"
					route(root, '/a', {
						'/a': {
							render: function() {
								return m("a", "a")
							}
						},
						'/b': {
							render: function() {
								return m("b", "b")
							}
						}
					})

					setTimeout(function(){
						route.set('/b')

						setTimeout(function(){
							route.set('/a')

							setTimeout(function(){
								o(root.firstChild.nodeName).equals("A")

								done()
							}, FRAME_BUDGET)
						}, FRAME_BUDGET)
					}, FRAME_BUDGET)
				})

				o("calling route.set invalidates pending onmatch resolution", function(done, timeout) {
					timeout(100)

					var resolved
					$window.location.href = prefix + "/"
					route(root, "/a", {
						"/a": {
							onmatch: function(vnode, resolve) {
								setTimeout(resolve, 20)
							},
							render: function(vnode) {resolved = "a"}
						},
						"/b": {
							view: function() {resolved = "b"}
						}
					})
					setTimeout(function() {
						route.set("/b")

						setTimeout(function() {
							o(resolved).equals("b")

							done()
						}, 30)
					}, FRAME_BUDGET)
				})
			})
		})
	})
})
