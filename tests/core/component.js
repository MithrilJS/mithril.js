import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("component", function() {
	var G = setupGlobals()

	o.spec("basics", function() {
		o("works", function() {
			var component = () => m("div", {id: "a"}, "b")
			var node = m(component)

			m.render(G.root, node)

			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("receives arguments", function() {
			var component = (attrs) => m("div", attrs)
			var node = m(component, {id: "a"}, "b")

			m.render(G.root, node)

			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("updates", function() {
			var component = (attrs) => m("div", attrs)
			m.render(G.root, [m(component, {id: "a"}, "b")])
			m.render(G.root, [m(component, {id: "c"}, "d")])

			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("c")
			o(G.root.firstChild.firstChild.nodeValue).equals("d")
		})
		o("updates root from null", function() {
			var visible = false
			var component = () => (visible ? m("div") : null)
			m.render(G.root, m(component))
			visible = true
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeName).equals("DIV")
		})
		o("updates root from primitive", function() {
			var visible = false
			var component = () => (visible ? m("div") : false)
			m.render(G.root, m(component))
			visible = true
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeName).equals("DIV")
		})
		o("updates root to null", function() {
			var visible = true
			var component = () => (visible ? m("div") : null)
			m.render(G.root, m(component))
			visible = false
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("updates root to primitive", function() {
			var visible = true
			var component = () => (visible ? m("div") : false)
			m.render(G.root, m(component))
			visible = false
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("updates root from null to null", function() {
			var component = () => null
			m.render(G.root, m(component))
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("removes", function() {
			var component = () => m("div")
			m.render(G.root, [m.key(1, m(component)), m.key(2, m("div"))])
			var div = m("div")
			m.render(G.root, [m.key(2, div)])

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild).equals(div.d)
		})
		o("svg works when creating across component boundary", function() {
			var component = () => m("g")
			m.render(G.root, m("svg", m(component)))

			o(G.root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
		o("svg works when updating across component boundary", function() {
			var component = () => m("g")
			m.render(G.root, m("svg", m(component)))
			m.render(G.root, m("svg", m(component)))

			o(G.root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
	})
	o.spec("return value", function() {
		o("can return fragments", function() {
			var component = () => [
				m("label"),
				m("input"),
			]
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(2)
			o(G.root.childNodes[0].nodeName).equals("LABEL")
			o(G.root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can return string", function() {
			var component = () => "a"
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeType).equals(3)
			o(G.root.firstChild.nodeValue).equals("a")
		})
		o("can return falsy string", function() {
			var component = () => ""
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeType).equals(3)
			o(G.root.firstChild.nodeValue).equals("")
		})
		o("can return number", function() {
			var component = () => 1
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeType).equals(3)
			o(G.root.firstChild.nodeValue).equals("1")
		})
		o("can return falsy number", function() {
			var component = () => 0
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeType).equals(3)
			o(G.root.firstChild.nodeValue).equals("0")
		})
		o("can return `true`", function() {
			var component = () => true
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("can return `false`", function() {
			var component = () => false
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("can return null", function() {
			var component = () => null
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("can return undefined", function() {
			var component = () => undefined
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("throws a custom error if it returns itself when created", function() {
			// A view that returns its vnode would otherwise trigger an infinite loop
			var component = () => vnode

			console.error = o.spy()

			var vnode = m(component)
			m.render(G.root, vnode)

			o(console.error.callCount).equals(1)
			o(console.error.args[0] instanceof Error).equals(true)
			// Call stack exception is a RangeError
			o(console.error.args[0] instanceof RangeError).equals(false)
		})
		o("throws a custom error if it returns itself when updated", function() {
			// A view that returns its vnode would otherwise trigger an infinite loop
			var component = () => vnode
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)

			console.error = o.spy()

			var vnode = m(component)
			m.render(G.root, m(component))

			o(console.error.callCount).equals(1)
			o(console.error.args[0] instanceof Error).equals(true)
			// Call stack exception is a RangeError
			o(console.error.args[0] instanceof RangeError).equals(false)
		})
		o("can update when returning fragments", function() {
			var component = () => [
				m("label"),
				m("input"),
			]
			m.render(G.root, m(component))
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(2)
			o(G.root.childNodes[0].nodeName).equals("LABEL")
			o(G.root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can update when returning primitive", function() {
			var component = () => "a"
			m.render(G.root, m(component))
			m.render(G.root, m(component))

			o(G.root.firstChild.nodeType).equals(3)
			o(G.root.firstChild.nodeValue).equals("a")
		})
		o("can update when returning null", function() {
			var component = () => null
			m.render(G.root, m(component))
			m.render(G.root, m(component))

			o(G.root.childNodes.length).equals(0)
		})
		o("can remove when returning fragments", function() {
			var component = () => [
				m("label"),
				m("input"),
			]
			var div = m("div")
			m.render(G.root, [m.key(1, m(component)), m.key(2, div)])

			m.render(G.root, [m.key(2, m("div"))])

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild).equals(div.d)
		})
		o("can remove when returning primitive", function() {
			var component = () => "a"
			var div = m("div")
			m.render(G.root, [m.key(1, m(component)), m.key(2, div)])

			m.render(G.root, [m.key(2, m("div"))])

			o(G.root.childNodes.length).equals(1)
			o(G.root.firstChild).equals(div.d)
		})
	})
	o.spec("lifecycle", function() {
		o("constructs", function() {
			var called = 0
			var component = () => {
				called++

				o(G.root.childNodes.length).equals(0)

				return () => m("div", {id: "a"}, "b")
			}

			m.render(G.root, m(component))

			o(called).equals(1)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("constructs when returning fragment", function() {
			var called = 0
			var component = () => {
				called++

				o(G.root.childNodes.length).equals(0)

				return () => [m("div", {id: "a"}, "b")]
			}

			m.render(G.root, m(component))

			o(called).equals(1)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("can call view function returned on initialization", function() {
			var viewCalled = false
			var component = () => {
				o(viewCalled).equals(false)
				return () => {
					viewCalled = true
					return m("div", {id: "a"}, "b")
				}
			}

			m.render(G.root, m(component))
		})
		o("does not initialize on redraw", function() {
			var component = o.spy(() => () => m("div", {id: "a"}, "b"))

			function view() {
				return m(component)
			}

			m.render(G.root, view())
			m.render(G.root, view())

			o(component.callCount).equals(1)
		})
		o("calls inner `m.layout` callback on render", function() {
			var layoutSpy = o.spy()
			var component = () => [
				m.layout(layoutSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(G.root, m(component))

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.calls[0].args[0]).equals(G.root)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")

			m.render(G.root, m(component))

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.calls[1].args[0]).equals(G.root)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls inner `m.remove` callback after first render", function() {
			var removeSpy = o.spy()
			var component = () => [
				m.remove(removeSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(G.root, m(component))
			m.render(G.root, null)

			o(removeSpy.callCount).equals(1)
			o(removeSpy.args[0]).equals(G.root)
			o(G.root.childNodes.length).equals(0)
		})
		o("calls inner `m.remove` callback after subsequent render", function() {
			var removeSpy = o.spy()
			var component = () => [
				m.remove(removeSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(G.root, m(component))
			m.render(G.root, m(component))
			m.render(G.root, null)

			o(removeSpy.callCount).equals(1)
			o(removeSpy.args[0]).equals(G.root)
			o(G.root.childNodes.length).equals(0)
		})
		o("calls in-element inner `m.layout` callback on render", function() {
			var layoutSpy = o.spy()
			var component = () => m("div", {id: "a"}, m.layout(layoutSpy), "b")
			m.render(G.root, m(component))

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.calls[0].args[0]).equals(G.root.firstChild)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")

			m.render(G.root, m(component))

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.calls[1].args[0]).equals(G.root.firstChild)
			o(G.root.firstChild.nodeName).equals("DIV")
			o(G.root.firstChild.attributes["id"].value).equals("a")
			o(G.root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls in-element inner `m.remove` callback after first render", function() {
			var removeSpy = o.spy()
			var component = () => m("div", {id: "a"}, m.remove(removeSpy), "b")
			m.render(G.root, m(component))
			var firstChild = G.root.firstChild
			m.render(G.root, null)

			o(removeSpy.callCount).equals(1)
			o(removeSpy.args[0]).equals(firstChild)
			o(G.root.childNodes.length).equals(0)
		})
		o("calls in-element inner `m.remove` callback after subsequent render", function() {
			var removeSpy = o.spy()
			var component = () => m("div", {id: "a"}, m.remove(removeSpy), "b")
			m.render(G.root, m(component))
			m.render(G.root, m(component))
			var firstChild = G.root.firstChild
			m.render(G.root, null)

			o(removeSpy.callCount).equals(1)
			o(removeSpy.args[0]).equals(firstChild)
			o(G.root.childNodes.length).equals(0)
		})
		o("calls direct inner `m.layout` callback on render", function() {
			var createSpy = o.spy()
			var component = () => m.layout(createSpy)

			m.render(G.root, m(component))

			o(createSpy.callCount).equals(1)
			o(createSpy.calls[0].args[0]).equals(G.root)
			o(G.root.childNodes.length).equals(0)

			m.render(G.root, m(component))

			o(createSpy.callCount).equals(2)
			o(createSpy.calls[1].args[0]).equals(G.root)
			o(G.root.childNodes.length).equals(0)
		})
		o("calls direct inner `m.remove` callback after first render", function() {
			var removeSpy = o.spy()
			var component = () => m.layout(removeSpy)
			m.render(G.root, m(component))
			m.render(G.root, null)

			o(removeSpy.callCount).equals(1)
			o(removeSpy.args[0]).equals(G.root)
			o(G.root.childNodes.length).equals(0)
		})
		o("calls direct inner `m.remove` callback after subsequent render", function() {
			var removeSpy = o.spy()
			var component = () => m.remove(removeSpy)
			m.render(G.root, m(component))
			m.render(G.root, m(component))
			m.render(G.root, null)

			o(removeSpy.callCount).equals(1)
			o(removeSpy.args[0]).equals(G.root)
			o(G.root.childNodes.length).equals(0)
		})
		o("no recycling observable with `m.layout` (was: recycled components get a fresh state)", function() {
			var createSpy = o.spy()
			var component = o.spy(() => m("div", m.layout(createSpy)))

			m.render(G.root, [m("div", m.key(1, m(component)))])
			var child = G.root.firstChild.firstChild
			m.render(G.root, [])
			m.render(G.root, [m("div", m.key(1, m(component)))])

			o(child).notEquals(G.root.firstChild.firstChild) // this used to be a recycling pool test
			o(component.callCount).equals(2)
		})
		o("no recycling observable with `m.remove` (was: recycled components get a fresh state)", function() {
			var createSpy = o.spy()
			var component = o.spy(() => m("div", m.remove(createSpy)))

			m.render(G.root, [m("div", m.key(1, m(component)))])
			var child = G.root.firstChild.firstChild
			m.render(G.root, [])
			m.render(G.root, [m("div", m.key(1, m(component)))])
			var found = G.root.firstChild.firstChild
			m.render(G.root, [])

			o(child).notEquals(found) // this used to be a recycling pool test
			o(component.callCount).equals(2)
		})
	})
})
