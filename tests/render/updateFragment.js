import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/core/hyperscript.js"
import render from "../../src/core/render.js"

o.spec("updateFragment", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("updates fragment", function() {
		var vnode = [m("a")]
		var updated = [m("b")]

		render(root, vnode)
		render(root, updated)

		o(updated[0].dom).equals(root.firstChild)
		o(updated[0].dom.nodeName).equals("B")
	})
	o("adds els", function() {
		var vnode = []
		var updated = [m("a"), m("b")]

		render(root, vnode)
		render(root, updated)

		o(updated[0].dom).equals(root.firstChild)
		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("removes els", function() {
		var vnode = [m("a"), m("b")]
		var updated = []

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(0)
	})
	o("updates from childless fragment", function() {
		var vnode = []
		var updated = [m("a")]

		render(root, vnode)
		render(root, updated)

		o(updated[0].dom).equals(root.firstChild)
		o(updated[0].dom.nodeName).equals("A")
	})
	o("updates to childless fragment", function() {
		var vnode = [m("a")]
		var updated = []

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(0)
	})
})
