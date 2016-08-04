"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("updateText", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("updates to string", function() {
		var vnode = m("#", "a")
		var updated = m("#", "b")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("b")
	})
	o("updates to falsy string", function() {
		var vnode = m("#", "a")
		var updated = m("#", "")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("")
	})
	o("updates from falsy string", function() {
		var vnode = m("#", "")
		var updated = m("#", "b")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("b")
	})
	o("updates to number", function() {
		var vnode = m("#", "a")
		var updated = m("#", 1)

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("1")
	})
	o("updates to falsy number", function() {
		var vnode = m("#", "a")
		var updated = m("#", 0)

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("0")
	})
	o("updates from falsy number", function() {
		var vnode = m("#", 0)
		var updated = m("#", "b")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("b")
	})
	o("updates to boolean", function() {
		var vnode = m("#", "a")
		var updated = m("#", true)

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("true")
	})
	o("updates to falsy boolean", function() {
		var vnode = m("#", "a")
		var updated = m("#", false)

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("false")
	})
	o("updates from falsy boolean", function() {
		var vnode = m("#", false)
		var updated = m("#", "b")

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeValue).equals("b")
	})
})
