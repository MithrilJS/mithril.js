"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("createText", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("creates string", function() {
		var vnode = m("#", "a")
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("a")
	})
	o("creates falsy string", function() {
		var vnode = m("#", "")
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("")
	})
	o("creates number", function() {
		var vnode = m("#", 1)
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("1")
	})
	o("creates falsy number", function() {
		var vnode = m("#", 0)
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("0")
	})
	o("creates boolean", function() {
		var vnode = m("#", true)
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("true")
	})
	o("creates falsy boolean", function() {
		var vnode = m("#", false)
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("false")
	})
	o("creates spaces", function() {
		var vnode = m("#", "   ")
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("   ")
	})
	o("ignores html", function() {
		var vnode = m("#", "<a></a>&trade;")
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("#text")
		o(vnode.dom.nodeValue).equals("<a></a>&trade;")
	})
})
