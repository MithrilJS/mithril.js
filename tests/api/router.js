import o from "ospec"

import {restoreDOMGlobals, setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("route", () => {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}, {protocol: "http:", hostname: "ööö"}].forEach((env) => {
		void ["#", "?", "", "#!", "?!", "/foo", "/föö"].forEach((prefix) => {
			o.spec(`using prefix \`${prefix}\` starting on ${env.protocol}//${env.hostname}`, () => {
				var fullHost = `${env.protocol}//${env.hostname === "/" ? "" : env.hostname}`
				var fullPrefix = `${fullHost}${prefix[0] === "/" ? "" : "/"}${prefix ? `${prefix}/` : ""}`

				var G = setupGlobals(Object.assign({}, env, {expectNoConsoleError: true}))

				o("returns the right route on init", () => {
					G.window.location.href = `${prefix}/`

					m.route.init(prefix)
					o(m.route.path).equals("/")
					o([...m.route.params]).deepEquals([])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("returns alternate right route on init", () => {
					G.window.location.href = `${prefix}/test`

					m.route.init(prefix)
					o(m.route.path).equals("/test")
					o([...m.route.params]).deepEquals([])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("returns right route on init with escaped unicode", () => {
					G.window.location.href = `${prefix}/%C3%B6?%C3%B6=%C3%B6`

					m.route.init(prefix)
					o(m.route.path).equals("/ö")
					o([...m.route.params]).deepEquals([["ö", "ö"]])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("returns right route on init with unescaped unicode", () => {
					G.window.location.href = `${prefix}/ö?ö=ö`

					m.route.init(prefix)
					o(m.route.path).equals("/ö")
					o([...m.route.params]).deepEquals([["ö", "ö"]])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("sets path asynchronously", async () => {
					G.window.location.href = `${prefix}/a`
					var spy1 = o.spy()
					var spy2 = o.spy()

					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
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
					G.rafMock.fire()

					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(1)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("sets route via pushState/onpopstate", async () => {
					G.window.location.href = `${prefix}/test`
					m.route.init(prefix)

					await Promise.resolve()
					G.rafMock.fire()

					G.window.history.pushState(null, null, `${prefix}/other/x/y/z?c=d#e=f`)
					G.window.onpopstate()

					await Promise.resolve()
					G.rafMock.fire()

					// Yep, before even the throttle mechanism takes hold.
					o(m.route.get()).equals("/other/x/y/z?c=d#e=f")

					await Promise.resolve()
					G.rafMock.fire()

					o(G.rafMock.queueLength()).equals(0)
				})

				o("`replace: true` works", async () => {
					G.window.location.href = `${prefix}/test`
					m.route.init(prefix)

					m.route.set("/other", {replace: true})

					await Promise.resolve()
					G.rafMock.fire()

					G.window.history.back()
					o(G.window.location.href).equals(`${fullHost}/`)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(`${fullHost}/`)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("`replace: true` works in links", async () => {
					G.window.location.href = `${prefix}/test`
					m.route.init(prefix)

					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
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

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					G.window.history.back()
					o(G.window.location.href).equals(`${fullHost}/`)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(`${fullHost}/`)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("`replace: false` works", async () => {
					G.window.location.href = `${prefix}/test`
					m.route.init(prefix)

					m.route.set("/other", {replace: false})

					await Promise.resolve()
					G.rafMock.fire()

					G.window.history.back()
					o(G.window.location.href).equals(`${fullPrefix}test`)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(`${fullPrefix}test`)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("`replace: false` works in links", async () => {
					G.window.location.href = `${prefix}/test`

					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						if (m.route.path === "/test") {
							return m("a", m.route.link({href: "/other", replace: false}))
						} else if (m.route.path === "/other") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					G.window.history.back()
					o(G.window.location.href).equals(`${fullPrefix}test`)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(`${fullPrefix}test`)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("state works", async () => {
					G.window.location.href = `${prefix}/test`
					m.route.init(prefix)

					m.route.set("/other", {state: {a: 1}})

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.history.state).deepEquals({a: 1})
					o(G.rafMock.queueLength()).equals(0)
				})

				o("adds trailing slash where needed", () => {
					G.window.location.href = `${prefix}/test`

					m.route.init(`${prefix}/`)
					o(m.route.path).equals("/test")
					o([...m.route.params]).deepEquals([])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("handles route with search", () => {
					G.window.location.href = `${prefix}/test?a=b&c=d`

					m.route.init(prefix)
					o(m.route.path).equals("/test")
					o([...m.route.params]).deepEquals([["a", "b"], ["c", "d"]])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("reacts to back button", () => {
					G.window.location.href = "http://old.com"
					G.window.location.href = "http://new.com"

					m.route.init(prefix)

					G.window.history.back()

					o(G.window.location.pathname).equals("/")
					o(G.window.location.hostname).equals("old.com")
					o(G.rafMock.queueLength()).equals(0)
				})

				o("changes location on route.Link", async () => {
					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					G.window.location.href = `${prefix}/`
					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test"}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o(G.window.location.href).equals(fullPrefix)

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(`${fullPrefix}test`)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("passes state on route.Link", async () => {
					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0
					G.window.location.href = `${prefix}/`
					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test", state: {a: 1}}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.history.state).deepEquals({a: 1})
					o(G.rafMock.queueLength()).equals(0)
				})

				o("route.Link can render without routes or dom access", () => {
					restoreDOMGlobals()
					m.route.init(prefix, null, "https://localhost/")

					var enabled = m.route.link({href: "/test"})
					o(Object.keys(enabled)).deepEquals(["href", "onclick"])
					o(enabled.href).equals(`${prefix}/test`)
					o(typeof enabled.onclick).equals("function")

					var disabled = m.route.link({disabled: true, href: "/test"})
					o(disabled).deepEquals({disabled: true, "aria-disabled": "true"})
					o(G.rafMock.queueLength()).equals(0)
				})

				o("route.Link doesn't redraw on wrong button", async () => {
					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 10

					G.window.location.href = `${prefix}/`
					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test"}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o(G.window.location.href).equals(fullPrefix)

					G.root.firstChild.dispatchEvent(e)


					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(fullPrefix)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("route.Link doesn't redraw on preventDefault", async () => {
					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					G.window.location.href = `${prefix}/`
					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test", onclick(e) { e.preventDefault() }}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o(G.window.location.href).equals(fullPrefix)

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(fullPrefix)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("route.Link ignores `return false`", async () => {
					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					G.window.location.href = `${prefix}/`
					m.mount(G.root, (isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						if (m.route.path === "/") {
							return m("a", m.route.link({href: "/test", onclick: () => false}))
						} else if (m.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${m.route.path}`)
						}
					})

					o(G.window.location.href).equals(fullPrefix)

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(`${fullPrefix}test`)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("m.route.set(m.route.get()) re-runs the resolution logic (#1180)", async () => {
					var render = o.spy((isInit, redraw) => {
						if (isInit) m.route.init(prefix, redraw)
						return m("div")
					})

					G.window.location.href = `${prefix}/`
					m.mount(G.root, render)

					o(render.callCount).equals(1)

					await Promise.resolve()
					G.rafMock.fire()

					o(render.callCount).equals(1)

					m.route.set(m.route.get())

					await Promise.resolve()
					G.rafMock.fire()
					await Promise.resolve()
					G.rafMock.fire()

					o(render.callCount).equals(2)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("throttles", () => {
					var i = 0

					G.window.location.href = `${prefix}/`
					var redraw = m.mount(G.root, (redraw, isInit) => {
						if (isInit) m.route.init(prefix, redraw)
						i++
					})
					var before = i

					redraw()
					redraw()
					redraw()
					redraw()
					var after = i

					G.rafMock.fire()

					o(before).equals(1) // routes synchronously
					o(after).equals(1) // redraws asynchronously
					o(i).equals(2)
					o(G.rafMock.queueLength()).equals(0)
				})
			})
		})
	})
})
