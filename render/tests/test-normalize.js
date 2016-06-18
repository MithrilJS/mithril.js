"use strict"

var o = require("../../ospec/ospec")
var Node = require("../../render/node")

o.spec("normalize", function() {
	o("normalizes array into fragment", function() {
		var node = Node.normalize([])

		o(node.tag).equals("[")
		o(node.children.length).equals(0)
	})
	o("normalizes nested array into fragment", function() {
		var node = Node.normalize([[]])

		o(node.tag).equals("[")
		o(node.children.length).equals(1)
		o(node.children[0].tag).equals("[")
		o(node.children[0].children.length).equals(0)
	})
	o("normalizes string into text node", function() {
		var node = Node.normalize("a")

		o(node.tag).equals("#")
		o(node.children).equals("a")
	})
	o("normalizes falsy string into text node", function() {
		var node = Node.normalize("")

		o(node.tag).equals("#")
		o(node.children).equals("")
	})
	o("normalizes number into text node", function() {
		var node = Node.normalize(1)

		o(node.tag).equals("#")
		o(node.children).equals(1)
	})
	o("normalizes falsy number into text node", function() {
		var node = Node.normalize(0)

		o(node.tag).equals("#")
		o(node.children).equals(0)
	})
	o("normalizes boolean into text node", function() {
		var node = Node.normalize(true)

		o(node.tag).equals("#")
		o(node.children).equals(true)
	})
	o("normalizes falsy boolean into text node", function() {
		var node = Node.normalize(false)

		o(node.tag).equals("#")
		o(node.children).equals(false)
	})
})
