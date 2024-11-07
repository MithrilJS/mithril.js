import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("createNodes", function() {
	var G = setupGlobals()

	o("creates nodes", function() {
		var vnodes = [
			m("a"),
			"b",
			["c"],
		]
		m.render(G.root, vnodes)

		o(G.root.childNodes.length).equals(3)
		o(G.root.childNodes[0].nodeName).equals("A")
		o(G.root.childNodes[1].nodeValue).equals("b")
		o(G.root.childNodes[2].nodeValue).equals("c")
	})
	o("ignores null", function() {
		var vnodes = [
			m("a"),
			"b",
			null,
			["c"],
		]
		m.render(G.root, vnodes)

		o(G.root.childNodes.length).equals(3)
		o(G.root.childNodes[0].nodeName).equals("A")
		o(G.root.childNodes[1].nodeValue).equals("b")
		o(G.root.childNodes[2].nodeValue).equals("c")
	})
	o("ignores undefined", function() {
		var vnodes = [
			m("a"),
			"b",
			undefined,
			["c"],
		]
		m.render(G.root, vnodes)

		o(G.root.childNodes.length).equals(3)
		o(G.root.childNodes[0].nodeName).equals("A")
		o(G.root.childNodes[1].nodeValue).equals("b")
		o(G.root.childNodes[2].nodeValue).equals("c")
	})
})
