import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("updateFragment", function() {
	var G = setupGlobals()

	o("updates fragment", function() {
		var vnode = [m("a")]
		var updated = [m("b")]

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated[0].d).equals(G.root.firstChild)
		o(updated[0].d.nodeName).equals("B")
	})
	o("adds els", function() {
		var vnode = []
		var updated = [m("a"), m("b")]

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated[0].d).equals(G.root.firstChild)
		o(G.root.childNodes.length).equals(2)
		o(G.root.childNodes[0].nodeName).equals("A")
		o(G.root.childNodes[1].nodeName).equals("B")
	})
	o("removes els", function() {
		var vnode = [m("a"), m("b")]
		var updated = []

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(0)
	})
	o("updates from childless fragment", function() {
		var vnode = []
		var updated = [m("a")]

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated[0].d).equals(G.root.firstChild)
		o(updated[0].d.nodeName).equals("A")
	})
	o("updates to childless fragment", function() {
		var vnode = [m("a")]
		var updated = []

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(0)
	})
})
