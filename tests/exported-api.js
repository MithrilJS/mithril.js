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
	o.spec("m.keyed", function() {
		o("works", function() {
			var vnode = m.keyed([123], (k) => [k, [m("div")]])

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)
			o(vnode.a.size).equals(1)
			o([...vnode.a][0][0]).equals(123)
			o([...vnode.a][0][1].c.length).equals(1)
			o([...vnode.a][0][1].c[0].t).equals("div")
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

	o.spec("m.WithRouter, m.Link", function() {
		o("works", async() => {
			var route
			var App = (_attrs, _old, context) => {
				route = context.route
				if (route.path === "/a") {
					return m("div")
				} else if (route.path === "/b") {
					return m("a", m(m.Link, {href: "/a"}))
				} else {
					route.set("/a")
				}
			}

			m.mount(G.root, () => m(m.WithRouter, {prefix: "#"}, m(App)))

			await Promise.resolve()
			G.rafMock.fire()
			o(G.rafMock.queueLength()).equals(0)

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(route.current).equals("/a")

			route.set("/b")

			await Promise.resolve()
			G.rafMock.fire()
			o(G.rafMock.queueLength()).equals(0)

			o(route.current).equals("/b")
		})
	})
})
