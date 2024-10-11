import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("createFragment", function() {
	var G = setupGlobals()

	o("creates fragment", function() {
		var vnode = m.normalize([m("a")])
		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(G.root.childNodes[0].nodeName).equals("A")
	})
	o("handles empty fragment", function() {
		var vnode = m.normalize([])
		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(0)
	})
	o("handles childless fragment", function() {
		var vnode = m.normalize([])
		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(0)
	})
	o("handles multiple children", function() {
		var vnode = m.normalize([m("a"), m("b")])
		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(2)
		o(G.root.childNodes[0].nodeName).equals("A")
		o(G.root.childNodes[1].nodeName).equals("B")
		o(vnode.c[0].d).equals(G.root.childNodes[0])
	})
	o("handles td", function() {
		var vnode = m.normalize([m("td")])
		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(G.root.childNodes[0].nodeName).equals("TD")
		o(vnode.c[0].d).equals(G.root.childNodes[0])
	})
})
