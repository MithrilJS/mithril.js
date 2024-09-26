"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/hyperscript").fragment

o.spec("createNodes", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("creates nodes", function() {
		var vnodes = [
			m("a"),
			"b",
			fragment("c"),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(3)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
	})
	o("ignores null", function() {
		var vnodes = [
			m("a"),
			"b",
			null,
			fragment("c"),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(3)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
	})
	o("ignores undefined", function() {
		var vnodes = [
			m("a"),
			"b",
			undefined,
			fragment("c"),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(3)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
	})
})
