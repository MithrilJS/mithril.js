"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("component", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")

		render = vdom($window).render
	})

	o.spec("basics", function() {
		o("works", function() {
			var component = {
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			}
			var node = {tag: component}

			render(root, [node])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("receives arguments", function() {
			var component = {
				view: function(vnode) {
					return {tag: "div", attrs: vnode.attrs, text: vnode.text}
				}
			}
			var node = {tag: component, attrs: {id: "a"}, text: "b"}

			render(root, [node])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("updates", function() {
			var component = {
				view: function(vnode) {
					return {tag: "div", attrs: vnode.attrs, text: vnode.text}
				}
			}
			render(root, [{tag: component, attrs: {id: "a"}, text: "b"}])
			render(root, [{tag: component, attrs: {id: "c"}, text: "d"}])

			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("c")
			o(root.firstChild.firstChild.nodeValue).equals("d")
		})
		o("updates root from null", function() {
			var visible = false
			var component = {
				view: function(vnode) {
					return visible ? {tag: "div"} : null
				}
			}
			render(root, [{tag: component}])
			visible = true
			render(root, [{tag: component}])

			o(root.firstChild.nodeName).equals("DIV")
		})
		o("updates root from primitive", function() {
			var visible = false
			var component = {
				view: function(vnode) {
					return visible ? {tag: "div"} : false
				}
			}
			render(root, [{tag: component}])
			visible = true
			render(root, [{tag: component}])

			o(root.firstChild.nodeName).equals("DIV")
		})
		o("updates root to null", function() {
			var visible = true
			var component = {
				view: function(vnode) {
					return visible ? {tag: "div"} : null
				}
			}
			render(root, [{tag: component}])
			visible = false
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("updates root to primitive", function() {
			var visible = true
			var component = {
				view: function(vnode) {
					return visible ? {tag: "div"} : false
				}
			}
			render(root, [{tag: component}])
			visible = false
			render(root, [{tag: component}])

			o(root.firstChild.nodeValue).equals("")
		})
		o("updates root from null to null", function() {
			var component = {
				view: function(vnode) {
					return null
				}
			}
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("removes", function() {
			var component = {
				view: function(vnode) {
					return {tag: "div"}
				}
			}
			var div = {tag: "div", key: 2}
			render(root, [{tag: component, key: 1}, div])
			render(root, [{tag: "div", key: 2}])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
		o("svg works when creating across component boundary", function() {
			var component = {
				view: function(vnode) {
					return {tag: "g"}
				}
			}
			render(root, [{tag: "svg", children: [{tag: component}]}])

			o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
		o("svg works when updating across component boundary", function() {
			var component = {
				view: function(vnode) {
					return {tag: "g"}
				}
			}
			render(root, [{tag: "svg", children: [{tag: component}]}])
			render(root, [{tag: "svg", children: [{tag: component}]}])

			o(root.firstChild.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		})
	})
	o.spec("return value", function() {
		o("can return fragments", function() {
			var component = {
				view: function(vnode) {
					return [
						{tag: "label"},
						{tag: "input"},
					]
				}
			}
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("LABEL")
			o(root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can return string", function() {
			var component = {
				view: function(vnode) {
					return "a"
				}
			}
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("a")
		})
		o("can return falsy string", function() {
			var component = {
				view: function(vnode) {
					return ""
				}
			}
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("")
		})
		o("can return number", function() {
			var component = {
				view: function(vnode) {
					return 1
				}
			}
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("1")
		})
		o("can return falsy number", function() {
			var component = {
				view: function(vnode) {
					return 0
				}
			}
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("0")
		})
		o("can return boolean", function() {
			var component = {
				view: function(vnode) {
					return true
				}
			}
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("true")
		})
		o("can return falsy boolean", function() {
			var component = {
				view: function(vnode) {
					return false
				}
			}
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("")
		})
		o("can return null", function() {
			var component = {
				view: function(vnode) {
					return null
				}
			}
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("can return undefined", function() {
			var component = {
				view: function(vnode) {
					return undefined
				}
			}
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("throws a custom error if it returns itself", function() {
			// A view that returns its vnode would otherwise trigger an infinite loop
			var component = {
				view: function(vnode) {
					return vnode
				}
			}
			try {
				render(root, [{tag: component}])
			}
			catch (e) {
				o(e instanceof Error).equals(true)
				// Call stack exception is a RangeError
				o(e instanceof RangeError).equals(false)
			}
		})
		o("can update when returning fragments", function() {
			var component = {
				view: function(vnode) {
					return [
						{tag: "label"},
						{tag: "input"},
					]
				}
			}
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("LABEL")
			o(root.childNodes[1].nodeName).equals("INPUT")
		})
		o("can update when returning primitive", function() {
			var component = {
				view: function(vnode) {
					return "a"
				}
			}
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.firstChild.nodeType).equals(3)
			o(root.firstChild.nodeValue).equals("a")
		})
		o("can update when returning null", function() {
			var component = {
				view: function(vnode) {
					return null
				}
			}
			render(root, [{tag: component}])
			render(root, [{tag: component}])

			o(root.childNodes.length).equals(0)
		})
		o("can remove when returning fragments", function() {
			var component = {
				view: function(vnode) {
					return [
						{tag: "label"},
						{tag: "input"},
					]
				}
			}
			var div = {tag: "div", key: 2}
			render(root, [{tag: component, key: 1}, div])

			render(root, [{tag: "div", key: 2}])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
		o("can remove when returning primitive", function() {
			var component = {
				view: function(vnode) {
					return "a"
				}
			}
			var div = {tag: "div", key: 2}
			render(root, [{tag: component, key: 1}, div])

			render(root, [{tag: "div", key: 2}])

			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(div.dom)
		})
	})
	o.spec("lifecycle", function() {
		o("calls oninit", function() {
			var called = 0
			var component = {
				oninit: function(vnode) {
					called++

					o(vnode.tag).equals(component)
					o(vnode.dom).equals(undefined)
					o(root.childNodes.length).equals(0)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			}
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls oninit when returning fragment", function() {
			var called = 0
			var component = {
				oninit: function(vnode) {
					called++

					o(vnode.tag).equals(component)
					o(vnode.dom).equals(undefined)
					o(root.childNodes.length).equals(0)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			}
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
				tag: {
					view: function() {
						viewCalled = true
						return [{tag: "div", attrs: {id: "a"}, text: "b"}]
					},
					oninit: function(vnode) {
						o(viewCalled).equals(false)
					},
				}
			})
		})
		o("does not calls oninit on redraw", function() {
			var init = o.spy()
			var component = {
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
				oninit: init,
			}

			function view() {
				return {tag: component}
			}

			render(root, view())
			render(root, view())

			o(init.callCount).equals(1)
		})
		o("calls oncreate", function() {
			var called = 0
			var component = {
				oncreate: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			}
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("does not calls oncreate on redraw", function() {
			var create = o.spy()
			var component = {
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				},
				oncreate: create,
			}

			function view() {
				return {tag: component}
			}

			render(root, view())
			render(root, view())

			o(create.callCount).equals(1)
		})
		o("calls oncreate when returning fragment", function() {
			var called = 0
			var component = {
				oncreate: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			}
			var node = {tag: component}

			render(root, [node])

			o(called).equals(1)
			o(root.firstChild.nodeName).equals("DIV")
			o(root.firstChild.attributes["id"].nodeValue).equals("a")
			o(root.firstChild.firstChild.nodeValue).equals("b")
		})
		o("calls onupdate", function() {
			var called = 0
			var component = {
				onupdate: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			}

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
			var component = {
				onupdate: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			}

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
			var component = {
				onremove: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			}

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls onremove when returning fragment", function() {
			var called = 0
			var component = {
				onremove: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			}

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls onbeforeremove", function() {
			var called = 0
			var component = {
				onbeforeremove: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return {tag: "div", attrs: {id: "a"}, text: "b"}
				}
			}

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("calls onbeforeremove when returning fragment", function() {
			var called = 0
			var component = {
				onbeforeremove: function(vnode) {
					called++

					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
				},
				view: function() {
					return [{tag: "div", attrs: {id: "a"}, text: "b"}]
				}
			}

			render(root, [{tag: component}])

			o(called).equals(0)

			render(root, [])

			o(called).equals(1)
			o(root.childNodes.length).equals(0)
		})
		o("does not recycle when there's an onupdate", function() {
			var component = {
				onupdate: function() {},
				view: function() {
					return {tag: "div"}
				}
			}
			var update = o.spy()
			var vnode = {tag: component, key: 1}
			var updated = {tag: component, key: 1}

			render(root, [vnode])
			render(root, [])
			render(root, [updated])

			o(vnode.dom).notEquals(updated.dom)
		})
	})
	o.spec("state", function() {
		o("copies state", function() {
			var called = 0
			var data = {a: 1}
			var component = {
				data: data,
				oninit: init,
				view: function() {
					return ""
				}
			}

			render(root, [{tag: component}])

			function init(vnode) {
				o(vnode.state.data).deepEquals(data)
				o(vnode.state.data).equals(data)

				//inherits state via prototype
				component.x = 1
				o(vnode.state.x).equals(1)
			}
		})
		o("state copy is shallow", function() {
			var called = 0
			var body = {a: 1}
			var data = [body]
			var component = {
				data: data,
				oninit: init,
				view: function() {
					return ""
				}
			}

			render(root, [{tag: component}])

			function init(vnode) {
				o(vnode.state.data).equals(data)
				o(vnode.state.data[0]).equals(body)
			}
		})
	})
	o.spec("Alternative ways to specify componenents", function() {
		o("Classes can be used as components", function() {
			function MyComponent(vnode){
				o(vnode.state).equals(null)
			}
			var proto = MyComponent.prototype

			var context

			proto.oninit = o.spy(function(vnode) {
				o(this).equals(vnode.state)
				context = this
			})
			proto.oncreate = o.spy()
			proto.onbeforeupdate = o.spy()
			proto.onupdate = o.spy()
			proto.onbeforeremove = o.spy()
			proto.onremove = o.spy()
			proto.view = o.spy(function() {
				return ""
			})

			render(root, [{tag: MyComponent}])

			o(context instanceof MyComponent).equals(true)

			o(proto.view.callCount).equals(1)
			o(proto.oncreate.callCount).equals(1)
			o(proto.onbeforeupdate.callCount).equals(0)
			o(proto.onupdate.callCount).equals(0)
			o(proto.onbeforeremove.callCount).equals(0)
			o(proto.onremove.callCount).equals(0)

			render(root, [{tag: MyComponent}])

			o(proto.view.callCount).equals(2)
			o(proto.oncreate.callCount).equals(1)
			o(proto.onbeforeupdate.callCount).equals(1)
			o(proto.onupdate.callCount).equals(1)
			o(proto.onbeforeremove.callCount).equals(0)
			o(proto.onremove.callCount).equals(0)

			render(root, [])

			o(proto.view.callCount).equals(2)
			o(proto.oncreate.callCount).equals(1)
			o(proto.onbeforeupdate.callCount).equals(1)
			o(proto.onupdate.callCount).equals(1)
			o(proto.onbeforeremove.callCount).equals(1)
			o(proto.onremove.callCount).equals(1)

			o(proto.oninit.this).equals(context)
			o(proto.view.this).equals(context)
			o(proto.oncreate.this).equals(context)
			o(proto.onbeforeupdate.this).equals(context)
			o(proto.onupdate.this).equals(context)
			o(proto.onbeforeremove.this).equals(context)
			o(proto.onremove.this).equals(context)

			o(proto.oninit.args.length).equals(1)
			o(proto.view.args.length).equals(1)
			o(proto.oncreate.args.length).equals(1)
			o(proto.onbeforeupdate.args.length).equals(2)
			o(proto.onupdate.args.length).equals(1)
			o(proto.onbeforeremove.args.length).equals(1)
			o(proto.onremove.args.length).equals(1)
		})
		o("Factory functions can be used as components", function() {
			var state, context
			function component(vnode) {
				o(vnode.state).equals(null)

				return state = {
					oninit: o.spy(function(vnode) {
						o(this).equals(vnode.state)
						context = this
					}),
					oncreate: o.spy(),
					onbeforeupdate: o.spy(),
					onupdate: o.spy(),
					onbeforeremove: o.spy(),
					onremove: o.spy(),
					view: o.spy(function() {
						return ""
					})
				}
			}

			render(root, [{tag: component}])

			o(state).equals(context)

			o(state.oninit.callCount).equals(1)
			o(state.view.callCount).equals(1)
			o(state.oncreate.callCount).equals(1)
			o(state.onbeforeupdate.callCount).equals(0)
			o(state.onupdate.callCount).equals(0)
			o(state.onbeforeremove.callCount).equals(0)
			o(state.onremove.callCount).equals(0)

			render(root, [{tag: component}])

			o(state.oninit.callCount).equals(1)
			o(state.view.callCount).equals(2)
			o(state.oncreate.callCount).equals(1)
			o(state.onbeforeupdate.callCount).equals(1)
			o(state.onupdate.callCount).equals(1)
			o(state.onbeforeremove.callCount).equals(0)
			o(state.onremove.callCount).equals(0)

			render(root, [])

			o(state.oninit.callCount).equals(1)
			o(state.view.callCount).equals(2)
			o(state.oncreate.callCount).equals(1)
			o(state.onbeforeupdate.callCount).equals(1)
			o(state.onupdate.callCount).equals(1)
			o(state.onbeforeremove.callCount).equals(1)
			o(state.onremove.callCount).equals(1)

			o(state.oninit.this).equals(state)
			o(state.view.this).equals(state)
			o(state.oncreate.this).equals(state)
			o(state.onbeforeupdate.this).equals(state)
			o(state.onupdate.this).equals(state)
			o(state.onbeforeremove.this).equals(state)
			o(state.onremove.this).equals(state)

			o(state.oninit.args.length).equals(1)
			o(state.view.args.length).equals(1)
			o(state.oncreate.args.length).equals(1)
			o(state.onbeforeupdate.args.length).equals(2)
			o(state.onupdate.args.length).equals(1)
			o(state.onbeforeremove.args.length).equals(1)
			o(state.onremove.args.length).equals(1)
		})
	})
})
