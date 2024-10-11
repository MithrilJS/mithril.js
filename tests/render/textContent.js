import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("textContent", function() {
	var G = setupGlobals()

	o("ignores null", function() {
		var vnode = m("a", null)

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("ignores undefined", function() {
		var vnode = m("a", undefined)

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("creates string", function() {
		var vnode = m("a", "a")

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("a")
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("creates falsy string", function() {
		var vnode = m("a", "")

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("")
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("creates number", function() {
		var vnode = m("a", 1)

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("1")
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("creates falsy number", function() {
		var vnode = m("a", 0)

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("0")
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("creates boolean", function() {
		var vnode = m("a", true)

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("creates falsy boolean", function() {
		var vnode = m("a", false)

		m.render(G.root, vnode)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(vnode.d).equals(G.root.childNodes[0])
	})
	o("updates to string", function() {
		var vnode = m("a", "a")
		var updated = m("a", "b")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("b")
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates to falsy string", function() {
		var vnode = m("a", "a")
		var updated = m("a", "")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("")
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates to number", function() {
		var vnode = m("a", "a")
		var updated = m("a", 1)

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("1")
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates to falsy number", function() {
		var vnode = m("a", "a")
		var updated = m("a", 0)

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("0")
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates true to nothing", function() {
		var vnode = m("a", "a")
		var updated = m("a", true)

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates false to nothing", function() {
		var vnode = m("a", "a")
		var updated = m("a", false)

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates with typecasting", function() {
		var vnode = m("a", "1")
		var updated = m("a", 1)

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("1")
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates from without text to with text", function() {
		var vnode = m("a")
		var updated = m("a", "b")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(1)
		o(vnode.d.childNodes[0].nodeValue).equals("b")
		o(updated.d).equals(G.root.childNodes[0])
	})
	o("updates from with text to without text", function() {
		var vnode = m("a", "a")
		var updated = m("a")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
		o(vnode.d.childNodes.length).equals(0)
		o(updated.d).equals(G.root.childNodes[0])
	})
})
