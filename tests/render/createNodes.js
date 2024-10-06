import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("createNodes", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("creates nodes", function() {
		var vnodes = [
			m("a"),
			"b",
			["c"],
		]
		m.render(root, vnodes)

		o(root.childNodes.length).equals(3)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
	})
	o("ignores null", function() {
		var vnodes = [
			m("a"),
			"b",
			null,
			["c"],
		]
		m.render(root, vnodes)

		o(root.childNodes.length).equals(3)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
	})
	o("ignores undefined", function() {
		var vnodes = [
			m("a"),
			"b",
			undefined,
			["c"],
		]
		m.render(root, vnodes)

		o(root.childNodes.length).equals(3)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
	})
})
