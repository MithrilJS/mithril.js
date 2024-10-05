import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/core/hyperscript.js"
import render from "../../src/core/render.js"

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

	o("tries to re-initialize a component that threw on create", function() {
		var A = o.spy(() => { throw new Error("error") })
		var throwCount = 0

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(A.callCount).equals(1)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(2)
		o(A.callCount).equals(2)
	})
	o("tries to re-initialize a stateful component whose view threw on create", function() {
		var A = o.spy(() => view)
		var view = o.spy(() => { throw new Error("error") })
		var throwCount = 0
		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(A.callCount).equals(1)
		o(view.callCount).equals(1)

		try {render(root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(2)
		o(A.callCount).equals(2)
		o(view.callCount).equals(2)
	})
	o("lifecycle methods work in keyed children of recycled keyed", function() {
		var onabortA = o.spy()
		var onabortB = o.spy()
		var layoutA = o.spy((_, signal) => { signal.onabort = onabortA })
		var layoutB = o.spy((_, signal) => { signal.onabort = onabortB })
		var a = function() {
			return m.key(1, m("div",
				m.key(11, m("div", m.layout(layoutA))),
				m.key(12, m("div"))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m.key(21, m("div", m.layout(layoutB))),
				m.key(22, m("div"))
			))
		}
		render(root, a())
		var first = root.firstChild.firstChild
		render(root, b())
		var second = root.firstChild.firstChild
		render(root, a())
		var third = root.firstChild.firstChild

		o(layoutA.callCount).equals(2)
		o(layoutA.calls[0].args[0]).equals(first)
		o(layoutA.calls[0].args[1].aborted).equals(true)
		o(layoutA.calls[0].args[2]).equals(true)
		o(layoutA.calls[1].args[0]).equals(third)
		o(layoutA.calls[1].args[1].aborted).equals(false)
		o(layoutA.calls[1].args[2]).equals(true)
		o(onabortA.callCount).equals(1)

		o(layoutB.callCount).equals(1)
		o(layoutB.calls[0].args[0]).equals(second)
		o(layoutB.calls[0].args[1]).notEquals(layoutA.calls[0].args[1])
		o(layoutB.calls[0].args[1].aborted).equals(true)
		o(layoutB.calls[0].args[2]).equals(true)
		o(onabortB.callCount).equals(1)
	})
	o("lifecycle methods work in unkeyed children of recycled keyed", function() {
		var onabortA = o.spy()
		var onabortB = o.spy()
		var layoutA = o.spy((_, signal) => { signal.onabort = onabortA })
		var layoutB = o.spy((_, signal) => { signal.onabort = onabortB })
		var a = function() {
			return m.key(1, m("div",
				m("div", m.layout(layoutA))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m("div", m.layout(layoutB))
			))
		}
		render(root, a())
		var first = root.firstChild.firstChild
		render(root, b())
		var second = root.firstChild.firstChild
		render(root, a())
		var third = root.firstChild.firstChild

		o(layoutA.callCount).equals(2)
		o(layoutA.calls[0].args[0]).equals(first)
		o(layoutA.calls[0].args[1].aborted).equals(true)
		o(layoutA.calls[0].args[2]).equals(true)
		o(layoutA.calls[1].args[0]).equals(third)
		o(layoutA.calls[1].args[1].aborted).equals(false)
		o(layoutA.calls[1].args[2]).equals(true)
		o(onabortA.callCount).equals(1)

		o(layoutB.callCount).equals(1)
		o(layoutB.calls[0].args[0]).equals(second)
		o(layoutB.calls[0].args[1]).notEquals(layoutA.calls[0].args[1])
		o(layoutB.calls[0].args[1].aborted).equals(true)
		o(layoutB.calls[0].args[2]).equals(true)
		o(onabortB.callCount).equals(1)
	})
	o("update lifecycle methods work on children of recycled keyed", function() {
		var onabortA = o.spy()
		var onabortB = o.spy()
		var layoutA = o.spy((_, signal) => { signal.onabort = onabortA })
		var layoutB = o.spy((_, signal) => { signal.onabort = onabortB })

		var a = function() {
			return m.key(1, m("div",
				m("div", m.layout(layoutA))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m("div", m.layout(layoutB))
			))
		}
		render(root, a())
		render(root, a())
		var first = root.firstChild.firstChild
		o(layoutA.callCount).equals(2)
		o(layoutA.calls[0].args[0]).equals(first)
		o(layoutA.calls[1].args[0]).equals(first)
		o(layoutA.calls[0].args[1]).equals(layoutA.calls[1].args[1])
		o(layoutA.calls[0].args[1].aborted).equals(false)
		o(layoutA.calls[0].args[2]).equals(true)
		o(layoutA.calls[1].args[2]).equals(false)
		o(onabortA.callCount).equals(0)

		render(root, b())
		var second = root.firstChild.firstChild
		o(layoutA.callCount).equals(2)
		o(layoutA.calls[0].args[1].aborted).equals(true)
		o(onabortA.callCount).equals(1)

		o(layoutB.callCount).equals(1)
		o(layoutB.calls[0].args[0]).equals(second)
		o(layoutB.calls[0].args[1].aborted).equals(false)
		o(layoutB.calls[0].args[2]).equals(true)
		o(onabortB.callCount).equals(0)

		render(root, a())
		render(root, a())
		var third = root.firstChild.firstChild
		o(layoutB.callCount).equals(1)
		o(layoutB.calls[0].args[1].aborted).equals(true)
		o(onabortB.callCount).equals(1)

		o(layoutA.callCount).equals(4)
		o(layoutA.calls[2].args[0]).equals(third)
		o(layoutA.calls[2].args[1]).notEquals(layoutA.calls[1].args[1])
		o(layoutA.calls[2].args[1].aborted).equals(false)
		o(layoutA.calls[2].args[2]).equals(true)
		o(onabortA.callCount).equals(1)
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
			try {render(root, m(A))} catch (e) {thrown.push("construct")}
			return () => {
				try {render(root, m(A))} catch (e) {thrown.push("view")}
			}
		}
		render(root, m(A))
		o(thrown).deepEquals([
			"construct",
			"view",
		])
		render(root, m(A))
		o(thrown).deepEquals([
			"construct",
			"view",
			"view",
		])
		render(root, [])
		o(thrown).deepEquals([
			"construct",
			"view",
			"view",
		])
	})
})
