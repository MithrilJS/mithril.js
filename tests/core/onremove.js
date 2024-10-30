import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("layout remove", function() {
	var G = setupGlobals()

	o("does not abort layout signal when creating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", m.remove(create))
		var updated = m("div", m.remove(update))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(create.callCount).equals(0)
	})
	o("does not abort layout signal when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", m.remove(create))
		var updated = m("div", m.remove(update))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("aborts layout signal when removing element", function() {
		var remove = o.spy()
		var vnode = m("div", m.remove(remove))

		m.render(G.root, vnode)
		m.render(G.root, [])

		o(remove.callCount).equals(1)
	})
	o("aborts layout signal when removing fragment", function() {
		var remove = o.spy()
		var vnode = [m.remove(remove)]

		m.render(G.root, vnode)
		m.render(G.root, [])

		o(remove.callCount).equals(1)
	})
	o("aborts layout signal on keyed nodes", function() {
		var remove = o.spy()
		var vnode = m("div")
		var temp = m("div", m.remove(remove))
		var updated = m("div")

		m.render(G.root, m.keyed([[1, vnode]]))
		m.render(G.root, m.keyed([[2, temp]]))
		m.render(G.root, m.keyed([[1, updated]]))

		o(vnode.d).notEquals(updated.d) // this used to be a recycling pool test
		o(remove.callCount).equals(1)
	})
	o("aborts layout signal on nested component", function() {
		var spy = o.spy()
		var comp = () => m(outer)
		var outer = () => m(inner)
		var inner = () => m.layout(spy)
		m.render(G.root, m(comp))
		m.render(G.root, null)

		o(spy.callCount).equals(1)
	})
	o("aborts layout signal on nested component child", function() {
		var spy = o.spy()
		var comp = () => m(outer)
		var outer = () => m(inner, m("a", m.remove(spy)))
		var inner = (attrs) => m("div", attrs.children)
		m.render(G.root, m(comp))
		m.render(G.root, null)

		o(spy.callCount).equals(1)
	})
})
