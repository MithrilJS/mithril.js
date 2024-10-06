import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("normalizeChildren", function() {
	o("normalizes arrays into fragments", function() {
		var {children} = m.normalize([[]])

		o(children[0].tag).equals(Symbol.for("m.Fragment"))
		o(children[0].children.length).equals(0)
	})
	o("normalizes strings into text nodes", function() {
		var {children} = m.normalize(["a"])

		o(children[0].tag).equals(Symbol.for("m.text"))
		o(children[0].state).equals("a")
	})
	o("normalizes `false` values into `null`s", function() {
		var {children} = m.normalize([false])

		o(children[0]).equals(null)
	})
	o("allows all keys", function() {
		var {children} = m.normalize([
			m.key(1),
			m.key(2),
		])

		o(children).deepEquals([m.key(1), m.key(2)])
	})
	o("allows no keys", function() {
		var {children} = m.normalize([
			m("foo1"),
			m("foo2"),
		])

		o(children).deepEquals([m("foo1"), m("foo2")])
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
