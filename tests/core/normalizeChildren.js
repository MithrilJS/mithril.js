/* eslint-disable no-bitwise */
import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("normalizeChildren", function() {
	o("normalizes arrays into fragments", function() {
		var vnode = m.normalize([[]])

		o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o(vnode.c[0].c.length).equals(0)
	})
	o("normalizes strings into text nodes", function() {
		var vnode = m.normalize(["a"])

		o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(vnode.c[0].s).equals("a")
	})
	o("normalizes `false` values into `null`s", function() {
		var vnode = m.normalize([false])

		o(vnode.c[0]).equals(null)
	})
	o("allows all keys", function() {
		var vnode = m.normalize([
			m.key(1),
			m.key(2),
		])

		o(vnode.c).deepEquals([m.key(1), m.key(2)])
	})
	o("allows no keys", function() {
		var vnode = m.normalize([
			m("foo1"),
			m("foo2"),
		])

		o(vnode.c).deepEquals([m("foo1"), m("foo2")])
	})
	o("disallows mixed keys, starting with key", function() {
		o(() => m.normalize([
			m.key(1),
			m("foo2"),
		])).throws(TypeError)
	})
	o("disallows mixed keys, starting with no key", function() {
		o(() => m.normalize([
			m("foo1"),
			m.key(2),
		])).throws(TypeError)
	})
})
