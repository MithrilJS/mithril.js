"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("properties", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("adds non primitives as properties", function() {
		var vnode = {tag: "div", attrs: {
			array: [1, 2, 3],
			object: {a: 1, b: 2, c: 3},
			symbol: Symbol(42),
			function: function() { }
		}}
		render(root, [vnode])

		o(typeof vnode.dom.array).equals("object")
		o(typeof vnode.dom.object).equals("object")
		o(typeof vnode.dom.symbol).equals("symbol")
		o(typeof vnode.dom.function).equals("function")
	})
})
