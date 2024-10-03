"use strict"

var o = require("ospec")
var m = require("../../render/hyperscript")

o.spec("normalizeChildren", function() {
	o("normalizes arrays into fragments", function() {
		var children = m.normalizeChildren([[]])

		o(children[0].tag).equals("[")
		o(children[0].children.length).equals(0)
	})
	o("normalizes strings into text nodes", function() {
		var children = m.normalizeChildren(["a"])

		o(children[0].tag).equals("#")
		o(children[0].children).equals("a")
	})
	o("normalizes `false` values into `null`s", function() {
		var children = m.normalizeChildren([false])

		o(children[0]).equals(null)
	})
	o("allows all keys", function() {
		var children = m.normalizeChildren([
			m.key(1),
			m.key(2),
		])

		o(children).deepEquals([m.key(1), m.key(2)])
	})
	o("allows no keys", function() {
		var children = m.normalizeChildren([
			m("foo1"),
			m("foo2"),
		])

		o(children).deepEquals([m("foo1"), m("foo2")])
	})
	o("disallows mixed keys, starting with key", function() {
		o(function() {
			m.normalizeChildren([
				m.key(1),
				m("foo2"),
			])
		}).throws(TypeError)
	})
	o("disallows mixed keys, starting with no key", function() {
		o(function() {
			m.normalizeChildren([
				m("foo1"),
				m.key(2),
			])
		}).throws(TypeError)
	})
})
