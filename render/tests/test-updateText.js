"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("updateText", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("updates to string", function() {
		var vnode = "a"
		var updated = "b"

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("b")
	})
	o("updates to falsy string", function() {
		var vnode = "a"
		var updated = ""

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("")
	})
	o("updates from falsy string", function() {
		var vnode = ""
		var updated = "b"

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("b")
	})
	o("updates to number", function() {
		var vnode = "a"
		var updated = 1

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("1")
	})
	o("updates to falsy number", function() {
		var vnode = "a"
		var updated = 0

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("0")
	})
	o("updates from falsy number", function() {
		var vnode = 0
		var updated = "b"

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("b")
	})
	o("updates to boolean", function() {
		var vnode = "a"
		var updated = true

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(0)
	})
	o("updates to falsy boolean", function() {
		var vnode = "a"
		var updated = false

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(0)
	})
	o("updates from falsy boolean", function() {
		var vnode = false
		var updated = "b"

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("b")
	})
})
