"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("input", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
		render = vdom($window).render
	})

	o("maintains focus after move", function() {
		var input = {tag: "input", key: 1}
		var a = {tag: "a", key: 2}
		var b = {tag: "b", key: 3}
		
		render(root, [input, a, b])
		input.dom.focus()
		render(root, [a, input, b])
		
		o($window.document.activeElement).equals(input.dom)
	})
})