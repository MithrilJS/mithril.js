"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var browserMock = require("../../test-utils/browserMock")

var m = require("../../render/hyperscript")
var callAsync = require("../../test-utils/callAsync")
var apiRedraw = require("../../api/redraw")
var apiRouter = require("../../api/router")
var Promise = require("../../promise/promise")

o.spec("route", function() {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}].forEach(function(env) {
		void ["#", "?", "", "#!", "?!", "/foo"].forEach(function(prefix) {
			o.spec("using prefix `" + prefix + "` starting on " + env.protocol + "//" + env.hostname, function() {
				var FRAME_BUDGET = Math.floor(1000 / 60)
				var $window, root, redrawService, route

				o.beforeEach(function() {
					$window = browserMock(env)

					root = $window.document.body

					redrawService = apiRedraw($window)
					route = apiRouter($window, redrawService)
					route.prefix(prefix)
				})

				o("throws on invalid `root` DOM node", function() {
					var threw = false
					try {
						route(null, "/", {"/":{view: function() {}}})
					} catch (e) {
						threw = true
					}
					o(threw).equals(true)
				})

				o("renders into `root`", function() {
					$window.location.href = prefix + "/"
					route(root, "/", {
						"/" : {
							view: function() {
								return m("div")
							}
						}
					})

					o(root.firstChild.nodeName).equals("DIV")
				})

				o("routed mount points can redraw synchronously (POJO component)", function() {
					var view = o.spy()

					$window.location.href = prefix + "/"
					route(root, "/", {"/":{view:view}})

					o(view.callCount).equals(1)

					redrawService.redraw()

					o(view.callCount).equals(2)

				})

				o("routed mount points can redraw synchronously (constructible component)", function() {
					var view = o.spy()

					var Cmp = function(){}
					Cmp.prototype.view = view

					$window.location.href = prefix + "/"
					route(root, "/", {"/":Cmp})

					o(view.callCount).equals(1)

					redrawService.redraw()

					o(view.callCount).equals(2)

				})

				o("routed mount points can redraw synchronously (closure component)", function() {
					var view = o.spy()

					function Cmp() {return {view: view}}

					$window.location.href = prefix + "/"
					route(root, "/", {"/":Cmp})

					o(view.callCount).equals(1)

					redrawService.redraw()

					o(view.callCount).equals(2)

				})

				o("default route doesn't break back button", function(done) {
					$window.location.href = "http://old.com"
					$window.location.href = "http://new.com"

					route(root, "/a", {
						"/a" : {
							view: function() {
								return m("div")
							}
						}
					})

					callAsync(function() {
						o(root.firstChild.nodeName).equals("DIV")

						o(route.get()).equals("/a")

						$window.history.back()

						o($window.location.pathname).equals("/")
						o($window.location.hostname).equals("old.com")

						done()
					})
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

				o("redraws when render function is executed", function() {
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

					o(oninit.callCount).equals(1)

					redrawService.redraw()

					o(onupdate.callCount).equals(1)
				})

				o("redraws on events", function(done) {
					var onupdate = o.spy()
					var oninit = o.spy()
					var onclick = o.spy()
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

					root.firstChild.dispatchEvent(e)

					o(oninit.callCount).equals(1)

					o(onclick.callCount).equals(1)
					o(onclick.this).equals(root.firstChild)
					o(onclick.args[0].type).equals("click")
					o(onclick.args[0].target).equals(root.firstChild)

					// Wrapped to give time for the rate-limited redraw to fire
					callAsync(function() {
						o(onupdate.callCount).equals(1)

						done()
					})
				})

				o("event handlers can skip redraw", function(done) {
					var onupdate = o.spy()
					var oninit = o.spy()
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

					root.firstChild.dispatchEvent(e)

					o(oninit.callCount).equals(1)

					// Wrapped to ensure no redraw fired
					callAsync(function() {
						o(onupdate.callCount).equals(0)

						done()
					})
				})

				o("changes location on route.link", function() {
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

					var slash = prefix[0] === "/" ? "" : "/"

					o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : ""))

					root.firstChild.dispatchEvent(e)

					o($window.location.href).equals(env.protocol + "//" + (env.hostname === "/" ? "" : env.hostname) + slash + (prefix ? prefix + "/" : "") + "test")
				})

				o("accepts RouteResolver with onmatch that returns Component", function(done) {
					var matchCount = 0
					var renderCount = 0
					var Component = {
						view: function() {
							return m("span")
						}
					}

					var resolver = {
						onmatch: function(args, requestedPath) {
							matchCount++

							o(args.id).equals("abc")
							o(requestedPath).equals("/abc")
							o(this).equals(resolver)
							return Component
						},
						render: function(vnode) {
							renderCount++

							o(vnode.attrs.id).equals("abc")
							o(this).equals(resolver)

							return vnode
						},
					}

					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id" : resolver
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)
						o(root.firstChild.nodeName).equals("SPAN")
						done()
					})
				})

				o("accepts RouteResolver with onmatch that returns Promise<Component>", function(done) {
					var matchCount = 0
					var renderCount = 0
					var Component = {
						view: function() {
							return m("span")
						}
					}

					var resolver = {
						onmatch: function(args, requestedPath) {
							matchCount++

							o(args.id).equals("abc")
							o(requestedPath).equals("/abc")
							o(this).equals(resolver)
							return Promise.resolve(Component)
						},
						render: function(vnode) {
							renderCount++

							o(vnode.attrs.id).equals("abc")
							o(this).equals(resolver)

							return vnode
						},
					}

					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id" : resolver
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)
						o(root.firstChild.nodeName).equals("SPAN")
						done()
					})
				})

				o("accepts RouteResolver with onmatch that returns Promise<undefined>", function(done) {
					var matchCount = 0
					var renderCount = 0

					var resolver = {
						onmatch: function(args, requestedPath) {
							matchCount++

							o(args.id).equals("abc")
							o(requestedPath).equals("/abc")
							o(this).equals(resolver)
							return Promise.resolve()
						},
						render: function(vnode) {
							renderCount++

							o(vnode.attrs.id).equals("abc")
							o(this).equals(resolver)

							return vnode
						},
					}

					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id" : resolver
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)
						o(root.firstChild.nodeName).equals("DIV")
						done()
					})
				})

				o("accepts RouteResolver with onmatch that returns Promise<any>", function(done) {
					var matchCount = 0
					var renderCount = 0

					var resolver = {
						onmatch: function(args, requestedPath) {
							matchCount++

							o(args.id).equals("abc")
							o(requestedPath).equals("/abc")
							o(this).equals(resolver)
							return Promise.resolve([])
						},
						render: function(vnode) {
							renderCount++

							o(vnode.attrs.id).equals("abc")
							o(this).equals(resolver)

							return vnode
						},
					}

					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id" : resolver
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)
						o(root.firstChild.nodeName).equals("DIV")
						done()
					})
				})

				o("accepts RouteResolver with onmatch that returns rejected Promise", function(done) {
					var matchCount = 0
					var renderCount = 0
					var spy = o.spy()

					var resolver = {
						onmatch: function() {
							matchCount++
							return Promise.reject(new Error("error"))
						},
						render: function(vnode) {
							renderCount++
							return vnode
						},
					}

					$window.location.href = prefix + "/test/1"
					route(root, "/default", {
						"/default" : {view: spy},
						"/test/:id" : resolver
					})

					callAsync(function() {
						callAsync(function() {
							o(matchCount).equals(1)
							o(renderCount).equals(0)
							o(spy.callCount).equals(1)
							done()
						})
					})
				})

				o("accepts RouteResolver without `render` method as payload", function(done) {
					var matchCount = 0
					var Component = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id" : {
							onmatch: function(args, requestedPath) {
								matchCount++

								o(args.id).equals("abc")
								o(requestedPath).equals("/abc")

								return Component
							},
						},
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(root.firstChild.nodeName).equals("DIV")
						done()
					})
				})

				o("changing `vnode.key` in `render` resets the component", function(done){
					var oninit = o.spy()
					var Component = {
						oninit: oninit,
						view: function() {
							return m("div")
						}
					}
					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id": {render: function(vnode) {
							return m(Component, {key: vnode.attrs.id})
						}}
					})
					callAsync(function() {
						o(oninit.callCount).equals(1)
						route.set("/def")
						callAsync(function() {
							o(oninit.callCount).equals(2)
							done()
						})
					})
				})

				o("accepts RouteResolver without `onmatch` method as payload", function() {
					var renderCount = 0
					var Component = {
						view: function() {
							return m("div")
						}
					}

					$window.location.href = prefix + "/abc"
					route(root, "/abc", {
						"/:id" : {
							render: function(vnode) {
								renderCount++

								o(vnode.attrs.id).equals("abc")

								return m(Component)
							},
						},
					})

					o(root.firstChild.nodeName).equals("DIV")
					o(renderCount).equals(1)
				})

				o("RouteResolver `render` does not have component semantics", function(done) {
					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							render: function() {
								return m("div")
							},
						},
						"/b" : {
							render: function() {
								return m("div")
							},
						},
					})

					var dom = root.firstChild
					o(root.firstChild.nodeName).equals("DIV")

					route.set("/b")

					callAsync(function() {
						o(root.firstChild).equals(dom)

						done()
					})
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
							onmatch: function() {
								matchCount++
								return Component
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

						redrawService.redraw()

						o(matchCount).equals(1)
						o(renderCount).equals(2)

						done()
					})
				})

				o("calls onmatch and view correct number of times when not onmatch returns undefined", function(done) {
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
							onmatch: function() {
								matchCount++
							},
							render: function() {
								renderCount++
								return {tag: Component}
							},
						},
					})

					callAsync(function() {
						o(matchCount).equals(1)
						o(renderCount).equals(1)

						redrawService.redraw()

						o(matchCount).equals(1)
						o(renderCount).equals(2)

						done()
					})
				})

				o("onmatch can redirect to another route", function(done) {
					var redirected = false
					var render = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								route.set("/b")
							},
							render: render
						},
						"/b" : {
							view: function() {
								redirected = true
							}
						}
					})

					callAsync(function() {
						o(render.callCount).equals(0)
						o(redirected).equals(true)

						done()
					})
				})

				o("onmatch can redirect to another route that has RouteResolver w/ only onmatch", function(done) {
					var redirected = false
					var render = o.spy()
					var view = o.spy(function() {return m("div")})

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								route.set("/b")
							},
							render: render
						},
						"/b" : {
							onmatch: function() {
								redirected = true
								return {view: view}
							}
						}
					})

					callAsync(function() {
						callAsync(function() {
							o(render.callCount).equals(0)
							o(redirected).equals(true)
							o(view.callCount).equals(1)
							o(root.childNodes.length).equals(1)
							o(root.firstChild.nodeName).equals("DIV")

							done()
						})
					})
				})

				o("onmatch can redirect to another route that has RouteResolver w/ only render", function(done) {
					var redirected = false
					var render = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								route.set("/b")
							},
							render: render
						},
						"/b" : {
							render: function(){
								redirected = true
							}
						}
					})

					callAsync(function() {
						o(render.callCount).equals(0)
						o(redirected).equals(true)

						done()
					})
				})

				o("onmatch can redirect to another route that has RouteResolver whose onmatch resolves asynchronously", function(done) {
					var redirected = false
					var render = o.spy()
					var view = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								route.set("/b")
							},
							render: render
						},
						"/b" : {
							onmatch: function() {
								redirected = true
								return new Promise(function(fulfill){
									callAsync(function(){
										fulfill({view: view})
									})
								})
							}
						}
					})

					callAsync(function() {
						callAsync(function() {
							callAsync(function() {
								o(render.callCount).equals(0)
								o(redirected).equals(true)
								o(view.callCount).equals(1)

								done()
							})
						})
					})
				})

				o("onmatch can redirect to another route asynchronously", function(done) {
					var redirected = false
					var render = o.spy()
					var view = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								callAsync(function() {route.set("/b")})
								return new Promise(function() {})
							},
							render: render
						},
						"/b" : {
							onmatch: function() {
								redirected = true
								return {view: view}
							}
						}
					})

					callAsync(function() {
						callAsync(function() {
							callAsync(function() {
								o(render.callCount).equals(0)
								o(redirected).equals(true)
								o(view.callCount).equals(1)

								done()
							})
						})
					})
				})

				o("onmatch can redirect w/ window.history.back()", function(done) {

					var render = o.spy()
					var component = {view: o.spy()}

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a" : {
							onmatch: function() {
								return component
							},
							render: function(vnode) {
								return vnode
							}
						},
						"/b" : {
							onmatch: function() {
								$window.history.back()
								return new Promise(function() {})
							},
							render: render
						}
					})

					callAsync(function() {
						route.set("/b")
						callAsync(function() {
							callAsync(function() {
								callAsync(function() {
									o(render.callCount).equals(0)
									o(component.view.callCount).equals(2)

									done()
								})
							})
						})
					})
				})

				o("onmatch can redirect to a non-existent route that defaults to a RouteResolver w/ onmatch", function(done) {
					var redirected = false
					var render = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/b", {
						"/a" : {
							onmatch: function() {
								route.set("/c")
							},
							render: render
						},
						"/b" : {
							onmatch: function(){
								redirected = true
								return {view: function() {}}
							}
						}
					})

					callAsync(function() {
						callAsync(function() {
							o(render.callCount).equals(0)
							o(redirected).equals(true)

							done()
						})
					})
				})

				o("onmatch can redirect to a non-existent route that defaults to a RouteResolver w/ render", function(done) {
					var redirected = false
					var render = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/b", {
						"/a" : {
							onmatch: function() {
								route.set("/c")
							},
							render: render
						},
						"/b" : {
							render: function(){
								redirected = true
							}
						}
					})

					callAsync(function() {
						callAsync(function() {
							o(render.callCount).equals(0)
							o(redirected).equals(true)

							done()
						})
					})
				})

				o("onmatch can redirect to a non-existent route that defaults to a component", function(done) {
					var redirected = false
					var render = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/b", {
						"/a" : {
							onmatch: function() {
								route.set("/c")
							},
							render: render
						},
						"/b" : {
							view: function(){
								redirected = true
							}
						}
					})

					callAsync(function() {
						callAsync(function() {
							o(render.callCount).equals(0)
							o(redirected).equals(true)

							done()
						})
					})
				})

				o("the previous view redraws while onmatch resolution is pending (#1268)", function(done) {
					var view = o.spy()
					var onmatch = o.spy(function() {
						return new Promise(function() {})
					})

					$window.location.href = prefix + "/a"
					route(root, "/", {
						"/a": {view: view},
						"/b": {onmatch: onmatch}
					})

					o(view.callCount).equals(1)
					o(onmatch.callCount).equals(0)

					route.set("/b")

					callAsync(function() {
						o(view.callCount).equals(1)
						o(onmatch.callCount).equals(1)

						redrawService.redraw()

						o(view.callCount).equals(2)
						o(onmatch.callCount).equals(1)

						done()
					})
				})

				o("when two async routes are racing, the last one set cancels the finalization of the first", function(done) {
					var renderA = o.spy()
					var renderB = o.spy()
					var onmatchA = o.spy(function(){
						return new Promise(function(fulfill) {
							setTimeout(function(){
								fulfill()
							}, 10)
						})
					})

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a": {
							onmatch: onmatchA,
							render: renderA
						},
						"/b": {
							onmatch: function(){
								var p = new Promise(function(fulfill) {
									o(onmatchA.callCount).equals(1)
									o(renderA.callCount).equals(0)
									o(renderB.callCount).equals(0)

									setTimeout(function(){
										o(onmatchA.callCount).equals(1)
										o(renderA.callCount).equals(0)
										o(renderB.callCount).equals(0)

										fulfill()

										p.then(function(){
											o(onmatchA.callCount).equals(1)
											o(renderA.callCount).equals(0)
											o(renderB.callCount).equals(1)

											done()
										})
									}, 20)
								})
								return p
							},
							render: renderB
						}
					})

					callAsync(function() {
						o(onmatchA.callCount).equals(1)
						o(renderA.callCount).equals(0)
						o(renderB.callCount).equals(0)
						route.set("/b")
						o(onmatchA.callCount).equals(1)
						o(renderA.callCount).equals(0)
						o(renderB.callCount).equals(0)
					})
				})

				o("m.route.set(m.route.get()) re-runs the resolution logic (#1180)", function(done){
					var onmatch = o.spy()
					var render = o.spy(function() {return m("div")})

					$window.location.href = prefix + "/"
					route(root, "/", {
						"/": {
							onmatch: onmatch,
							render: render
						}
					})

					callAsync(function() {
						o(onmatch.callCount).equals(1)
						o(render.callCount).equals(1)

						route.set(route.get())

						callAsync(function() {
							callAsync(function() {
								o(onmatch.callCount).equals(2)
								o(render.callCount).equals(2)

								done()
							})
						})
					})
				})

				o("m.route.get() returns the last fully resolved route (#1276)", function(done){
					$window.location.href = prefix + "/"

					route(root, "/", {
						"/": {view: function() {}},
						"/2": {
							onmatch: function() {
								return new Promise(function() {})
							}
						}
					})


					o(route.get()).equals("/")

					route.set("/2")

					callAsync(function() {
						o(route.get()).equals("/")
						done()
					})
				})

				o("routing with RouteResolver works more than once", function(done) {
					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a": {
							render: function() {
								return m("a", "a")
							}
						},
						"/b": {
							render: function() {
								return m("b", "b")
							}
						}
					})

					route.set("/b")

					callAsync(function() {
						route.set("/a")

						callAsync(function() {
							o(root.firstChild.nodeName).equals("A")

							done()
						})
					})
				})

				o("calling route.set invalidates pending onmatch resolution", function(done) {
					var rendered = false
					var resolved
					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a": {
							onmatch: function() {
								return new Promise(function(resolve) {
									callAsync(function() {
										callAsync(function() {
											resolve({view: function() {rendered = true}})
										})
									})
								})
							},
							render: function() {
								rendered = true
								resolved = "a"
							}
						},
						"/b": {
							view: function() {
								resolved = "b"
							}
						}
					})

					route.set("/b")

					callAsync(function() {
						o(rendered).equals(false)
						o(resolved).equals("b")

						callAsync(function() {
							o(rendered).equals(false)
							o(resolved).equals("b")
							done()
						})
					})
				})

				o("route changes activate onbeforeremove", function(done) {
					var spy = o.spy()

					$window.location.href = prefix + "/a"
					route(root, "/a", {
						"/a": {
							onbeforeremove: spy,
							view: function() {}
						},
						"/b": {
							view: function() {}
						}
					})

					route.set("/b")

					callAsync(function() {
						o(spy.callCount).equals(1)

						done()
					})
				})

				o("asynchronous route.set in onmatch works", function(done) {
					var rendered = false, resolved
					route(root, "/a", {
						"/a": {
							onmatch: function() {
								return Promise.resolve().then(function() {
									route.set("/b")
								})
							},
							render: function() {
								rendered = true
								resolved = "a"
							}
						},
						"/b": {
							view: function() {
								resolved = "b"
							}
						},
					})

					callAsync(function() { // tick for popstate for /a
						callAsync(function() { // tick for promise in onmatch
							callAsync(function() { // tick for onpopstate for /b
								o(rendered).equals(false)
								o(resolved).equals("b")

								done()
							})
						})
					})
				})

				o("throttles", function(done, timeout) {
					timeout(200)

					var i = 0
					$window.location.href = prefix + "/"
					route(root, "/", {
						"/": {view: function() {i++}}
					})
					var before = i

					redrawService.redraw()
					redrawService.redraw()
					redrawService.redraw()
					redrawService.redraw()
					var after = i

					setTimeout(function() {
						o(before).equals(1) // routes synchronously
						o(after).equals(2) // redraws synchronously
						o(i).equals(3) // throttles rest
						done()
					}, FRAME_BUDGET * 2)
				})

				o("m.route.param is available outside of route handlers", function(done) {
					$window.location.href = prefix + "/"

					route(root, "/1", {
						"/:id" : {
							view : function() {
								o(route.param("id")).equals("1")

								return m("div")
							}
						}
					})

					o(route.param("id")).equals(undefined);
					o(route.param()).deepEquals(undefined);

					callAsync(function() {
						o(route.param("id")).equals("1")
						o(route.param()).deepEquals({id:"1"})

						done()
					})
				})
			})
		})
	})
})
