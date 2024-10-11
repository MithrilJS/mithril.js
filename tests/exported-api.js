/* eslint-disable no-bitwise */
import o from "ospec"

import {setupGlobals} from "../test-utils/global.js"

import m from "../src/entry/mithril.esm.js"

o.spec("api", function() {
	var G = setupGlobals()

	o.spec("m", function() {
		o("works", function() {
			var vnode = m("div")

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_ELEMENT)
			o(vnode.t).equals("div")
		})
	})
	o.spec("m.normalize", function() {
		o("works", function() {
			var vnode = m.normalize([m("div")])

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
			o(vnode.c.length).equals(1)
			o(vnode.c[0].t).equals("div")
		})
	})
	o.spec("m.key", function() {
		o("works", function() {
			var vnode = m.key(123, [m("div")])

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEY)
			o(vnode.t).equals(123)
			o(vnode.c.length).equals(1)
			o(vnode.c[0].t).equals("div")
		})
	})
	o.spec("m.p", function() {
		o("works", function() {
			var query = m.p("/foo/:c", {a: 1, b: 2, c: 3})

			o(query).equals("/foo/3?a=1&b=2")
		})
	})
	o.spec("m.render", function() {
		o("works", function() {
			m.render(G.root, m("div"))

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild.nodeName).equals("DIV")
		})
	})

	o.spec("m.mount", function() {
		o("works", function() {
			var count = 0
			var redraw = m.mount(G.root, () => {
				count++
				return m("div")
			})

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild.nodeName).equals("DIV")

			redraw()
			o(count).equals(1)
			G.rafMock.fire()
			o(count).equals(2)

			redraw.sync()
			o(count).equals(3)
		})
	})

	o.spec("m.route", function() {
		o("works", async() => {
			m.mount(G.root, (isInit, redraw) => {
				if (isInit) m.route.init("#", redraw)
				if (m.route.path === "/a") {
					return m("div")
				} else if (m.route.path === "/b") {
					return m("span")
				} else {
					m.route.set("/a")
				}
			})

			await Promise.resolve()
			G.rafMock.fire()
			o(G.rafMock.queueLength()).equals(0)

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(m.route.get()).equals("/a")

			m.route.set("/b")

			await Promise.resolve()
			G.rafMock.fire()
			o(G.rafMock.queueLength()).equals(0)

			o(m.route.get()).equals("/b")
		})
	})
})
