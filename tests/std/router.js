import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("route", () => {
	void [{protocol: "http:", hostname: "localhost"}, {protocol: "file:", hostname: "/"}, {protocol: "http:", hostname: "ööö"}].forEach((env) => {
		void ["#", "?", "", "#!", "?!", "/foo", "/föö"].forEach((prefix) => {
			o.spec(`using prefix \`${prefix}\` starting on ${env.protocol}//${env.hostname}`, () => {
				var fullHost = `${env.protocol}//${env.hostname === "/" ? "" : env.hostname}`
				var fullPrefix = `${fullHost}${prefix[0] === "/" ? "" : "/"}${prefix ? `${prefix}/` : ""}`

				var G = setupGlobals({...env, expectNoConsoleError: true})

				o("returns the right route on init", () => {
					G.window.location.href = `${prefix}/`

					var App = o.spy()

					m.render(G.root, m(m.WithRouter, {prefix}, m(App)))

					o(App.callCount).equals(1)
					o(App.this.route.path).equals("/")
					o([...App.this.route.params]).deepEquals([])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("returns alternate right route on init", () => {
					G.window.location.href = `${prefix}/test`

					var App = o.spy()

					m.render(G.root, m(m.WithRouter, {prefix}, m(App)))

					o(App.callCount).equals(1)
					o(App.this.route.path).equals("/test")
					o([...App.this.route.params]).deepEquals([])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("returns right route on init with escaped unicode", () => {
					G.window.location.href = `${prefix}/%C3%B6?%C3%B6=%C3%B6`

					var App = o.spy()

					m.render(G.root, m(m.WithRouter, {prefix}, m(App)))

					o(App.callCount).equals(1)
					o(App.this.route.path).equals("/ö")
					o([...App.this.route.params]).deepEquals([["ö", "ö"]])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("returns right route on init with unescaped unicode", () => {
					G.window.location.href = `${prefix}/ö?ö=ö`

					var App = o.spy()

					m.render(G.root, m(m.WithRouter, {prefix}, m(App)))

					o(App.callCount).equals(1)
					o(App.this.route.path).equals("/ö")
					o([...App.this.route.params]).deepEquals([["ö", "ö"]])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("sets path asynchronously", async () => {
					G.window.location.href = `${prefix}/a`
					var spy1 = o.spy()
					var spy2 = o.spy()
					var route

					var App = function () {
						route = this.route
						if (this.route.path === "/a") {
							spy1()
						} else if (this.route.path === "/b") {
							spy2()
						} else {
							throw new Error(`Unknown path ${route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					o(spy1.callCount).equals(1)
					o(spy2.callCount).equals(0)
					route.set("/b")
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

					var route
					var App = function () {
						route = this.route
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					await Promise.resolve()
					G.rafMock.fire()

					G.window.history.pushState(null, null, `${prefix}/other/x/y/z?c=d#e=f`)
					G.window.onpopstate()

					await Promise.resolve()
					G.rafMock.fire()

					// Yep, before even the throttle mechanism takes hold.
					o(route.current).equals("/other/x/y/z?c=d#e=f")

					await Promise.resolve()
					G.rafMock.fire()

					o(G.rafMock.queueLength()).equals(0)
				})

				o("`replace: true` works", async () => {
					G.window.location.href = `${prefix}/test`

					var route
					var App = function () {
						route = this.route
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					route.set("/other", {replace: true})

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

					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 0

					var App = function () {
						if (this.route.path === "/test") {
							return m("a", m.link("/other", {replace: true}))
						} else if (this.route.path === "/other") {
							return m("div")
						} else if (this.route.path === "/") {
							return m("span")
						} else {
							throw new Error(`Unknown route: ${this.route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

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

					var route
					var App = function () {
						route = this.route
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					route.set("/other", {replace: false})

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

					var App = function () {
						if (this.route.path === "/test") {
							return m("a", m.link("/other", {replace: false}))
						} else if (this.route.path === "/other") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${this.route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

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

					var route
					var App = function () {
						route = this.route
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					route.set("/other", {state: {a: 1}})

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.history.state).deepEquals({a: 1})
					o(G.rafMock.queueLength()).equals(0)
				})

				o("adds trailing slash where needed", () => {
					G.window.location.href = `${prefix}/test`

					var route
					var App = function () {
						route = this.route
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix: `${prefix}/`}, m(App)))

					o(route.path).equals("/test")
					o([...route.params]).deepEquals([])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("handles route with search", () => {
					G.window.location.href = `${prefix}/test?a=b&c=d`

					var route
					var App = function () {
						route = this.route
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					o(route.path).equals("/test")
					o([...route.params]).deepEquals([["a", "b"], ["c", "d"]])
					o(G.rafMock.queueLength()).equals(0)
				})

				o("reacts to back button", () => {
					G.window.location.href = "http://old.com"
					G.window.location.href = "http://new.com"

					var App = () => {}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

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

					var App = function () {
						if (this.route.path === "/") {
							return m("a", m.link("/test"))
						} else if (this.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${this.route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

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

					var App = function () {
						if (this.route.path === "/") {
							return m("a", m.link("/test", {state: {a: 1}}))
						} else if (this.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${this.route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.history.state).deepEquals({a: 1})
					o(G.rafMock.queueLength()).equals(0)
				})

				o("route.Link doesn't redraw on wrong button", async () => {
					var e = G.window.document.createEvent("MouseEvents")

					e.initEvent("click", true, true)
					e.button = 10

					G.window.location.href = `${prefix}/`

					var App = function () {
						if (this.route.path === "/") {
							return m("a", m.link("/test"))
						} else if (this.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${this.route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

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

					var App = function () {
						if (this.route.path === "/") {
							return m("a", {onclick(e) { e.preventDefault() }}, m.link("/test"))
						} else if (this.route.path === "/test") {
							return m("div")
						} else {
							throw new Error(`Unknown route: ${this.route.path}`)
						}
					}

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					o(G.window.location.href).equals(fullPrefix)

					G.root.firstChild.dispatchEvent(e)

					await Promise.resolve()
					G.rafMock.fire()

					o(G.window.location.href).equals(fullPrefix)
					o(G.rafMock.queueLength()).equals(0)
				})

				o("`route.set(m.route.current)` re-runs the resolution logic (#1180)", async () => {
					G.window.location.href = `${prefix}/`

					var route
					var App = o.spy(function () {
						route = this.route
						return m("div")
					})

					m.mount(G.root, () => m(m.WithRouter, {prefix}, m(App)))

					o(App.callCount).equals(1)

					await Promise.resolve()
					G.rafMock.fire()

					o(App.callCount).equals(1)

					route.set(route.current)

					await Promise.resolve()
					G.rafMock.fire()
					await Promise.resolve()
					G.rafMock.fire()

					o(App.callCount).equals(2)
					o(G.rafMock.queueLength()).equals(0)
				})
			})
		})
	})
})
