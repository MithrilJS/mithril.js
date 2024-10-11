import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("render", function() {
	var G = setupGlobals()

	o("renders plain text", function() {
		m.render(G.root, "a")
		o(G.root.childNodes.length).equals(1)
		o(G.root.childNodes[0].nodeValue).equals("a")
	})

	o("updates plain text", function() {
		m.render(G.root, "a")
		m.render(G.root, "b")
		o(G.root.childNodes.length).equals(1)
		o(G.root.childNodes[0].nodeValue).equals("b")
	})

	o("renders a number", function() {
		m.render(G.root, 1)
		o(G.root.childNodes.length).equals(1)
		o(G.root.childNodes[0].nodeValue).equals("1")
	})

	o("updates a number", function() {
		m.render(G.root, 1)
		m.render(G.root, 2)
		o(G.root.childNodes.length).equals(1)
		o(G.root.childNodes[0].nodeValue).equals("2")
	})

	o("overwrites existing content", function() {
		var vnodes = []

		G.root.appendChild(G.window.document.createElement("div"));

		m.render(G.root, vnodes)

		o(G.root.childNodes.length).equals(0)
	})

	o("throws on invalid root node", function() {
		var threw = false
		try {
			m.render(null, [])
		} catch (e) {
			threw = true
		}
		o(threw).equals(true)
	})

	o("tries to re-initialize a component that threw on create", function() {
		var A = o.spy(() => { throw new Error("error") })
		var throwCount = 0

		try {m.render(G.root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(A.callCount).equals(1)

		try {m.render(G.root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(2)
		o(A.callCount).equals(2)
	})
	o("tries to re-initialize a stateful component whose view threw on create", function() {
		var A = o.spy(() => view)
		var view = o.spy(() => { throw new Error("error") })
		var throwCount = 0
		try {m.render(G.root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(1)
		o(A.callCount).equals(1)
		o(view.callCount).equals(1)

		try {m.render(G.root, m(A))} catch (e) {throwCount++}

		o(throwCount).equals(2)
		o(A.callCount).equals(2)
		o(view.callCount).equals(2)
	})
	o("lifecycle methods work in keyed children of recycled keyed", function() {
		var onabortA = o.spy()
		var onabortB = o.spy()
		var createA = o.spy((_, signal) => { signal.onabort = onabortA })
		var updateA = o.spy((_, signal) => { signal.onabort = onabortA })
		var createB = o.spy((_, signal) => { signal.onabort = onabortB })
		var updateB = o.spy((_, signal) => { signal.onabort = onabortB })
		var a = function() {
			return m.key(1, m("div",
				m.key(11, m("div", m.layout(createA, updateA))),
				m.key(12, m("div"))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m.key(21, m("div", m.layout(createB, updateB))),
				m.key(22, m("div"))
			))
		}
		m.render(G.root, a())
		var first = G.root.firstChild.firstChild
		m.render(G.root, b())
		var second = G.root.firstChild.firstChild
		m.render(G.root, a())
		var third = G.root.firstChild.firstChild

		o(createA.callCount).equals(2)
		o(createA.calls[0].args[0]).equals(first)
		o(createA.calls[0].args[1].aborted).equals(true)
		o(createA.calls[1].args[0]).equals(third)
		o(createA.calls[1].args[1].aborted).equals(false)
		o(updateA.callCount).equals(0)
		o(onabortA.callCount).equals(1)

		o(createB.callCount).equals(1)
		o(createB.calls[0].args[0]).equals(second)
		o(createB.calls[0].args[1]).notEquals(createA.calls[0].args[1])
		o(createB.calls[0].args[1].aborted).equals(true)
		o(updateB.callCount).equals(0)
		o(onabortB.callCount).equals(1)
	})
	o("lifecycle methods work in unkeyed children of recycled keyed", function() {
		var onabortA = o.spy()
		var onabortB = o.spy()
		var createA = o.spy((_, signal) => { signal.onabort = onabortA })
		var updateA = o.spy((_, signal) => { signal.onabort = onabortA })
		var createB = o.spy((_, signal) => { signal.onabort = onabortB })
		var updateB = o.spy((_, signal) => { signal.onabort = onabortB })
		var a = function() {
			return m.key(1, m("div",
				m("div", m.layout(createA, updateA))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m("div", m.layout(createB, updateB))
			))
		}
		m.render(G.root, a())
		var first = G.root.firstChild.firstChild
		m.render(G.root, b())
		var second = G.root.firstChild.firstChild
		m.render(G.root, a())
		var third = G.root.firstChild.firstChild

		o(createA.callCount).equals(2)
		o(createA.calls[0].args[0]).equals(first)
		o(createA.calls[0].args[1].aborted).equals(true)
		o(createA.calls[1].args[0]).equals(third)
		o(createA.calls[1].args[1].aborted).equals(false)
		o(onabortA.callCount).equals(1)

		o(createB.callCount).equals(1)
		o(createB.calls[0].args[0]).equals(second)
		o(createB.calls[0].args[1]).notEquals(createA.calls[0].args[1])
		o(createB.calls[0].args[1].aborted).equals(true)
		o(onabortB.callCount).equals(1)
	})
	o("update lifecycle methods work on children of recycled keyed", function() {
		var onabortA = o.spy()
		var onabortB = o.spy()
		var createA = o.spy((_, signal) => { signal.onabort = onabortA })
		var updateA = o.spy((_, signal) => { signal.onabort = onabortA })
		var createB = o.spy((_, signal) => { signal.onabort = onabortB })
		var updateB = o.spy((_, signal) => { signal.onabort = onabortB })

		var a = function() {
			return m.key(1, m("div",
				m("div", m.layout(createA, updateA))
			))
		}
		var b = function() {
			return m.key(2, m("div",
				m("div", m.layout(createB, updateB))
			))
		}
		m.render(G.root, a())
		m.render(G.root, a())
		var first = G.root.firstChild.firstChild
		o(createA.callCount).equals(1)
		o(updateA.callCount).equals(1)
		o(createA.calls[0].args[0]).equals(first)
		o(updateA.calls[0].args[0]).equals(first)
		o(createA.calls[0].args[1]).equals(updateA.calls[0].args[1])
		o(createA.calls[0].args[1].aborted).equals(false)
		o(onabortA.callCount).equals(0)

		m.render(G.root, b())
		var second = G.root.firstChild.firstChild
		o(createA.callCount).equals(1)
		o(updateA.callCount).equals(1)
		o(createA.calls[0].args[1].aborted).equals(true)
		o(onabortA.callCount).equals(1)

		o(createB.callCount).equals(1)
		o(updateB.callCount).equals(0)
		o(createB.calls[0].args[0]).equals(second)
		o(createB.calls[0].args[1].aborted).equals(false)
		o(onabortB.callCount).equals(0)

		m.render(G.root, a())
		m.render(G.root, a())
		var third = G.root.firstChild.firstChild
		o(createB.callCount).equals(1)
		o(updateB.callCount).equals(0)
		o(createB.calls[0].args[1].aborted).equals(true)
		o(onabortB.callCount).equals(1)

		o(createA.callCount).equals(2)
		o(updateA.callCount).equals(2)
		o(createA.calls[1].args[0]).equals(third)
		o(createA.calls[1].args[1]).notEquals(updateA.calls[0].args[1])
		o(createA.calls[1].args[1].aborted).equals(false)
		o(onabortA.callCount).equals(1)
	})
	o("svg namespace is preserved in keyed diff (#1820)", function(){
		// note that this only exerciese one branch of the keyed diff algo
		var svg = m("svg",
			m.key(0, m("g")),
			m.key(1, m("g"))
		)
		m.render(G.root, svg)

		o(svg.d.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.d.childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.d.childNodes[1].namespaceURI).equals("http://www.w3.org/2000/svg")

		svg = m("svg",
			m.key(1, m("g", {x: 1})),
			m.key(2, m("g", {x: 2}))
		)
		m.render(G.root, svg)

		o(svg.d.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.d.childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
		o(svg.d.childNodes[1].namespaceURI).equals("http://www.w3.org/2000/svg")
	})
	o("the namespace of the root is passed to children", function() {
		m.render(G.root, m("svg"))
		o(G.root.childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
		m.render(G.root.childNodes[0], m("g"))
		o(G.root.childNodes[0].childNodes[0].namespaceURI).equals("http://www.w3.org/2000/svg")
	})
	o("does not allow reentrant invocations", function() {
		var thrown = []
		function A() {
			try {m.render(G.root, m(A))} catch (e) {thrown.push("construct")}
			return () => {
				try {m.render(G.root, m(A))} catch (e) {thrown.push("view")}
			}
		}
		m.render(G.root, m(A))
		o(thrown).deepEquals([
			"construct",
			"view",
		])
		m.render(G.root, m(A))
		o(thrown).deepEquals([
			"construct",
			"view",
			"view",
		])
		m.render(G.root, [])
		o(thrown).deepEquals([
			"construct",
			"view",
			"view",
		])
	})
})
