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
		var vnodes = []

		root.appendChild($window.document.createElement("div"));

		render(root, vnodes)

		o(root.childNodes.length).equals(0)
	})
	
	o("throws on invalid root node", function() {
		var threw = false
		try {
			render(null, [])
		} catch (e) {
			threw = true
		}
		o(threw).equals(true)
	})
	
	o("does not enter infinite loop when oninit triggers render and view throws", function(done) {
		var A = {
			oninit: init,
			view: function() {throw new Error("error")}
		}
		function run() {
			render(root, {tag: A})
		}
		function init() {
			setTimeout(function() {
				var threwInner = false
				try {run()} catch (e) {threwInner = true}
				
				o(threwInner).equals(false)
				done()
			}, 0)
		}
		
		var threwOuter = false
		try {run()} catch (e) {threwOuter = true}
		
		o(threwOuter).equals(true)
	})
})
