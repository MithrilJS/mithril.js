"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("createFragment", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("creates fragment", function() {
		var vnode = m("[", [m("a")])
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("A")
	})
	o("handles empty fragment", function() {
		var vnode = m("[", [])
		render(root, [vnode])

		o(vnode.dom).equals(null)
		o(vnode.domSize).equals(0)
	})
	o("handles childless fragment", function() {
		var vnode = m("[")
		render(root, [vnode])

		o(vnode.dom).equals(null)
		o(vnode.domSize).equals(0)
	})
	o("handles multiple children", function() {
		var vnode = m("[", [m("a"), m("b")])
		render(root, [vnode])

		o(vnode.domSize).equals(2)
		o(vnode.dom.nodeName).equals("A")
		o(vnode.dom.nextSibling.nodeName).equals("B")
	})
	o("handles td", function() {
		var vnode = m("[", [m("td")])
		render(root, [vnode])

		o(vnode.dom).notEquals(null)
		o(vnode.dom.nodeName).equals("TD")
	})
})
