import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("updateText", function() {
	var G = setupGlobals()

	o("updates to string", function() {
		var vnode = "a"
		var updated = "b"

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("b")
	})
	o("updates to falsy string", function() {
		var vnode = "a"
		var updated = ""

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("")
	})
	o("updates from falsy string", function() {
		var vnode = ""
		var updated = "b"

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("b")
	})
	o("updates to number", function() {
		var vnode = "a"
		var updated = 1

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("1")
	})
	o("updates to falsy number", function() {
		var vnode = "a"
		var updated = 0

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("0")
	})
	o("updates from falsy number", function() {
		var vnode = 0
		var updated = "b"

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("b")
	})
	o("updates to boolean", function() {
		var vnode = "a"
		var updated = true

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(0)
	})
	o("updates to falsy boolean", function() {
		var vnode = "a"
		var updated = false

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(0)
	})
	o("updates from falsy boolean", function() {
		var vnode = false
		var updated = "b"

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("b")
	})
})
