import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("component children", function () {
	var G = setupGlobals()

	o("are not normalized on ingestion", function () {
		var component = (attrs) => attrs.children
		var vnode = m(component, "a")
		m.render(G.root, vnode)
		o(vnode.a.children[0]).equals("a")
	})

	o("are normalized upon view interpolation", function () {
		var component = (attrs) => attrs.children
		var vnode = m(component, "a")
		m.render(G.root, vnode)
		o(vnode.c.c.length).equals(1)
		// eslint-disable-next-line no-bitwise
		o(vnode.c.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(vnode.c.c[0].a).equals("a")
	})
})
