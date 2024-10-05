"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../src/core/render")
var m = require("../../src/core/hyperscript")

o.spec("createFragment", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("creates fragment", function() {
		var vnode = m.normalize([m("a")])
		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeName).equals("A")
	})
	o("handles empty fragment", function() {
		var vnode = m.normalize([])
		render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("handles childless fragment", function() {
		var vnode = m.normalize([])
		render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("handles multiple children", function() {
		var vnode = m.normalize([m("a"), m("b")])
		render(root, vnode)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
		o(vnode.children[0].dom).equals(root.childNodes[0])
	})
	o("handles td", function() {
		var vnode = m.normalize([m("td")])
		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeName).equals("TD")
		o(vnode.children[0].dom).equals(root.childNodes[0])
	})
})
