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
		o(node.s).equals("a")
	})
	o("normalizes falsy string into text node", function() {
		var node = m.normalize("")

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.s).equals("")
	})
	o("normalizes number into text node", function() {
		var node = m.normalize(1)

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.s).equals("1")
	})
	o("normalizes falsy number into text node", function() {
		var node = m.normalize(0)

		o(node.m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o(node.s).equals("0")
	})
	o("normalizes `true` to `null`", function() {
		var node = m.normalize(true)

		o(node).equals(null)
	})
	o("normalizes `false` to `null`", function() {
		var node = m.normalize(false)

		o(node).equals(null)
	})
})
