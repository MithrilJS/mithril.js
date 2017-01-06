"use strict"

var o = require("../../ospec/ospec")
var Vnode = require("../../render/vnode")

o.spec("normalizeChildren", function() {
	o("normalizes arrays into fragments", function() {
		var children = Vnode.normalizeChildren([[]])

		o(children[0].tag).equals("[")
		o(children[0].children.length).equals(0)
	})
	o("normalizes strings into text nodes", function() {
		var children = Vnode.normalizeChildren(["a"])

		o(children[0].tag).equals("#")
		o(children[0].children).equals("a")
	})
	o("normalizes `false` values into empty string text nodes", function() {
		var children = Vnode.normalizeChildren([false])

		o(children[0].tag).equals("#")
		o(children[0].children).equals("")
	})
})
