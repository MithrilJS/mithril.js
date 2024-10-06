import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("createText", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("creates string", function() {
		var vnode = "a"
		m.render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("a")
	})
	o("creates falsy string", function() {
		var vnode = ""
		m.render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("")
	})
	o("creates number", function() {
		var vnode = 1
		m.render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("1")
	})
	o("creates falsy number", function() {
		var vnode = 0
		m.render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("0")
	})
	o("ignores true boolean", function() {
		var vnode = true
		m.render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("creates false boolean", function() {
		var vnode = false
		m.render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("creates spaces", function() {
		var vnode = "   "
		m.render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("   ")
	})
	o("ignores html", function() {
		var vnode = "<a></a>&trade;"
		m.render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("<a></a>&trade;")
	})
})
