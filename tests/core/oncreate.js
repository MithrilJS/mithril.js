import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("layout create", function() {
	var G = setupGlobals()

	o.spec("m.layout", () => {
		o("works when rendered directly", function() {
			var layoutSpy = o.spy()
			var vnode = m.layout(layoutSpy)

			m.render(G.root, vnode)

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[0]).equals(G.root)
		})
		o("works when creating element", function() {
			var layoutSpy = o.spy()
			var vnode = m("div", m.layout(layoutSpy))

			m.render(G.root, vnode)

			o(layoutSpy.callCount).equals(1)
		})
		o("works when creating fragment", function() {
			var layoutSpy = o.spy()
			var vnode = [m.layout(layoutSpy)]

			m.render(G.root, vnode)

			o(layoutSpy.callCount).equals(1)
		})
		o("works when replacing same-keyed", function() {
			var createDiv = o.spy()
			var createA = o.spy()
			var vnode = m("div", m.layout(createDiv))
			var updated = m("a", m.layout(createA))

			m.render(G.root, m.key(1, vnode))
			m.render(G.root, m.key(1, updated))

			o(createDiv.callCount).equals(1)
			o(createA.callCount).equals(1)
		})
		o("works when creating other children", function() {
			var create = o.spy()
			var vnode = m("div", m.layout(create), m("a"))

			m.render(G.root, vnode)

			o(create.callCount).equals(1)
			o(create.args[0]).equals(G.root.firstChild)
		})
		o("works inside keyed", function() {
			var create = o.spy()
			var vnode = m("div", m.layout(create))
			var otherVnode = m("a")

			m.render(G.root, [m.key(1, vnode), m.key(2, otherVnode)])

			o(create.callCount).equals(1)
			o(create.args[0]).equals(G.root.firstChild)
		})
		o("does not invoke callback when removing, but aborts the provided signal", function() {
			var create = o.spy()
			var vnode = m("div", m.layout(create))

			m.render(G.root, vnode)

			o(create.callCount).equals(1)

			m.render(G.root, [])

			o(create.callCount).equals(1)
		})
		o("works at the same step as layout update", function() {
			var create = o.spy()
			var update = o.spy()
			var layoutSpy = o.spy()
			var vnode = m("div", m.layout(create))
			var updated = m("div", m.layout(update), m("a", m.layout(layoutSpy)))

			m.render(G.root, vnode)
			m.render(G.root, updated)

			o(create.callCount).equals(1)
			o(create.args[0]).equals(G.root.firstChild)

			o(update.callCount).equals(1)
			o(update.args[0]).equals(G.root.firstChild)

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[0]).equals(G.root.firstChild.firstChild)
		})
		o("works on unkeyed that falls into reverse list diff code path", function() {
			var create = o.spy()
			m.render(G.root, [m.key(1, m("p")), m.key(2, m("div"))])
			m.render(G.root, [m.key(2, m("div", m.layout(create))), m.key(1, m("p"))])

			o(create.callCount).equals(1)
			o(create.args[0]).equals(G.root.firstChild)
		})
		o("works on unkeyed that falls into forward list diff code path", function() {
			var create = o.spy()
			m.render(G.root, [m("div"), m("p")])
			m.render(G.root, [m("div"), m("div", m.layout(create))])

			o(create.callCount).equals(1)
			o(create.args[0]).equals(G.root.childNodes[1])
		})
		o("works after full DOM creation", function() {
			var created = false
			var vnode = m("div", m("a", m.layout(create), m("b")))

			m.render(G.root, vnode)

			function create(dom) {
				created = true

				o(dom.parentNode).equals(G.root.firstChild)
				o(dom.childNodes.length).equals(1)
			}
			o(created).equals(true)
		})
	})

	o.spec("m.remove", () => {
		o("works when rendered directly", function() {
			var removeSpy = o.spy()
			var vnode = m.remove(removeSpy)

			m.render(G.root, vnode)

			o(removeSpy.callCount).equals(0)
		})
		o("works when creating element", function() {
			var removeSpy = o.spy()
			var vnode = m("div", m.remove(removeSpy))

			m.render(G.root, vnode)

			o(removeSpy.callCount).equals(0)
		})
		o("works when creating fragment", function() {
			var removeSpy = o.spy()
			var vnode = [m.remove(removeSpy)]

			m.render(G.root, vnode)

			o(removeSpy.callCount).equals(0)
		})
		o("works when replacing same-keyed", function() {
			var createDiv = o.spy()
			var createA = o.spy()
			var vnode = m("div", m.remove(createDiv))
			var updated = m("a", m.remove(createA))

			m.render(G.root, m.key(1, vnode))
			var dom = vnode.d
			m.render(G.root, m.key(1, updated))

			o(createDiv.callCount).equals(1)
			o(createDiv.args[0]).equals(dom)
			o(createA.callCount).equals(0)
		})
		o("works when creating other children", function() {
			var create = o.spy()
			var vnode = m("div", m.remove(create), m("a"))

			m.render(G.root, vnode)

			o(create.callCount).equals(0)
		})
		o("works inside keyed", function() {
			var create = o.spy()
			var vnode = m("div", m.remove(create))
			var otherVnode = m("a")

			m.render(G.root, [m.key(1, vnode), m.key(2, otherVnode)])

			o(create.callCount).equals(0)
		})
		o("does not invoke callback when removing, but aborts the provided signal", function() {
			var create = o.spy()
			var vnode = m("div", m.remove(create))

			m.render(G.root, vnode)

			o(create.callCount).equals(0)

			m.render(G.root, [])

			o(create.callCount).equals(1)
		})
		o("works at the same step as layout update", function() {
			var create = o.spy()
			var update = o.spy()
			var removeSpy = o.spy()
			var vnode = m("div", m.remove(create))
			var updated = m("div", m.remove(update), m("a", m.remove(removeSpy)))

			m.render(G.root, vnode)
			m.render(G.root, updated)

			o(create.callCount).equals(0)

			o(update.callCount).equals(0)

			o(removeSpy.callCount).equals(0)
		})
		o("works on unkeyed that falls into reverse list diff code path", function() {
			var create = o.spy()
			m.render(G.root, [m.key(1, m("p")), m.key(2, m("div"))])
			m.render(G.root, [m.key(2, m("div", m.remove(create))), m.key(1, m("p"))])

			o(create.callCount).equals(0)
		})
		o("works on unkeyed that falls into forward list diff code path", function() {
			var create = o.spy()
			m.render(G.root, [m("div"), m("p")])
			m.render(G.root, [m("div"), m("div", m.remove(create))])

			o(create.callCount).equals(0)
		})
		o("works after full DOM creation", function() {
			var created = false
			var vnode = m("div", m("a", m.remove(() => created = true), m("b")))

			m.render(G.root, vnode)
			o(created).equals(false)
		})
	})
})
