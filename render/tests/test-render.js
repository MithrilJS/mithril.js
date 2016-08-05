"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("render", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("overwrites existing content", function() {
		var vnodes = [{tag: "a", text: null}]

		root.appendChild($window.document.createElement("div"));

		render(root, vnodes)

		o(root.childNodes.length).equals(1)
	})
})
