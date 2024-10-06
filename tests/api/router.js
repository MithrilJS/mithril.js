import o from "ospec"

import {injectGlobals, register, restoreGlobalState} from "../../test-utils/redraw-registry.js"
import {restoreDOMGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

import browserMock from "../../test-utils/browserMock.js"
import throttleMocker from "../../test-utils/throttleMock.js"

o.spec("route", () => {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}, {protocol: "http:", hostname: "ööö"}].forEach((env) => {
		void ["#", "?", "", "#!", "?!", "/foo", "/föö"].forEach((prefix) => {
			o.spec(`using prefix \`${prefix}\` starting on ${env.protocol}//${env.hostname}`, () => {
				var fullHost = `${env.protocol}//${env.hostname === "/" ? "" : env.hostname}`
				var fullPrefix = `${fullHost}${prefix[0] === "/" ? "" : "/"}${prefix ? `${prefix}/` : ""}`

				var $window, root, throttleMock

				o.beforeEach(() => {
					$window = browserMock(env)
					throttleMock = throttleMocker()
					injectGlobals($window, throttleMock)
					root = register($window.document.body)
					var realError = console.error
					console.error = function () {
						realError.call(this, new Error("Unexpected `console.error` call"))
						realError.apply(this, arguments)
					}
				})

				o.afterEach(restoreGlobalState)

				o("returns the right route on init", () => {
					$window.location.href = `${prefix}/`

					m.route.init(prefix)
					o(m.route.path).equals("/")
					o([...m.route.params]).deepEquals([])
					o(throttleMock.queueLength()).equals(0)
				})

				o("returns alternate right route on init", () => {
					$window.location.href = `${prefix}/test`

					m.route.init(prefix)
					o(m.route.path).equals("/test")
					o([...m.route.params]).deepEquals([])
					o(throttleMock.queueLength()).equals(0)
				})

				o("returns right route on init with escaped unicode", () => {
					$window.location.href = `${prefix}/%C3%B6?%C3%B6=%C3%B6`

					m.route.init(prefix)
					o(m.route.path).equals("/ö")
					o([...m.route.params]).deepEquals([["ö", "ö"]])
					o(throttleMock.queueLength()).equals(0)
				})

				o("returns right route on init with unescaped unicode", () => {
					$window.location.href = `${prefix}/ö?ö=ö`

					m.route.init(prefix)
					o(m.route.path).equals("/ö")
					o([...m.route.params]).deepEquals([["ö", "ö"]])
					o(throttleMock.queueLength()).equals(0)
				})

				o("sets path asynchronously", async () => {
					$window.location.href = `${prefix}/a`
					var spy1 = o.spy()
					var spy2 = o.spy()

					m.route.init(prefix)
					m.mount(root, () => {
						if (m.route.path === "/a") {
							spy1()
						} else if (m.route.path === "/b") {
							spy2()
						} else {
							throw new Error(`Unknown path ${m.route.path}`)
						}
					})

					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)
					m.route.set("/b")
					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)

					await Promise.resolve()
					throttleMock.fire()

					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(1)
					o(throttleMock.queueLength()).equals(0)
				})

				o("sets route via pushState/onpopstate", async () => {
					$window.location.href = `${prefix}/test`
					m.route.init(prefix)

					await Promise.resolve()
					throttleMock.fire()

					$window.history.pushState(null, null, `${prefix}/other/x/y/z?c=d#e=f`)
					$window.onpopstate()

					await Promise.resolve()
					throttleMock.fire()

					// Yep, before even the throttle mechanism takes hold.
					o(m.route.get()).equals("/other/x/y/z?c=d#e=f")

					await Promise.resolve()
					throttleMock.fire()

					o(throttleMock.queueLength()).equals(0)
				})

				o("`replace: true` works", async () => {
					$window.location.href = `${prefix}/test`
					m.route.init(prefix)

					m.route.set("/other", {replace: true})

					await Promise.resolve()
					throttleMock.fire()

					$window.history.back()
					o($window.location.href).equals(`${fullHost}/`)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(`${fullHost}/`)
					o(throttleMock.queueLength()).equals(0)
				})

				o("`replace: true` works in links", async () => {
					$window.location.href = `${prefix}/test`
					m.route.init(prefix)

					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					m.mount(root, () => {
						if (m.route.path === "/test") {
							return m("a", m.route.link({href: "/other", replace: true}))
						} else if (m.route.path === "/other") {
							return m("div")
						} else if (m.route.path === "/") {
							return m("span")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					throttleMock.fire()

					$window.history.back()
					o($window.location.href).equals(`${fullHost}/`)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(`${fullHost}/`)
					o(throttleMock.queueLength()).equals(0)
				})

				o("`replace: false` works", async () => {
					$window.location.href = `${prefix}/test`
					m.route.init(prefix)

					m.route.set("/other", {replace: false})

					await Promise.resolve()
					throttleMock.fire()

					$window.history.back()
					o($window.location.href).equals(`${fullPrefix}test`)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(`${fullPrefix}test`)
					o(throttleMock.queueLength()).equals(0)
				})

				o("`replace: false` works in links", async () => {
					$window.location.href = `${prefix}/test`
					m.route.init(prefix)

					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					m.mount(root, () => {
						if (m.route.path === "/test") {
							return m("a", m.route.link({href: "/other", replace: false}))
						} else if (m.route.path === "/other") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					throttleMock.fire()

					$window.history.back()
					o($window.location.href).equals(`${fullPrefix}test`)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(`${fullPrefix}test`)
					o(throttleMock.queueLength()).equals(0)
				})

				o("state works", async () => {
					$window.location.href = `${prefix}/test`
					m.route.init(prefix)

					m.route.set("/other", {state: {a: 1}})

					await Promise.resolve()
					throttleMock.fire()

					o($window.history.state).deepEquals({a: 1})
					o(throttleMock.queueLength()).equals(0)
				})

				o("adds trailing slash where needed", () => {
					$window.location.href = `${prefix}/test`

					m.route.init(`${prefix}/`)
					o(m.route.path).equals("/test")
					o([...m.route.params]).deepEquals([])
					o(throttleMock.queueLength()).equals(0)
				})

				o("handles route with search", () => {
					$window.location.href = `${prefix}/test?a=b&c=d`

					m.route.init(prefix)
					o(m.route.path).equals("/test")
					o([...m.route.params]).deepEquals([["a", "b"], ["c", "d"]])
					o(throttleMock.queueLength()).equals(0)
				})

				o("reacts to back button", () => {
					$window.location.href = "http://old.com"
					$window.location.href = "http://new.com"

					m.route.init(prefix)

					$window.history.back()

					o($window.location.pathname).equals("/")
					o($window.location.hostname).equals("old.com")
					o(throttleMock.queueLength()).equals(0)
				})

				o("changes location on route.Link", async () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, () => {
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test"}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(`${fullPrefix}test`)
					o(throttleMock.queueLength()).equals(0)
				})

				o("passes state on route.Link", async () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0
					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, () => {
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test", state: {a: 1}}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					throttleMock.fire()

					o($window.history.state).deepEquals({a: 1})
					o(throttleMock.queueLength()).equals(0)
				})

				o("route.Link can render without routes or dom access", () => {
					restoreDOMGlobals()
					m.route.init(prefix, "https://localhost/")

					var enabled = m.route.link({href: "/test"})
					o(Object.keys(enabled)).deepEquals(["href", "onclick"])
					o(enabled.href).equals(`${prefix}/test`)
					o(typeof enabled.onclick).equals("function")

					var disabled = m.route.link({disabled: true, href: "/test"})
					o(disabled).deepEquals({disabled: true, "aria-disabled": "true"})
					o(throttleMock.queueLength()).equals(0)
				})

				o("route.Link doesn't redraw on wrong button", async () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 10

					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, () => {
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test"}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)


					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(fullPrefix)
					o(throttleMock.queueLength()).equals(0)
				})

				o("route.Link doesn't redraw on preventDefault", async () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, () => {
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test", onclick(e) { e.preventDefault() }}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(fullPrefix)
					o(throttleMock.queueLength()).equals(0)
				})

				o("route.Link ignores `return false`", async () => {
					var e = $window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, () => {
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test", onclick: () => false}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o($window.location.href).equals(fullPrefix)

					root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					throttleMock.fire()

					o($window.location.href).equals(`${fullPrefix}test`)
					o(throttleMock.queueLength()).equals(0)
				})

				o("m.route.set(m.route.get()) re-runs the resolution logic (#1180)", async () => {
					var render = o.spy(() => m("div"))

					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, render)

					o(render.callCount).equals(1)

					await Promise.resolve()
					throttleMock.fire()

					o(render.callCount).equals(1)

					m.route.set(m.route.get())

					await Promise.resolve()
					throttleMock.fire()
					await Promise.resolve()
					throttleMock.fire()

					o(render.callCount).equals(2)
					o(throttleMock.queueLength()).equals(0)
				})

				o("throttles", () => {
					var i = 0

					$window.location.href = `${prefix}/`
					m.route.init(prefix)
					m.mount(root, () => { i++ })
					var before = i

					m.redraw()
					m.redraw()
					m.redraw()
					m.redraw()
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
