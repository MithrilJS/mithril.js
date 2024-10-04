"use strict"

// Low-priority TODO: remove the dependency on the renderer here.
var o = require("ospec")
var browserMock = require("../../test-utils/browserMock")
var throttleMocker = require("../../test-utils/throttleMock")

var m = require("../../render/hyperscript")
var apiMountRedraw = require("../../api/mount-redraw")
var apiRouter = require("../../api/router")

o.spec("route", () => {
	// Note: the `n` parameter used in calls to this are generally found by
	// either trial-and-error or by studying the source. If tests are failing,
	// find the failing assertions, set `n` to about 10 on the preceding call to
	// `waitCycles`, then drop them down incrementally until it fails. The last
	// one to succeed is the one you want to keep. And just do that for each
	// failing assertion, and it'll eventually work.
	//
	// This is effectively what I did when designing this and hooking everything
	// up. (It would be so much easier to just be able to run the calls with a
	// different event loop and just turn it until I get what I want, but JS
	// lacks that functionality.)

	// Use precisely what `m.route` uses, for consistency and to ensure timings
	// are aligned.
	function waitCycles(n) {
		n = Math.max(n, 1)
		return new Promise(function(resolve) {
			return loop()
			function loop() {
				if (n === 0) resolve()
				else { n--; setTimeout(loop, 4) }
			}
		})
	}

	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}, {protocol: "http:", hostname: "ööö"}].forEach((env) => {
		void ["#", "?", "", "#!", "?!", "/foo", "/föö"].forEach((prefix) => {
			o.spec(`using prefix \`${prefix}\` starting on ${env.protocol}//${env.hostname}`, () => {
				var fullHost = `${env.protocol}//${env.hostname === "/" ? "" : env.hostname}`
				var fullPrefix = `${fullHost}${prefix[0] === "/" ? "" : "/"}${prefix ? `${prefix}/` : ""}`

				var $window, root, mountRedraw, route, throttleMock

				// In case it doesn't get reset
				var realError = console.error

				o.beforeEach(() => {
					$window = browserMock(env)
					$window.setTimeout = setTimeout
					// $window.setImmediate = setImmediate
					throttleMock = throttleMocker()

					root = $window.document.body

					mountRedraw = apiMountRedraw(throttleMock.schedule, console)
					route = apiRouter($window, mountRedraw.redraw)
					console.error = function () {
						realError.call(this, new Error("Unexpected `console.error` call"))
						realError.apply(this, arguments)
					}
				})

				o.afterEach(() => {
					console.error = realError
				})

				o("returns the right route on init", () => {
					$window.location.href = `${prefix}/`

					route.init(prefix)
					o(route.path).equals("/")
					o([...route.params]).deepEquals([])
					o(throttleMock.queueLength()).equals(0)
				})

				o("returns alternate right route on init", () => {
					$window.location.href = `${prefix}/test`

					route.init(prefix)
					o(route.path).equals("/test")
					o([...route.params]).deepEquals([])
					o(throttleMock.queueLength()).equals(0)
				})

				o("returns right route on init with escaped unicode", () => {
					$window.location.href = `${prefix}/%C3%B6?%C3%B6=%C3%B6`

					route.init(prefix)
					o(route.path).equals("/ö")
					o([...route.params]).deepEquals([["ö", "ö"]])
					o(throttleMock.queueLength()).equals(0)
				})

				o("returns right route on init with unescaped unicode", () => {
					$window.location.href = `${prefix}/ö?ö=ö`

					route.init(prefix)
					o(route.path).equals("/ö")
					o([...route.params]).deepEquals([["ö", "ö"]])
					o(throttleMock.queueLength()).equals(0)
				})

				o("sets path asynchronously", () => {
					$window.location.href = `${prefix}/a`
					var spy1 = o.spy()
					var spy2 = o.spy()

					route.init(prefix)
					mountRedraw.mount(root, () => {
						if (route.path === "/a") {
							spy1()
						} else if (route.path === "/b") {
							spy2()
						} else {
							throw new Error(`Unknown path ${route.path}`)
						}
					})

					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)
					route.set("/b")
					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)
					return waitCycles(1).then(() => {
						throttleMock.fire()

						o(spy1.callCount).equals(1)
						o(spy2.callCount).equals(1)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("sets route via pushState/onpopstate", () => {
					$window.location.href = `${prefix}/test`
					route.init(prefix)

					return waitCycles(1)
						.then(() => {
							$window.history.pushState(null, null, `${prefix}/other/x/y/z?c=d#e=f`)
							$window.onpopstate()
						})
						.then(() => waitCycles(1))
						.then(() => {
							// Yep, before even the throttle mechanism takes hold.
							o(route.get()).equals("/other/x/y/z?c=d#e=f")
							throttleMock.fire()
							o(throttleMock.queueLength()).equals(0)
						})
				})

				o("`replace: true` works", () => {
					$window.location.href = `${prefix}/test`
					route.init(prefix)

					route.set("/other", {replace: true})

					return waitCycles(1).then(() => {
						throttleMock.fire()
						$window.history.back()
						o($window.location.href).equals(`${fullHost}/`)
						throttleMock.fire()
						o($window.location.href).equals(`${fullHost}/`)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("`replace: true` works in links", () => {
					$window.location.href = `${prefix}/test`
					route.init(prefix)

					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					mountRedraw.mount(root, () => {
						if (route.path === "/test") {
							return m("a", route.link({href: "/other", replace: true}))
						} else if (route.path === "/other") {
							return m("div")
						} else if (route.path === "/") {
							return m("span")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						$window.history.back()
						o($window.location.href).equals(`${fullHost}/`)
						throttleMock.fire()
						o($window.location.href).equals(`${fullHost}/`)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("`replace: false` works", () => {
					$window.location.href = `${prefix}/test`
					route.init(prefix)

					route.set("/other", {replace: false})

					return waitCycles(1).then(() => {
						throttleMock.fire()
						$window.history.back()
						o($window.location.href).equals(`${fullPrefix}test`)
						throttleMock.fire()
						o($window.location.href).equals(`${fullPrefix}test`)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("`replace: false` works in links", () => {
					$window.location.href = `${prefix}/test`
					route.init(prefix)

					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					mountRedraw.mount(root, () => {
						if (route.path === "/test") {
							return m("a", route.link({href: "/other", replace: false}))
						} else if (route.path === "/other") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						$window.history.back()
						o($window.location.href).equals(`${fullPrefix}test`)
						throttleMock.fire()
						o($window.location.href).equals(`${fullPrefix}test`)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("state works", () => {
					$window.location.href = `${prefix}/test`
					route.init(prefix)

					route.set("/other", {state: {a: 1}})
					return waitCycles(1).then(() => {
						throttleMock.fire()
						o($window.history.state).deepEquals({a: 1})
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("adds trailing slash where needed", () => {
					$window.location.href = `${prefix}/test`

					route.init(`${prefix}/`)
					o(route.path).equals("/test")
					o([...route.params]).deepEquals([])
					o(throttleMock.queueLength()).equals(0)
				})

				o("handles route with search", () => {
					$window.location.href = `${prefix}/test?a=b&c=d`

					route.init(prefix)
					o(route.path).equals("/test")
					o([...route.params]).deepEquals([["a", "b"], ["c", "d"]])
					o(throttleMock.queueLength()).equals(0)
				})

				o("reacts to back button", () => {
					$window.location.href = "http://old.com"
					$window.location.href = "http://new.com"

					route.init(prefix)

					$window.history.back()

					o($window.location.pathname).equals("/")
					o($window.location.hostname).equals("old.com")
					o(throttleMock.queueLength()).equals(0)
				})

				o("changes location on route.Link", () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, () => {
						if (route.path === "/") {
							return m("a", route.link({href: "/test"}))
						} else if (route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						o($window.location.href).equals(`${fullPrefix}test`)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("passes state on route.Link", () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0
					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, () => {
						if (route.path === "/") {
							return m("a", route.link({href: "/test", state: {a: 1}}))
						} else if (route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						o($window.history.state).deepEquals({a: 1})
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("route.Link can render without routes or dom access", () => {
					$window = browserMock(env)
					var route = apiRouter(null, null)
					route.init(prefix)

					var enabled = route.link({href: "/test"})
					o(Object.keys(enabled)).deepEquals(["href", "onclick"])
					o(enabled.href).equals(`${prefix}/test`)
					o(typeof enabled.onclick).equals("function")

					var disabled = route.link({disabled: true, href: "/test"})
					o(disabled).deepEquals({disabled: true, "aria-disabled": "true"})
					o(throttleMock.queueLength()).equals(0)
				})

				o("route.Link doesn't redraw on wrong button", () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 10

					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, () => {
						if (route.path === "/") {
							return m("a", route.link({href: "/test"}))
						} else if (route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						o($window.location.href).equals(fullPrefix)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("route.Link doesn't redraw on preventDefault", () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, () => {
						if (route.path === "/") {
							return m("a", route.link({href: "/test", onclick(e) { e.preventDefault() }}))
						} else if (route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						o($window.location.href).equals(fullPrefix)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("route.Link ignores `return false`", () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, () => {
						if (route.path === "/") {
							return m("a", route.link({href: "/test", onclick: () => false}))
						} else if (route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						o($window.location.href).equals(`${fullPrefix}test`)
						o(throttleMock.queueLength()).equals(0)
					})
				})

				o("m.route.set(m.route.get()) re-runs the resolution logic (#1180)", () => {
					var render = o.spy(() => m("div"))

					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, render)

					return waitCycles(1).then(() => {
						throttleMock.fire()
						o(render.callCount).equals(1)

						route.set(route.get())

						return waitCycles(2).then(() => {
							throttleMock.fire()
							o(render.callCount).equals(2)
							o(throttleMock.queueLength()).equals(0)
						})
					})
				})

				o("throttles", () => {
					var i = 0

					$window.location.href = `${prefix}/`
					route.init(prefix)
					mountRedraw.mount(root, () => { i++ })
					var before = i

					mountRedraw.redraw()
					mountRedraw.redraw()
					mountRedraw.redraw()
					mountRedraw.redraw()
					var after = i

					throttleMock.fire()

					o(before).equals(1) // routes synchronously
					o(after).equals(1) // redraws asynchronously
					o(i).equals(2)
					o(throttleMock.queueLength()).equals(0)
				})
			})
		})
	})
})
