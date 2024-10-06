import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("normalize", function() {
	o("normalizes array into fragment", function() {
		var node = m.normalize([])

		o(node.tag).equals(Symbol.for("m.Fragment"))
		o(node.children.length).equals(0)
	})
	o("normalizes nested array into fragment", function() {
		var node = m.normalize([[]])

		o(node.tag).equals(Symbol.for("m.Fragment"))
		o(node.children.length).equals(1)
		o(node.children[0].tag).equals(Symbol.for("m.Fragment"))
		o(node.children[0].children.length).equals(0)
	})
	o("normalizes string into text node", function() {
		var node = m.normalize("a")

		o(node.tag).equals(Symbol.for("m.text"))
		o(node.state).equals("a")
	})
	o("normalizes falsy string into text node", function() {
		var node = m.normalize("")

		o(node.tag).equals(Symbol.for("m.text"))
		o(node.state).equals("")
	})
	o("normalizes number into text node", function() {
		var node = m.normalize(1)

		o(node.tag).equals(Symbol.for("m.text"))
		o(node.state).equals("1")
	})
	o("normalizes falsy number into text node", function() {
		var node = m.normalize(0)

		o(node.tag).equals(Symbol.for("m.text"))
		o(node.state).equals("0")
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
