"use strict"

var o = require("../../ospec/ospec")
var Node = require("../../render/node")

o.spec("normalizeChildren", function() {
	o("normalizes arrays into fragments", function() {
		var children = Node.normalizeChildren([[]])

		o(children[0].tag).equals("[")
		o(children[0].children.length).equals(0)
	})
	o("normalizes strings into text nodes", function() {
		var children = Node.normalizeChildren(["a"])

		o(children[0].tag).equals("#")
		o(children[0].children).equals("a")
	})
})
