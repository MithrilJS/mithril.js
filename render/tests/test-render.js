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
	o("lifecycle methods work in children of recycled", function() {
		var createA = o.spy()
		var updateA = o.spy()
		var removeA = o.spy()
		var createB = o.spy()
		var updateB = o.spy()
		var removeB = o.spy()
		var a = function() {
			return {tag: "div", key: 1, children: [
				{tag: "div", key: 11, attrs: {oncreate: createA, onupdate: updateA, onremove: removeA}},
				{tag: "div", key: 12}
			]}
		}
		var b = function() {
			return {tag: "div", key: 2, children: [
				{tag: "div", key: 21, attrs: {oncreate: createB, onupdate: updateB, onremove: removeB}},
				{tag: "div", key: 22}
			]}
		}
		render(root, a())
		render(root, b())
		render(root, a())

		o(createA.callCount).equals(2)
		o(updateA.callCount).equals(0)
		o(removeA.callCount).equals(1)
		o(createB.callCount).equals(1)
		o(updateB.callCount).equals(0)
		o(removeB.callCount).equals(1)
	})
})
