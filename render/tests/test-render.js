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

	o("does not enter infinite loop when oninit triggers render and view throws with an object literal component", function(done) {
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
	o("does not try to re-initialize a constructibe component whose view has thrown", function() {
		var oninit = o.spy()
		var onbeforeupdate = o.spy()
		function A(){}
		A.prototype.view = function() {throw new Error("error")}
		A.prototype.oninit = oninit
		A.prototype.onbeforeupdate = onbeforeupdate
		var throwCount = 0

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)
	})
	o("does not try to re-initialize a constructible component whose oninit has thrown", function() {
		var oninit = o.spy(function(){throw new Error("error")})
		var onbeforeupdate = o.spy()
		function A(){}
		A.prototype.view = function(){}
		A.prototype.oninit = oninit
		A.prototype.onbeforeupdate = onbeforeupdate
		var throwCount = 0

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)
	})
	o("does not try to re-initialize a constructible component whose constructor has thrown", function() {
		var oninit = o.spy()
		var onbeforeupdate = o.spy()
		function A(){throw new Error("error")}
		A.prototype.view = function() {}
		A.prototype.oninit = oninit
		A.prototype.onbeforeupdate = onbeforeupdate
		var throwCount = 0

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(0)
		o(onbeforeupdate.callCount).equals(0)

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(0)
		o(onbeforeupdate.callCount).equals(0)
	})
	o("does not try to re-initialize a closure component whose view has thrown", function() {
		var oninit = o.spy()
		var onbeforeupdate = o.spy()
		function A() {
			return {
				view: function() {throw new Error("error")},
				oninit: oninit,
				onbeforeupdate: onbeforeupdate
			}
		}
		var throwCount = 0
		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)
	})
	o("does not try to re-initialize a closure component whose oninit has thrown", function() {
		var oninit = o.spy(function() {throw new Error("error")})
		var onbeforeupdate = o.spy()
		function A() {
			return {
				view: function() {},
				oninit: oninit,
				onbeforeupdate: onbeforeupdate
			}
		}
		var throwCount = 0
		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(onbeforeupdate.callCount).equals(0)
	})
	o("does not try to re-initialize a closure component whose closure has thrown", function() {
		function A() {
			throw new Error("error")
		}
		var throwCount = 0
		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)

		try {render(root, {tag: A})} catch (e) {throwCount++}

		o(throwCount).equals(1)
	})
	o("lifecycle methods work in keyed children of recycled keyed", function() {
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
	o("lifecycle methods work in unkeyed children of recycled keyed", function() {
		var createA = o.spy()
		var updateA = o.spy()
		var removeA = o.spy()
		var createB = o.spy()
		var updateB = o.spy()
		var removeB = o.spy()
		var a = function() {
			return {tag: "div", key: 1, children: [
				{tag: "div", attrs: {oncreate: createA, onupdate: updateA, onremove: removeA}},
			]}
		}
		var b = function() {
			return {tag: "div", key: 2, children: [
				{tag: "div", attrs: {oncreate: createB, onupdate: updateB, onremove: removeB}},
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
	o("update lifecycle methods work on children of recycled keyed", function() {
		var createA = o.spy()
		var updateA = o.spy()
		var removeA = o.spy()
		var createB = o.spy()
		var updateB = o.spy()
		var removeB = o.spy()

		var a = function() {
			return {tag: "div", key: 1, children: [
				{tag: "div", attrs: {oncreate: createA, onupdate: updateA, onremove: removeA}},
			]}
		}
		var b = function() {
			return {tag: "div", key: 2, children: [
				{tag: "div", attrs: {oncreate: createB, onupdate: updateB, onremove: removeB}},
			]}
		}
		render(root, a())
		render(root, a())
		o(createA.callCount).equals(1)
		o(updateA.callCount).equals(1)
		o(removeA.callCount).equals(0)

		render(root, b())
		o(createA.callCount).equals(1)
		o(updateA.callCount).equals(1)
		o(removeA.callCount).equals(1)

		render(root, a())
		render(root, a())

		o(createA.callCount).equals(2)
		o(updateA.callCount).equals(2)
		o(removeA.callCount).equals(1)
	})
})
