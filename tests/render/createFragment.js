import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("createFragment", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("creates fragment", function() {
		var vnode = m.normalize([m("a")])
		m.render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeName).equals("A")
	})
	o("handles empty fragment", function() {
		var vnode = m.normalize([])
		m.render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("handles childless fragment", function() {
		var vnode = m.normalize([])
		m.render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("handles multiple children", function() {
		var vnode = m.normalize([m("a"), m("b")])
		m.render(root, vnode)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
		o(vnode.children[0].dom).equals(root.childNodes[0])
	})
	o("handles td", function() {
		var vnode = m.normalize([m("td")])
		m.render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeName).equals("TD")
		o(vnode.children[0].dom).equals(root.childNodes[0])
	})
})
