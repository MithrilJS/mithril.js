"use strict"

var o = require("ospec")
var browserMock = require("../test-utils/browserMock")

o.spec("api", function() {
	var FRAME_BUDGET = Math.floor(1000 / 60)
	var mock = browserMock(), root
	mock.setTimeout = setTimeout
	if (typeof global !== "undefined") {
		global.window = mock
		global.requestAnimationFrame = mock.requestAnimationFrame
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	var m = require("..") // eslint-disable-line global-require

	o.afterEach(function() {
		if (root) m.mount(root, null)
	})

	o.spec("m", function() {
		o("works", function() {
			var vnode = m("div")

			o(vnode.tag).equals("div")
		})
	})
	o.spec("m.fragment", function() {
		o("works", function() {
			var vnode = m.fragment([m("div")])

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
		o("sync", function() {
			root = window.document.createElement("div")
			var view = o.spy()
			m.mount(root, view)
			o(view.callCount).equals(1)
			m.redraw.sync()
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
