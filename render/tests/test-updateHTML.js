"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("updateHTML", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("updates html", function() {
		var vnode = m("<", "a")
		var updated = m("<", "b")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(root.firstChild)
		o(updated.domSize).equals(1)
		o(updated.dom.nodeValue).equals("b")
	})
	o("adds html", function() {
		var vnode = m("<", "")
		var updated = m("<", "<a></a><b></b>")

		render(root, [vnode])
		render(root, [updated])

		o(updated.domSize).equals(2)
		o(updated.dom).equals(root.firstChild)
		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("removes html", function() {
		var vnode = m("<", "<a></a><b></b>")
		var updated = m("<", "")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(null)
		o(updated.domSize).equals(0)
		o(root.childNodes.length).equals(0)
	})
})
