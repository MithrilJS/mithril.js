import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("component", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o.spec("basics", function() {
		o("works", function() {
			var component = () => m("div", {id: "a"}, "b")
			var node = m(component)

			m.render(root, node)

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("receives arguments", function() {
			var component = (attrs) => m("div", attrs)
			var node = m(component, {id: "a"}, "b")

			m.render(root, node)

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("updates", function() {
			var component = (attrs) => m("div", attrs)
			m.render(root, [m(component, {id: "a"}, "b")])
			m.render(root, [m(component, {id: "c"}, "d")])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("c")
			o(root.firstChild.firstChild.nodeValue).equals("d")
		})
		o("updates root from null", function() {
			var visible = false
			var component = () => (visible ? m("div") : null)
			m.render(root, m(component))
			visible = true
			m.render(root, m(component))

			o(root.firstChild.nodeName).equals("DIV")
		})
		o("updates root from primitive", function() {
			var visible = false
			var component = () => (visible ? m("div") : false)
			m.render(root, m(component))
			visible = true
			m.render(root, m(component))

			o(root.firstChild.nodeName).equals("DIV")
		})
		o("updates root to null", function() {
			var visible = true
			var component = () => (visible ? m("div") : null)
			m.render(root, m(component))
			visible = false
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("updates root to primitive", function() {
			var visible = true
			var component = () => (visible ? m("div") : false)
			m.render(root, m(component))
			visible = false
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("updates root from null to null", function() {
			var component = () => null
			m.render(root, m(component))
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("removes", function() {
			var component = () => m("div")
			m.render(root, [m.key(1, m(component)), m.key(2, m("div"))])
			var div = m("div")
			m.render(root, [m.key(2, div)])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
		o("svg works when creating across component boundary", function() {
			var component = () => m("g")
			m.render(root, m("svg", m(component)))

			o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
		o("svg works when updating across component boundary", function() {
			var component = () => m("g")
			m.render(root, m("svg", m(component)))
			m.render(root, m("svg", m(component)))

			o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
	})
	o.spec("return value", function() {
		o("can return fragments", function() {
			var component = () => [
				m("label"),
				m("input"),
			]
			m.render(root, m(component))

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("LABEL")
			o(root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can return string", function() {
			var component = () => "a"
			m.render(root, m(component))

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("a")
		})
		o("can return falsy string", function() {
			var component = () => ""
			m.render(root, m(component))

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("")
		})
		o("can return number", function() {
			var component = () => 1
			m.render(root, m(component))

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("1")
		})
		o("can return falsy number", function() {
			var component = () => 0
			m.render(root, m(component))

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("0")
		})
		o("can return `true`", function() {
			var component = () => true
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("can return `false`", function() {
			var component = () => false
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("can return null", function() {
			var component = () => null
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("can return undefined", function() {
			var component = () => undefined
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("throws a custom error if it returns itself when created", function() {
			// A view that returns its vnode would otherwise trigger an infinite loop
			var threw = false
			var component = () => vnode
			var vnode = m(component)
			try {
				m.render(root, vnode)
			}
			catch (e) {
				threw = true
				o(e instanceof Error).equals(true)
				// Call stack exception is a RangeError
				o(e instanceof RangeError).equals(false)
			}
			o(threw).equals(true)
		})
		o("throws a custom error if it returns itself when updated", function() {
			// A view that returns its vnode would otherwise trigger an infinite loop
			var threw = false
			var component = () => vnode
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)

			var vnode = m(component)
			try {
				m.render(root, m(component))
			}
			catch (e) {
				threw = true
				o(e instanceof Error).equals(true)
				// Call stack exception is a RangeError
				o(e instanceof RangeError).equals(false)
			}
			o(threw).equals(true)
		})
		o("can update when returning fragments", function() {
			var component = () => [
				m("label"),
				m("input"),
			]
			m.render(root, m(component))
			m.render(root, m(component))

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("LABEL")
			o(root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can update when returning primitive", function() {
			var component = () => "a"
			m.render(root, m(component))
			m.render(root, m(component))

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("a")
		})
		o("can update when returning null", function() {
			var component = () => null
			m.render(root, m(component))
			m.render(root, m(component))

			o(root.childNodes.length).equals(0)
		})
		o("can remove when returning fragments", function() {
			var component = () => [
				m("label"),
				m("input"),
			]
			var div = m("div")
			m.render(root, [m.key(1, m(component)), m.key(2, div)])

			m.render(root, [m.key(2, m("div"))])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
		o("can remove when returning primitive", function() {
			var component = () => "a"
			var div = m("div")
			m.render(root, [m.key(1, m(component)), m.key(2, div)])

			m.render(root, [m.key(2, m("div"))])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
	})
	o.spec("lifecycle", function() {
		o("constructs", function() {
			var called = 0
			var component = () => {
				called++

				o(root.childNodes.length).equals(0)

				return () => m("div", {id: "a"}, "b")
			}

			m.render(root, m(component))

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("constructs when returning fragment", function() {
			var called = 0
			var component = () => {
				called++

				o(root.childNodes.length).equals(0)

				return () => [m("div", {id: "a"}, "b")]
			}

			m.render(root, m(component))

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
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

			m.render(root, m(component))
		})
		o("does not initialize on redraw", function() {
			var component = o.spy(() => () => m("div", {id: "a"}, "b"))

			function view() {
				return m(component)
			}

			m.render(root, view())
			m.render(root, view())

			o(component.callCount).equals(1)
		})
		o("calls inner `m.layout` as initial on first render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => [
				m.layout(layoutSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(root, m(component))

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[0]).equals(root)
			o(layoutSpy.args[1].aborted).equals(false)
			o(onabort.callCount).equals(0)
			o(layoutSpy.args[2]).equals(true)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls inner `m.layout` as non-initial on subsequent render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => [
				m.layout(layoutSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(root, m(component))
			m.render(root, m(component))

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.args[0]).equals(root)
			o(layoutSpy.args[1].aborted).equals(false)
			o(onabort.callCount).equals(0)
			o(layoutSpy.args[2]).equals(false)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("aborts inner `m.layout` signal after first render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => [
				m.layout(layoutSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(root, m(component))
			m.render(root, null)

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[1].aborted).equals(true)
			o(onabort.callCount).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("aborts inner `m.layout` signal after subsequent render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => [
				m.layout(layoutSpy),
				m("div", {id: "a"}, "b"),
			]

			m.render(root, m(component))
			m.render(root, m(component))
			m.render(root, null)

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.args[1].aborted).equals(true)
			o(onabort.callCount).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls in-element inner `m.layout` as initial on first render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m("div", {id: "a"}, m.layout(layoutSpy), "b")
			m.render(root, m(component))

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[0]).equals(root.firstChild)
			o(layoutSpy.args[1].aborted).equals(false)
			o(onabort.callCount).equals(0)
			o(layoutSpy.args[2]).equals(true)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls in-element inner `m.layout` as non-initial on subsequent render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m("div", {id: "a"}, m.layout(layoutSpy), "b")
			m.render(root, m(component))
			m.render(root, m(component))

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.args[0]).equals(root.firstChild)
			o(layoutSpy.args[1].aborted).equals(false)
			o(onabort.callCount).equals(0)
			o(layoutSpy.args[2]).equals(false)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].value).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("aborts in-element inner `m.layout` signal after first render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m("div", {id: "a"}, m.layout(layoutSpy), "b")
			m.render(root, m(component))
			m.render(root, null)

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[1].aborted).equals(true)
			o(onabort.callCount).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("aborts in-element inner `m.layout` signal after subsequent render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m("div", {id: "a"}, m.layout(layoutSpy), "b")
			m.render(root, m(component))
			m.render(root, m(component))
			m.render(root, null)

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.args[1].aborted).equals(true)
			o(onabort.callCount).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls direct inner `m.layout` as initial on first render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m.layout(layoutSpy)
			m.render(root, m(component))

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[0]).equals(root)
			o(layoutSpy.args[1].aborted).equals(false)
			o(onabort.callCount).equals(0)
			o(layoutSpy.args[2]).equals(true)
			o(root.childNodes.length).equals(0)
		})
		o("calls direct inner `m.layout` as non-initial on subsequent render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m.layout(layoutSpy)
			m.render(root, m(component))
			m.render(root, m(component))

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.args[0]).equals(root)
			o(layoutSpy.args[1].aborted).equals(false)
			o(layoutSpy.args[2]).equals(false)
			o(onabort.callCount).equals(0)
			o(root.childNodes.length).equals(0)
		})
		o("aborts direct inner `m.layout` signal after first render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m.layout(layoutSpy)
			m.render(root, m(component))
			m.render(root, null)

			o(layoutSpy.callCount).equals(1)
			o(layoutSpy.args[1].aborted).equals(true)
			o(onabort.callCount).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("aborts direct inner `m.layout` signal after subsequent render", function() {
			var onabort = o.spy()
			var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
			var component = () => m.layout(layoutSpy)
			m.render(root, m(component))
			m.render(root, m(component))
			m.render(root, null)

			o(layoutSpy.callCount).equals(2)
			o(layoutSpy.args[1].aborted).equals(true)
			o(onabort.callCount).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("no recycling occurs (was: recycled components get a fresh state)", function() {
			var layout = o.spy()
			var component = o.spy(() => m("div", m.layout(layout)))

			m.render(root, [m("div", m.key(1, m(component)))])
			var child = root.firstChild.firstChild
			m.render(root, [])
			m.render(root, [m("div", m.key(1, m(component)))])

			o(child).notEquals(root.firstChild.firstChild) // this used to be a recycling pool test
			o(component.callCount).equals(2)
			o(layout.calls.map((c) => c.args[2])).deepEquals([true, true])
		})
	})
})
