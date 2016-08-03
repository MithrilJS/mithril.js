"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("createNodes", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("creates nodes", function() {
		var vnodes = [
			m("a"),
			m("#", "b"),
			m("<", "c"),
			m("[", [m("#", "d")]),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
		o(root.childNodes[3].nodeValue).equals("d")
	})
	o("ignores null", function() {
		var vnodes = [
			m("a"),
			m("#", "b"),
			null,
			m("<", "c"),
			m("[", [m("#", "d")]),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
		o(root.childNodes[3].nodeValue).equals("d")
	})
	o("ignores undefined", function() {
		var vnodes = [
			m("a"),
			m("#", "b"),
			undefined,
			m("<", "c"),
			m("[", [m("#", "d")]),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
		o(root.childNodes[3].nodeValue).equals("d")
	})
})
