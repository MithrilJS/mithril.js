"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("render", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("renders plain text", function() {
		render(root, "a")
		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeValue).equals("a")
	})

	o("updates plain text", function() {
		render(root, "a")
		render(root, "b")
		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeValue).equals("b")
	})

	o("renders a number", function() {
		render(root, 1)
		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeValue).equals("1")
	})

	o("updates a number", function() {
		render(root, 1)
		render(root, 2)
		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeValue).equals("2")
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

	o("does not try to re-initialize a constructible component whose view has thrown", function() {
		var oninit = o.spy()
		var view = o.spy(() => { throw new Error("error") })
		function A(){}
		A.prototype.view = view
		A.prototype.oninit = oninit
		var throwCount = 0

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(1)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(1)
	})
	o("does not try to re-initialize a constructible component whose oninit has thrown", function() {
		var oninit = o.spy(function(){throw new Error("error")})
		var view = o.spy()
		function A(){}
		A.prototype.view = view
		A.prototype.oninit = oninit
		var throwCount = 0

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(0)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(0)
	})
	o("does not try to re-initialize a constructible component whose constructor has thrown", function() {
		var oninit = o.spy()
		var view = o.spy()
		function A(){throw new Error("error")}
		A.prototype.view = view
		A.prototype.oninit = oninit
		var throwCount = 0

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(0)
		o(view.callCount).equals(0)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(0)
		o(view.callCount).equals(0)
	})
	o("does not try to re-initialize a closure component whose view has thrown", function() {
		var oninit = o.spy()
		var view = o.spy(() => { throw new Error("error") })
		function A() {
			return {
				view: view,
				oninit: oninit,
			}
		}
		var throwCount = 0
		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(1)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(1)
	})
	o("does not try to re-initialize a closure component whose oninit has thrown", function() {
		var oninit = o.spy(function() {throw new Error("error")})
		var view = o.spy()
		function A() {
			return {
				view: view,
				oninit: oninit,
			}
		}
		var throwCount = 0
		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(0)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(oninit.callCount).equals(1)
		o(view.callCount).equals(0)
	})
	o("does not try to re-initialize a closure component whose closure has thrown", function() {
		function A() {
			throw new Error("error")
		}
		var throwCount = 0
		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)

		try {render(root, m(A))} catch (e) {throwCount++}

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
			return m.key(1, m("div",
				m.key(11, m("div", {oncreate: createA, onupdate: updateA, onremove: removeA})),
				m.key(12, m("div"))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m.key(21, m("div", {oncreate: createB, onupdate: updateB, onremove: removeB})),
				m.key(22, m("div"))
			))
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
			return m.key(1, m("div",
				m("div", {oncreate: createA, onupdate: updateA, onremove: removeA})
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m("div", {oncreate: createB, onupdate: updateB, onremove: removeB})
			))
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
			return m.key(1, m("div",
				m("div", {oncreate: createA, onupdate: updateA, onremove: removeA})
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m("div", {oncreate: createB, onupdate: updateB, onremove: removeB})
			))
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
	o("svg namespace is preserved in keyed diff (#1820)", function(){
		// note that this only exerciese one branch of the keyed diff algo
		var svg = m("svg",
			m.key(0, m("g")),
			m.key(1, m("g"))
		)
		render(root, svg)

		o(svg.dom.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.dom.childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.dom.childNodes[1].namespaceURI).equals("http://www.w3.org/2000/svg")

		svg = m("svg",
			m.key(1, m("g", {x: 1})),
			m.key(2, m("g", {x: 2}))
		)
		render(root, svg)

		o(svg.dom.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.dom.childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.dom.childNodes[1].namespaceURI).equals("http://www.w3.org/2000/svg")
	})
	o("the namespace of the root is passed to children", function() {
		render(root, m("svg"))
		o(root.childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
		render(root.childNodes[0], m("g"))
		o(root.childNodes[0].childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
	})
	o("does not allow reentrant invocations", function() {
		var thrown = []
		function A() {
			var updated = false
			try {render(root, m(A))} catch (e) {thrown.push("construct")}
			return {
				oninit: function() {
					try {render(root, m(A))} catch (e) {thrown.push("oninit")}
				},
				oncreate: function() {
					try {render(root, m(A))} catch (e) {thrown.push("oncreate")}
				},
				onupdate: function() {
					if (updated) return
					updated = true
					try {render(root, m(A))} catch (e) {thrown.push("onupdate")}
				},
				onremove: function() {
					try {render(root, m(A))} catch (e) {thrown.push("onremove")}
				},
				view: function() {
					try {render(root, m(A))} catch (e) {thrown.push("view")}
				},
			}
		}
		render(root, m(A))
		o(thrown).deepEquals([
			"construct",
			"oninit",
			"view",
			"oncreate",
		])
		render(root, m(A))
		o(thrown).deepEquals([
			"construct",
			"oninit",
			"view",
			"oncreate",
			"view",
			"onupdate",
		])
		render(root, [])
		o(thrown).deepEquals([
			"construct",
			"oninit",
			"view",
			"oncreate",
			"view",
			"onupdate",
			"onremove",
		])
	})
})
