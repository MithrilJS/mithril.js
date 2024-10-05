/* global window: false, global: false */
import o from "ospec"

import browserMock from "../test-utils/browserMock.js"

o.spec("api", function() {
	var FRAME_BUDGET = Math.floor(1000 / 60)
	var root

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	var m

	o.before(async () => {
		var mock = browserMock()
		mock.setTimeout = setTimeout
		if (typeof global !== "undefined") {
			global.window = mock
			global.requestAnimationFrame = mock.requestAnimationFrame
		}
		const mod = await import("../src/entry/mithril.esm.js")
		m = mod.default
	})

	o.afterEach(function() {
		if (root) m.mount(root, null)
	})

	o.spec("m", function() {
		o("works", function() {
			var vnode = m("div")

			o(vnode.tag).equals("div")
		})
	})
	o.spec("m.normalize", function() {
		o("works", function() {
			var vnode = m.normalize([m("div")])

			o(vnode.tag).equals("[")
			o(vnode.children.length).equals(1)
			o(vnode.children[0].tag).equals("div")
		})
	})
	o.spec("m.key", function() {
		o("works", function() {
			var vnode = m.key(123, [m("div")])

			o(vnode.tag).equals("=")
			o(vnode.state).equals(123)
			o(vnode.children.length).equals(1)
			o(vnode.children[0].tag).equals("div")
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
			root = window.document.createElement("div")
			m.render(root, m("div"))

			o(root.childNodes.length).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
		})
	})

	o.spec("m.mount", function() {
		o("works", function() {
			root = window.document.createElement("div")
			m.mount(root, () => m("div"))

			o(root.childNodes.length).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
		})
	})

	o.spec("m.redraw", function() {
		o("works", function() {
			var count = 0
			root = window.document.createElement("div")
			m.mount(root, () => {count++})
			o(count).equals(1)
			m.redraw()
			o(count).equals(1)
			return sleep(FRAME_BUDGET + 10).then(() => {
				o(count).equals(2)
			})
		})
	})

	o.spec("m.redrawSync", function() {
		o("works", function() {
			root = window.document.createElement("div")
			var view = o.spy()
			m.mount(root, view)
			o(view.callCount).equals(1)
			m.redrawSync()
			o(view.callCount).equals(2)
		})
	})

	o.spec("m.route", function() {
		o("works", function() {
			root = window.document.createElement("div")
			m.route.init("#")
			m.mount(root, () => {
				if (m.route.path === "/a") {
					return m("div")
				} else if (m.route.path === "/b") {
					return m("span")
				} else {
					m.route.set("/a")
				}
			})

			return sleep(FRAME_BUDGET + 10)
				.then(() => {
					o(root.childNodes.length).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(m.route.get()).equals("/a")
				})
				.then(() => { m.route.set("/b") })
				.then(() => sleep(FRAME_BUDGET + 10))
				.then(() => { o(m.route.get()).equals("/b") })
		})
	})
})
