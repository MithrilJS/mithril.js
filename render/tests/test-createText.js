"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("createText", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("creates string", function() {
		var vnode = "a"
		render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("a")
	})
	o("creates falsy string", function() {
		var vnode = ""
		render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("")
	})
	o("creates number", function() {
		var vnode = 1
		render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("1")
	})
	o("creates falsy number", function() {
		var vnode = 0
		render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("0")
	})
	o("ignores true boolean", function() {
		var vnode = true
		render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("creates false boolean", function() {
		var vnode = false
		render(root, vnode)

		o(root.childNodes.length).equals(0)
	})
	o("creates spaces", function() {
		var vnode = "   "
		render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("   ")
	})
	o("ignores html", function() {
		var vnode = "<a></a>&trade;"
		render(root, vnode)

		o(root.firstChild.nodeName).equals("#text")
		o(root.firstChild.nodeValue).equals("<a></a>&trade;")
	})
})
