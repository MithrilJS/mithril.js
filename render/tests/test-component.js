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
			o(root.firstChild.nodeValue).equals("false")
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
				onbeforeremove: function(vnode, done) {
					called++
					
					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
					
					done()
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
				onbeforeremove: function(vnode, done) {
					called++
					
					o(vnode.dom).notEquals(undefined)
					o(vnode.dom).equals(root.firstChild)
					o(root.childNodes.length).equals(1)
					
					done()
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
	})
})