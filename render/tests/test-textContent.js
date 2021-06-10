"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("textContent", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("ignores null", function() {
		var vnode = m("a", null)

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("ignores undefined", function() {
		var vnode = m("a", undefined)

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("creates string", function() {
		var vnode = m("a", "a")

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("a")
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("creates falsy string", function() {
		var vnode = m("a", "")

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("")
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("creates number", function() {
		var vnode = m("a", 1)

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("1")
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("creates falsy number", function() {
		var vnode = m("a", 0)

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("0")
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("creates boolean", function() {
		var vnode = m("a", true)

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("creates falsy boolean", function() {
		var vnode = m("a", false)

		render(root, vnode)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(vnode.dom).equals(root.childNodes[0])
	})
	o("updates to string", function() {
		var vnode = m("a", "a")
		var updated = m("a", "b")

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("b")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates to falsy string", function() {
		var vnode = m("a", "a")
		var updated = m("a", "")

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates to number", function() {
		var vnode = m("a", "a")
		var updated = m("a", 1)

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("1")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates to falsy number", function() {
		var vnode = m("a", "a")
		var updated = m("a", 0)

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("0")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates true to nothing", function() {
		var vnode = m("a", "a")
		var updated = m("a", true)

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates false to nothing", function() {
		var vnode = m("a", "a")
		var updated = m("a", false)

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates with typecasting", function() {
		var vnode = m("a", "1")
		var updated = m("a", 1)

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("1")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates from without text to with text", function() {
		var vnode = m("a")
		var updated = m("a", "b")

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(1)
		o(vnode.dom.childNodes[0].nodeValue).equals("b")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("updates from with text to without text", function() {
		var vnode = m("a", "a")
		var updated = m("a")

		render(root, vnode)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnode.dom.childNodes.length).equals(0)
		o(updated.dom).equals(root.childNodes[0])
	})
})
