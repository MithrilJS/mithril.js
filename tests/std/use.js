import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("m.use", () => {
	var G = setupGlobals()

	o("works with empty arrays", () => {
		var layout = o.spy()
		var remove = o.spy()

		m.render(G.root, m.use([], m.layout(layout), m.remove(remove)))
		o(layout.callCount).equals(1)
		o(remove.callCount).equals(0)

		m.render(G.root, m.use([], m.layout(layout), m.remove(remove)))
		o(layout.callCount).equals(2)
		o(remove.callCount).equals(0)

		m.render(G.root, null)
		o(layout.callCount).equals(2)
		o(remove.callCount).equals(1)
	})

	o("works with equal non-empty arrays", () => {
		var layout = o.spy()
		var remove = o.spy()

		m.render(G.root, m.use([1], m.layout(layout), m.remove(remove)))
		o(layout.callCount).equals(1)
		o(remove.callCount).equals(0)

		m.render(G.root, m.use([1], m.layout(layout), m.remove(remove)))
		o(layout.callCount).equals(2)
		o(remove.callCount).equals(0)

		m.render(G.root, null)
		o(layout.callCount).equals(2)
		o(remove.callCount).equals(1)
	})

	o("works with non-equal same-length non-empty arrays", () => {
		var remove = o.spy()
		var layout = o.spy()

		m.render(G.root, m.use([1], m.layout(layout), m.remove(remove)))
		o(layout.callCount).equals(1)
		o(remove.callCount).equals(0)

		m.render(G.root, m.use([2], m.layout(layout), m.remove(remove)))
		o(layout.callCount).equals(2)
		o(remove.callCount).equals(1)

		m.render(G.root, null)
		o(layout.callCount).equals(2)
		o(remove.callCount).equals(2)
	})
})
