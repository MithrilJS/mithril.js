import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("layout update", function() {
	var G = setupGlobals()

	o("is not invoked when removing element", function() {
		var update = o.spy()
		var vnode = m("div", m.layout(update))

		m.render(G.root, vnode)
		m.render(G.root, [])

		o(update.callCount).equals(1)
	})
	o("is not updated when replacing keyed element", function() {
		var update = o.spy()
		var vnode = m.key(1, m("div", m.layout(update)))
		var updated = m.key(1, m("a", m.layout(update)))
		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(update.callCount).equals(2)
	})
	o("does not call old callback when removing layout vnode from new vnode", function() {
		var update = o.spy()

		m.render(G.root, m("a", m.layout(update)))
		m.render(G.root, m("a", m.layout(update)))
		m.render(G.root, m("a"))

		o(update.callCount).equals(2)
	})
	o("invoked on noop", function() {
		var preUpdate = o.spy()
		var update = o.spy()
		var vnode = m("div", m.layout(preUpdate))
		var updated = m("div", m.layout(update))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(preUpdate.callCount).equals(1)
		o(update.callCount).equals(1)
	})
	o("invoked on updating attr", function() {
		var preUpdate = o.spy()
		var update = o.spy()
		var vnode = m("div", m.layout(preUpdate))
		var updated = m("div", {id: "a"}, m.layout(update))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(preUpdate.callCount).equals(1)
		o(update.callCount).equals(1)
	})
	o("invoked on updating children", function() {
		var preUpdate = o.spy()
		var update = o.spy()
		var vnode = m("div", m.layout(preUpdate), m("a"))
		var updated = m("div", m.layout(update), m("b"))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(preUpdate.callCount).equals(1)
		o(update.callCount).equals(1)
	})
	o("invoked on updating fragment", function() {
		var preUpdate = o.spy()
		var update = o.spy()
		var vnode = [m.layout(preUpdate)]
		var updated = [m.layout(update)]

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(preUpdate.callCount).equals(1)
		o(update.callCount).equals(1)
	})
	o("invoked on full DOM update", function() {
		var called = false
		var vnode = m("div", {id: "1"},
			m("a", {id: "2"}, m.layout(() => {}),
				m("b", {id: "3"})
			)
		)
		var updated = m("div", {id: "11"},
			m("a", {id: "22"}, m.layout(update),
				m("b", {id: "33"})
			)
		)

		m.render(G.root, vnode)
		m.render(G.root, updated)

		function update(dom) {
			called = true

			o(dom.parentNode.attributes["id"].value).equals("11")
			o(dom.attributes["id"].value).equals("22")
			o(dom.childNodes[0].attributes["id"].value).equals("33")
		}
		o(called).equals(true)
	})
})
