import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("layout create", function() {
	var G = setupGlobals()

	o("works when rendered directly", function() {
		var callback = o.spy()
		var vnode = m.layout(callback)

		m.render(G.root, vnode)

		o(callback.callCount).equals(1)
		o(callback.args[0]).equals(G.root)
		o(callback.args[1].aborted).equals(false)
	})
	o("works when creating element", function() {
		var callback = o.spy()
		var vnode = m("div", m.layout(callback))

		m.render(G.root, vnode)

		o(callback.callCount).equals(1)
		o(callback.args[1].aborted).equals(false)
	})
	o("works when creating fragment", function() {
		var callback = o.spy()
		var vnode = [m.layout(callback)]

		m.render(G.root, vnode)

		o(callback.callCount).equals(1)
		o(callback.args[1].aborted).equals(false)
	})
	o("works when replacing same-keyed", function() {
		var createDiv = o.spy()
		var createA = o.spy()
		var vnode = m("div", m.layout(createDiv))
		var updated = m("a", m.layout(createA))

		m.render(G.root, m.key(1, vnode))
		m.render(G.root, m.key(1, updated))

		o(createDiv.callCount).equals(1)
		o(createDiv.args[1].aborted).equals(true)
		o(createA.callCount).equals(1)
		o(createA.args[1].aborted).equals(false)
	})
	o("works when creating other children", function() {
		var create = o.spy()
		var vnode = m("div", m.layout(create), m("a"))

		m.render(G.root, vnode)

		o(create.callCount).equals(1)
		o(create.args[0]).equals(G.root.firstChild)
		o(create.args[1].aborted).equals(false)
	})
	o("works inside keyed", function() {
		var create = o.spy()
		var vnode = m("div", m.layout(create))
		var otherVnode = m("a")

		m.render(G.root, [m.key(1, vnode), m.key(2, otherVnode)])

		o(create.callCount).equals(1)
		o(create.args[0]).equals(G.root.firstChild)
		o(create.args[1].aborted).equals(false)
	})
	o("does not invoke callback when removing, but aborts the provided signal", function() {
		var create = o.spy()
		var vnode = m("div", m.layout(create))

		m.render(G.root, vnode)

		o(create.callCount).equals(1)
		o(create.args[1].aborted).equals(false)

		m.render(G.root, [])

		o(create.callCount).equals(1)
		o(create.args[1].aborted).equals(true)
	})
	o("works at the same step as layout update", function() {
		var create = o.spy()
		var update = o.spy()
		var callback = o.spy()
		var vnode = m("div", m.layout(create))
		var updated = m("div", m.layout(null, update), m("a", m.layout(callback)))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(create.callCount).equals(1)
		o(create.args[0]).equals(G.root.firstChild)
		o(create.args[1].aborted).equals(false)

		o(update.callCount).equals(1)
		o(update.args[0]).equals(G.root.firstChild)
		o(update.args[1].aborted).equals(false)

		o(callback.callCount).equals(1)
		o(callback.args[0]).equals(G.root.firstChild.firstChild)
		o(callback.args[1].aborted).equals(false)
	})
	o("works on unkeyed that falls into reverse list diff code path", function() {
		var create = o.spy()
		m.render(G.root, [m.key(1, m("p")), m.key(2, m("div"))])
		m.render(G.root, [m.key(2, m("div", m.layout(create))), m.key(1, m("p"))])

		o(create.callCount).equals(1)
		o(create.args[0]).equals(G.root.firstChild)
		o(create.args[1].aborted).equals(false)
	})
	o("works on unkeyed that falls into forward list diff code path", function() {
		var create = o.spy()
		m.render(G.root, [m("div"), m("p")])
		m.render(G.root, [m("div"), m("div", m.layout(create))])

		o(create.callCount).equals(1)
		o(create.args[0]).equals(G.root.childNodes[1])
		o(create.args[1].aborted).equals(false)
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
