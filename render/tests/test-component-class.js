"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("component class", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	function create(props) {
		var C = props.constructor
		if (C === Object) C = function C() {}
		delete props.constructor

		Object.keys(props).forEach(function(prop) {
			var desc = Object.getOwnPropertyDescriptor(props, prop)
			desc.enumerable = false
			Object.defineProperty(C.prototype, prop, desc)
		})

		return C
	}

	o.spec("basics", function() {
		o("works", function() {
			var component = create({
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("receives arguments", function() {
			var component = create({
				view: function(vnode) {
					return {tag: "div", attrs: vnode.attrs, text: vnode.text}
				}
			})
			var node = {tag: component, attrs: {id: "a"}, text: "b"}

			render(root, [node])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("updates", function() {
			var component = create({
				view: function(vnode) {
					return {tag: "div", attrs: vnode.attrs, text: vnode.text}
				}
			})
			render(root, [{tag: component, attrs: {id: "a"}, text: "b"}])
			render(root, [{tag: component, attrs: {id: "c"}, text: "d"}])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("c")
			o(root.firstChild.firstChild.nodeValue).equals("d")
		})
		o("removes", function() {
			var component = create({
				view: function(vnode) {
					return {tag: "div"}
				}
			})
			var div = {tag: "div", key: 2}
			render(root, [{tag: component, key: 1}, div])
			render(root, [{tag: "div", key: 2}])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
		o("svg works when creating across component boundary", function() {
			var component = create({
				view: function(vnode) {
					return {tag: "g"}
				}
			})
			render(root, [{tag: "svg", children: [{tag: component}]}])

			o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
		o("svg works when updating across component boundary", function() {
			var component = create({
				view: function(vnode) {
					return {tag: "g"}
				}
			})
			render(root, [{tag: "svg", children: [{tag: component}]}])
			render(root, [{tag: "svg", children: [{tag: component}]}])

			o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
	})
	o.spec("return value", function() {
		o("can return fragments", function() {
			var component = create({
				view: function(vnode) {
					return [
						{tag: "label"},
						{tag: "input"},
					]
				}
			})
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("LABEL")
			o(root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can return string", function() {
			var component = create({
				view: function(vnode) {
					return "a"
				}
			})
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("a")
		})
		o("can return falsy string", function() {
			var component = create({
				view: function(vnode) {
					return ""
				}
			})
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("")
		})
		o("can return number", function() {
			var component = create({
				view: function(vnode) {
					return 1
				}
			})
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("1")
		})
		o("can return falsy number", function() {
			var component = create({
				view: function(vnode) {
					return 0
				}
			})
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("0")
		})
		o("can return boolean", function() {
			var component = create({
				view: function(vnode) {
					return true
				}
			})
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("true")
		})
		o("can return falsy boolean", function() {
			var component = create({
				view: function(vnode) {
					return false
				}
			})
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("false")
		})
		o("can return null", function() {
			var component = create({
				view: function(vnode) {
					return null
				}
			})
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("can return undefined", function() {
			var component = create({
				view: function(vnode) {
					return undefined
				}
			})
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("can update when returning fragments", function() {
			var component = create({
				view: function(vnode) {
					return [
						{tag: "label"},
						{tag: "input"},
					]
				}
			})
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("LABEL")
			o(root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can update when returning primitive", function() {
			var component = create({
				view: function(vnode) {
					return "a"
				}
			})
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("a")
		})
		o("can update when returning null", function() {
			var component = create({
				view: function(vnode) {
					return null
				}
			})
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("can remove when returning fragments", function() {
			var component = create({
				view: function(vnode) {
					return [
						{tag: "label"},
						{tag: "input"},
					]
				}
			})
			var div = {tag: "div", key: 2}
			render(root, [{tag: component, key: 1}, div])

			render(root, [{tag: "div", key: 2}])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
		o("can remove when returning primitive", function() {
			var component = create({
				view: function(vnode) {
					return "a"
				}
			})
			var div = {tag: "div", key: 2}
			render(root, [{tag: component, key: 1}, div])

			render(root, [{tag: "div", key: 2}])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
	})
	o.spec("lifecycle", function() {
		o("calls constructor", function() {
			var called = 0
			var component = create({
				constructor: function(vnode) {
					called++

					o(vnode.tag).equals(component)
					o(vnode.dom).equals(undefined)
					o(root.childNodes.length).equals(0)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls constructor when returning fragment", function() {
			var called = 0
			var component = create({
				constructor: function(vnode) {
					called++

					o(vnode.tag).equals(component)
					o(vnode.dom).equals(undefined)
					o(root.childNodes.length).equals(0)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls constructor before view", function() {
			var viewCalled = false

			render(root, {
				tag: create({
					constructor: function(vnode) {
						o(viewCalled).equals(false)
					},
					view: function() {
						viewCalled = true
						return [{tag: "div", attrs: {id: "a"}, text: "b"}]
					},
				})
			})
		})
		o("calls constructor with new", function() {
			var component = create({
				constructor: function(vnode) {
					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(undefined)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
			})
			render(root, {tag: component})
		})
		o("calls view on instance", function() {
			var component = create({
				view: function(vnode) {
					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
			})
			render(root, {tag: component})
		})
		o("does not call constructor on redraw", function() {
			var init = o.spy()
			var component = create({
				constructor: init,
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
			})

			function view() {
				return {tag: component}
			}

			render(root, view())
			render(root, view())

			o(init.callCount).equals(1)
		})
		o("calls oninit", function() {
			var called = 0
			var component = create({
				oninit: function(vnode) {
					called++

					o(vnode.tag).equals(component)
					o(vnode.dom).equals(undefined)
					o(root.childNodes.length).equals(0)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls oninit when returning fragment", function() {
			var called = 0
			var component = create({
				oninit: function(vnode) {
					called++

					o(vnode.tag).equals(component)
					o(vnode.dom).equals(undefined)
					o(root.childNodes.length).equals(0)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls oninit before view", function() {
			var viewCalled = false

			render(root, {
				tag: create({
					oninit: function(vnode) {
						o(viewCalled).equals(false)
					},
					view: function() {
						viewCalled = true
						return [{tag: "div", attrs: {id: "a"}, text: "b"}]
					},
				})
			})
		})
		o("does not call oninit on redraw", function() {
			var init = o.spy()
			var component = create({
				oninit: init,
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
			})

			function view() {
				return {tag: component}
			}

			render(root, view())
			render(root, view())

			o(init.callCount).equals(1)
		})
		o("calls oncreate", function() {
			var called = 0
			var component = create({
				oncreate: function(vnode) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("does not calls oncreate on redraw", function() {
			var oncreate = o.spy()
			var component = create({
				oncreate: oncreate,
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
			})

			function view() {
				return {tag: component}
			}

			render(root, view())
			render(root, view())

			o(oncreate.callCount).equals(1)
		})
		o("calls oncreate when returning fragment", function() {
			var called = 0
			var component = create({
				oncreate: function(vnode) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			})
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls onupdate", function() {
			var called = 0
			var component = create({
				onupdate: function(vnode) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [{tag: component}])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls onupdate when returning fragment", function() {
			var called = 0
			var component = create({
				onupdate: function(vnode) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			})

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [{tag: component}])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls onremove", function() {
			var called = 0
			var component = create({
				onremove: function(vnode) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls onremove when returning fragment", function() {
			var called = 0
			var component = create({
				onremove: function(vnode) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			})

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls onbeforeremove", function() {
			var called = 0
			var component = create({
				onbeforeremove: function(vnode, done) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)

					done()
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			})

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls onbeforeremove when returning fragment", function() {
			var called = 0
			var component = create({
				onbeforeremove: function(vnode, done) {
					called++

					o(Object.getPrototypeOf(this)).equals(component.prototype)
					o(vnode.state).equals(this)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)

					done()
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			})

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("does not recycle when there's an onupdate", function() {
			var component = create({
				onupdate: function() {},
				view: function() {
					return {tag: "div"}
				}
			})
			var update = o.spy()
			var vnode = {tag: component, key: 1}
			var updated = {tag: component, key: 1}

			render(root, [vnode])
			render(root, [])
			render(root, [updated])

			o(vnode.dom).notEquals(updated.dom)
		})
	})
})
