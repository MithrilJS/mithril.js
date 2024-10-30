/* eslint-disable no-bitwise */
import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("normalize", function() {
	o("normalizes array into fragment", function() {
		var node = m.normalize([])

		o(node.m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o(node.c.length).equals(0)
	})
	o("normalizes nested array into fragment", function() {
		var node = m.normalize([[]])

		o(node.m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o(node.c.length).equals(1)
		o(node.c[0].m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o(node.c[0].c.length).equals(0)
	})
	o("normalizes string into text node", function() {
		var node = m.normalize("a")

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.a).equals("a")
	})
	o("normalizes falsy string into text node", function() {
		var node = m.normalize("")

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.a).equals("")
	})
	o("normalizes number into text node", function() {
		var node = m.normalize(1)

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.a).equals("1")
	})
	o("normalizes falsy number into text node", function() {
		var node = m.normalize(0)

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.a).equals("0")
	})
	o("normalizes `true` to `null`", function() {
		var node = m.normalize(true)

		o(node).equals(null)
	})
	o("normalizes `false` to `null`", function() {
		var node = m.normalize(false)

		o(node).equals(null)
	})
	o("normalizes nested arrays into nested fragments", function() {
		var vnode = m.normalize([[]])

		o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o(vnode.c[0].c.length).equals(0)
	})
	o("normalizes nested strings into nested text nodes", function() {
		var vnode = m.normalize(["a"])

		o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(vnode.c[0].a).equals("a")
	})
	o("normalizes nested `false` values into nested `null`s", function() {
		var vnode = m.normalize([false])

		o(vnode.c[0]).equals(null)
	})
	o("retains nested element vnodes in arrays", function() {
		var elem1, elem2
		var vnode = m.normalize([
			elem1 = m("foo1"),
			elem2 = m("foo2"),
		])

		o(vnode.c.length).equals(2)
		o(vnode.c[0]).equals(elem1)
		o(vnode.c[1]).equals(elem2)
	})
})
