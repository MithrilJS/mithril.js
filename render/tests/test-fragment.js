"use strict"

var o = require("../../ospec/ospec")
var fragment = require("../../render/fragment")

o.spec("fragment", function() {
	o("works", function() {
		var attrs = {foo: 5}
		var child = {tag: "p"}
		var frag = fragment(attrs, [child])

		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(1)
		o(frag.children[0]).equals(child)

		o(frag.attrs).equals(attrs)

		o(frag.key).equals(undefined)
	})
	o("supports keys", function() {
		var attrs = {key: 7}
		var frag = fragment(attrs, [])
		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(0)

		o(frag.attrs).equals(attrs)
		o(frag.attrs.key).equals(7)

		o(frag.key).equals(7)
	})
})
