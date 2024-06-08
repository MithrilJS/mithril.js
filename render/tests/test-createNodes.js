"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")
var trust = require("../../render/trust")

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
			trust("c"),
			fragment("d"),
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
			"b",
			null,
			trust("c"),
			fragment("d"),
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
			"b",
			undefined,
			trust("c"),
			fragment("d"),
		]
		render(root, vnodes)

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeValue).equals("b")
		o(root.childNodes[2].nodeValue).equals("c")
		o(root.childNodes[3].nodeValue).equals("d")
	})
})
