import o from "ospec"

import {injectGlobals, register, restoreGlobalState} from "../test-utils/redraw-registry.js"

import m from "../src/entry/mithril.esm.js"

import browserMock from "../test-utils/browserMock.js"
import throttleMocker from "../test-utils/throttleMock.js"

o.spec("api", function() {
	var $window, throttleMock, root

	o.beforeEach(() => {
		injectGlobals($window = browserMock(), throttleMock = throttleMocker())
	})

	o.afterEach(restoreGlobalState)

	o.spec("m", function() {
		o("works", function() {
			var vnode = m("div")

			o(vnode.tag).equals("div")
		})
	})
	o.spec("m.normalize", function() {
		o("works", function() {
			var vnode = m.normalize([m("div")])

			o(vnode.tag).equals(Symbol.for("m.Fragment"))
			o(vnode.children.length).equals(1)
			o(vnode.children[0].tag).equals("div")
		})
	})
	o.spec("m.key", function() {
		o("works", function() {
			var vnode = m.key(123, [m("div")])

			o(vnode.tag).equals(Symbol.for("m.key"))
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
			root = register($window.document.createElement("div"))
			m.render(root, m("div"))

			o(root.childNodes.length).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
		})
	})

	o.spec("m.mount", function() {
		o("works", function() {
			root = register($window.document.createElement("div"))
			m.mount(root, () => m("div"))

			o(root.childNodes.length).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
		})
	})

	o.spec("m.redraw", function() {
		o("works", function() {
			var count = 0
			root = register($window.document.createElement("div"))
			m.mount(root, () => {count++})
			o(count).equals(1)
			m.redraw()
			o(count).equals(1)
			throttleMock.fire()
			o(count).equals(2)
		})
	})

	o.spec("m.redrawSync", function() {
		o("works", function() {
			root = register($window.document.createElement("div"))
			var view = o.spy()
			m.mount(root, view)
			o(view.callCount).equals(1)
			m.redrawSync()
			o(view.callCount).equals(2)
		})
	})

	o.spec("m.route", function() {
		o("works", async() => {
			root = register($window.document.createElement("div"))
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

			await Promise.resolve()
			throttleMock.fire()
			o(throttleMock.queueLength()).equals(0)

			o(root.childNodes.length).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(m.route.get()).equals("/a")

			m.route.set("/b")

			await Promise.resolve()
			throttleMock.fire()
			o(throttleMock.queueLength()).equals(0)

			o(m.route.get()).equals("/b")
		})
	})
})
