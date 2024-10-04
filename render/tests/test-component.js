"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var render = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("component", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o.spec("basics", function() {
				o("works", function() {
					var component = createComponent({
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})
					var node = m(component)

					render(root, node)

					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("receives arguments", function() {
					var component = createComponent({
						view: function(vnode) {
							return m("div", vnode.attrs, vnode.children)
						}
					})
					var node = m(component, {id: "a"}, "b")

					render(root, node)

					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("updates", function() {
					var component = createComponent({
						view: function(vnode) {
							return m("div", vnode.attrs, vnode.children)
						}
					})
					render(root, [m(component, {id: "a"}, "b")])
					render(root, [m(component, {id: "c"}, "d")])

					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("c")
					o(root.firstChild.firstChild.nodeValue).equals("d")
				})
				o("updates root from null", function() {
					var visible = false
					var component = createComponent({
						view: function() {
							return visible ? m("div") : null
						}
					})
					render(root, m(component))
					visible = true
					render(root, m(component))

					o(root.firstChild.nodeName).equals("DIV")
				})
				o("updates root from primitive", function() {
					var visible = false
					var component = createComponent({
						view: function() {
							return visible ? m("div") : false
						}
					})
					render(root, m(component))
					visible = true
					render(root, m(component))

					o(root.firstChild.nodeName).equals("DIV")
				})
				o("updates root to null", function() {
					var visible = true
					var component = createComponent({
						view: function() {
							return visible ? m("div") : null
						}
					})
					render(root, m(component))
					visible = false
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("updates root to primitive", function() {
					var visible = true
					var component = createComponent({
						view: function() {
							return visible ? m("div") : false
						}
					})
					render(root, m(component))
					visible = false
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("updates root from null to null", function() {
					var component = createComponent({
						view: function() {
							return null
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("removes", function() {
					var component = createComponent({
						view: function() {
							return m("div")
						}
					})
					var div = m("div")
					render(root, [m.key(1, m(component)), m.key(2, div)])
					render(root, [m.key(2, div)])

					o(root.childNodes.length).equals(1)
					o(root.firstChild).equals(div.dom)
				})
				o("svg works when creating across component boundary", function() {
					var component = createComponent({
						view: function() {
							return m("g")
						}
					})
					render(root, m("svg", m(component)))

					o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
				})
				o("svg works when updating across component boundary", function() {
					var component = createComponent({
						view: function() {
							return m("g")
						}
					})
					render(root, m("svg", m(component)))
					render(root, m("svg", m(component)))

					o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
				})
			})
			o.spec("return value", function() {
				o("can return fragments", function() {
					var component = createComponent({
						view: function() {
							return [
								m("label"),
								m("input"),
							]
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("LABEL")
					o(root.childNodes[1].nodeName).equals("INPUT")
				})
				o("can return string", function() {
					var component = createComponent({
						view: function() {
							return "a"
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("a")
				})
				o("can return falsy string", function() {
					var component = createComponent({
						view: function() {
							return ""
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("")
				})
				o("can return number", function() {
					var component = createComponent({
						view: function() {
							return 1
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("1")
				})
				o("can return falsy number", function() {
					var component = createComponent({
						view: function() {
							return 0
						}
					})
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("0")
				})
				o("can return `true`", function() {
					var component = createComponent({
						view: function() {
							return true
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can return `false`", function() {
					var component = createComponent({
						view: function() {
							return false
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can return null", function() {
					var component = createComponent({
						view: function() {
							return null
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can return undefined", function() {
					var component = createComponent({
						view: function() {
							return undefined
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("throws a custom error if it returns itself when created", function() {
					// A view that returns its vnode would otherwise trigger an infinite loop
					var threw = false
					var component = createComponent({
						view: function(vnode) {
							return vnode
						}
					})
					try {
						render(root, m(component))
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
					var init = true
					var constructor = o.spy()
					var component = createComponent({
						constructor: constructor,
						view: function(vnode) {
							if (init) return init = false
							else return vnode
						}
					})
					render(root, m(component))

					o(root.childNodes.length).equals(0)

					try {
						render(root, m(component))
					}
					catch (e) {
						threw = true
						o(e instanceof Error).equals(true)
						// Call stack exception is a RangeError
						o(e instanceof RangeError).equals(false)
					}
					o(threw).equals(true)
					o(constructor.callCount).equals(1)
				})
				o("can update when returning fragments", function() {
					var component = createComponent({
						view: function() {
							return [
								m("label"),
								m("input"),
							]
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.childNodes.length).equals(2)
					o(root.childNodes[0].nodeName).equals("LABEL")
					o(root.childNodes[1].nodeName).equals("INPUT")
				})
				o("can update when returning primitive", function() {
					var component = createComponent({
						view: function() {
							return "a"
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.firstChild.nodeType).equals(3)
					o(root.firstChild.nodeValue).equals("a")
				})
				o("can update when returning null", function() {
					var component = createComponent({
						view: function() {
							return null
						}
					})
					render(root, m(component))
					render(root, m(component))

					o(root.childNodes.length).equals(0)
				})
				o("can remove when returning fragments", function() {
					var component = createComponent({
						view: function() {
							return [
								m("label"),
								m("input"),
							]
						}
					})
					var div = m("div")
					render(root, [m.key(1, m(component)), m.key(2, div)])

					render(root, [m.key(2, m("div"))])

					o(root.childNodes.length).equals(1)
					o(root.firstChild).equals(div.dom)
				})
				o("can remove when returning primitive", function() {
					var component = createComponent({
						view: function() {
							return "a"
						}
					})
					var div = m("div")
					render(root, [m.key(1, m(component)), m.key(2, div)])

					render(root, [m.key(2, m("div"))])

					o(root.childNodes.length).equals(1)
					o(root.firstChild).equals(div.dom)
				})
			})
			o.spec("lifecycle", function() {
				o("calls constructor", function() {
					var called = 0
					var component = createComponent({
						constructor: function(vnode) {
							called++

							o(vnode.tag).equals(component)
							o(vnode.dom).equals(undefined)
							o(root.childNodes.length).equals(0)
						},
						view: function() {
							return m("div", {id: "a"}, "b")
						}
					})

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls constructor when returning fragment", function() {
					var called = 0
					var component = createComponent({
						constructor: function(vnode) {
							called++

							o(vnode.tag).equals(component)
							o(vnode.dom).equals(undefined)
							o(root.childNodes.length).equals(0)
						},
						view: function() {
							return [m("div", {id: "a"}, "b")]
						}
					})

					render(root, m(component))

					o(called).equals(1)
					o(root.firstChild.nodeName).equals("DIV")
					o(root.firstChild.attributes["id"].value).equals("a")
					o(root.firstChild.firstChild.nodeValue).equals("b")
				})
				o("calls constructor before view", function() {
					var viewCalled = false
					var component = createComponent({
						view: function() {
							viewCalled = true
							return m("div", {id: "a"}, "b")
						},
						constructor: function() {
							o(viewCalled).equals(false)
						},
					})

					render(root, m(component))
				})
				o("does not calls constructor on redraw", function() {
					var init = o.spy()
					var component = createComponent({
						view: function() {
							return m("div", {id: "a"}, "b")
						},
						constructor: init,
					})

					function view() {
						return m(component)
					}

					render(root, view())
					render(root, view())

					o(init.callCount).equals(1)
				})
				o("calls inner `m.layout` as initial on first render", function() {
					var onabort = o.spy()
					var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
					var component = createComponent({
						view: () => [
							m.layout(layoutSpy),
							m("div", {id: "a"}, "b"),
						]
					})

					render(root, m(component))

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
					var component = createComponent({
						view: () => [
							m.layout(layoutSpy),
							m("div", {id: "a"}, "b"),
						]
					})

					render(root, m(component))
					render(root, m(component))

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
					var component = createComponent({
						view: () => [
							m.layout(layoutSpy),
							m("div", {id: "a"}, "b"),
						]
					})

					render(root, m(component))
					render(root, null)

					o(layoutSpy.callCount).equals(1)
					o(layoutSpy.args[1].aborted).equals(true)
					o(onabort.callCount).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("aborts inner `m.layout` signal after subsequent render", function() {
					var onabort = o.spy()
					var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
					var component = createComponent({
						view: () => [
							m.layout(layoutSpy),
							m("div", {id: "a"}, "b"),
						]
					})

					render(root, m(component))
					render(root, m(component))
					render(root, null)

					o(layoutSpy.callCount).equals(2)
					o(layoutSpy.args[1].aborted).equals(true)
					o(onabort.callCount).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("calls in-element inner `m.layout` as initial on first render", function() {
					var onabort = o.spy()
					var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
					var component = createComponent({
						view: () => m("div", {id: "a"}, m.layout(layoutSpy), "b"),
					})

					render(root, m(component))

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
					var component = createComponent({
						view: () => m("div", {id: "a"}, m.layout(layoutSpy), "b"),
					})

					render(root, m(component))
					render(root, m(component))

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
					var component = createComponent({
						view: () => m("div", {id: "a"}, m.layout(layoutSpy), "b"),
					})

					render(root, m(component))
					render(root, null)

					o(layoutSpy.callCount).equals(1)
					o(layoutSpy.args[1].aborted).equals(true)
					o(onabort.callCount).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("aborts in-element inner `m.layout` signal after subsequent render", function() {
					var onabort = o.spy()
					var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
					var component = createComponent({
						view: () => m("div", {id: "a"}, m.layout(layoutSpy), "b"),
					})

					render(root, m(component))
					render(root, m(component))
					render(root, null)

					o(layoutSpy.callCount).equals(2)
					o(layoutSpy.args[1].aborted).equals(true)
					o(onabort.callCount).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("calls direct inner `m.layout` as initial on first render", function() {
					var onabort = o.spy()
					var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
					var component = createComponent({
						view: () => m.layout(layoutSpy),
					})

					render(root, m(component))

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
					var component = createComponent({
						view: () => m.layout(layoutSpy),
					})

					render(root, m(component))
					render(root, m(component))

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
					var component = createComponent({
						view: () => m.layout(layoutSpy),
					})

					render(root, m(component))
					render(root, null)

					o(layoutSpy.callCount).equals(1)
					o(layoutSpy.args[1].aborted).equals(true)
					o(onabort.callCount).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("aborts direct inner `m.layout` signal after subsequent render", function() {
					var onabort = o.spy()
					var layoutSpy = o.spy((_, signal) => { signal.onabort = onabort })
					var component = createComponent({
						view: () => m.layout(layoutSpy),
					})

					render(root, m(component))
					render(root, m(component))
					render(root, null)

					o(layoutSpy.callCount).equals(2)
					o(layoutSpy.args[1].aborted).equals(true)
					o(onabort.callCount).equals(1)
					o(root.childNodes.length).equals(0)
				})
				o("no recycling occurs (was: recycled components get a fresh state)", function() {
					var step = 0
					var firstState
					var view = o.spy(function(vnode) {
						if (step === 0) {
							firstState = vnode.state
						} else {
							o(vnode.state).notEquals(firstState)
						}
						return m("div")
					})
					var component = createComponent({view: view})

					render(root, [m("div", m.key(1, m(component)))])
					var child = root.firstChild.firstChild
					render(root, [])
					step = 1
					render(root, [m("div", m.key(1, m(component)))])

					o(child).notEquals(root.firstChild.firstChild) // this used to be a recycling pool test
					o(view.callCount).equals(2)
				})
			})
			o.spec("state", function() {
				o("initializes state", function() {
					var data = {a: 1}
					var component = createComponent({
						data: data,
						constructor: init,
						view: function() {
							return ""
						}
					})

					render(root, m(component))

					function init() {
						o(this.data).equals(data)
					}
				})
				o("state proxies to the component object/prototype", function() {
					var body = {a: 1}
					var data = [body]
					var component = createComponent({
						data: data,
						constructor: init,
						view: function() {
							return ""
						}
					})

					render(root, m(component))

					function init() {
						o(this.data).equals(data)
						o(this.data[0]).equals(body)
					}
				})
			})
		})
	})
	o.spec("Tests specific to certain component kinds", function() {
		o.spec("state", function() {
			o("Constructible", function() {
				var component = o.spy(function(vnode){
					o(vnode.state).equals(undefined)
				})
				var view = o.spy(function(){
					o(this instanceof component).equals(true)
					return ""
				})
				component.prototype.view = view

				render(root, [m(component)])
				render(root, [m(component)])
				render(root, [])

				o(component.callCount).equals(1)
				o(view.callCount).equals(2)
			})
			o("Closure", function() {
				var state
				var view = o.spy(function() {
					o(this).equals(state)
					return ""
				})
				var component = o.spy(function(vnode) {
					o(vnode.state).equals(undefined)
					return state = {
						view: view
					}
				})

				render(root, [m(component)])
				render(root, [m(component)])
				render(root, [])

				o(component.callCount).equals(1)
				o(view.callCount).equals(2)
			})
		})
	})
})
