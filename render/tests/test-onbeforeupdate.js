"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")

o.spec("onbeforeupdate", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("prevents update in element", function() {
		var onbeforeupdate = function() {return false}
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.attributes["id"].value).equals("a")
	})

	o("prevents update in fragment", function() {
		var onbeforeupdate = function() {return false}
		var vnode = fragment({onbeforeupdate: onbeforeupdate}, "a")
		var updated = fragment({onbeforeupdate: onbeforeupdate}, "b")

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.nodeValue).equals("a")
	})

	o("does not prevent update if returning true", function() {
		var onbeforeupdate = function() {return true}
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, vnode)
		render(root, updated)

		o(root.firstChild.attributes["id"].value).equals("b")
	})

	o("accepts arguments for comparison", function() {
		var count = 0
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, vnode)
		render(root, updated)

		function onbeforeupdate(vnode, old) {
			count++

			o(old.attrs.id).equals("a")
			o(vnode.attrs.id).equals("b")

			return old.attrs.id !== vnode.attrs.id
		}

		o(count).equals(1)
		o(root.firstChild.attributes["id"].value).equals("b")
	})

	o("is not called on creation", function() {
		var count = 0
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})

		render(root, vnode)

		function onbeforeupdate() {
			count++
			return true
		}

		o(count).equals(0)
	})

	o("is called only once on update", function() {
		var count = 0
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, vnode)
		render(root, updated)

		function onbeforeupdate() {
			count++
			return true
		}

		o(count).equals(1)
	})

	o("doesn't fire on recycled nodes", function() {
		var onbeforeupdate = o.spy()
		var vnodes = [m("div", {key: 1})]
		var temp = []
		var updated = [m("div", {key: 1, onbeforeupdate: onbeforeupdate})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(vnodes[0].dom).notEquals(updated[0].dom) // this used to be a recycling pool test
		o(updated[0].dom.nodeName).equals("DIV")
		o(onbeforeupdate.callCount).equals(0)
	})

	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o("prevents update in component", function() {
				var component = createComponent({
					onbeforeupdate: function() {return false},
					view: function(vnode) {
						return m("div", vnode.children)
					},
				})
				var vnode = m(component, "a")
				var updated = m(component, "b")

				render(root, vnode)
				render(root, updated)

				o(root.firstChild.firstChild.nodeValue).equals("a")
			})

			o("prevents update if returning false in component and false in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return false},
					view: function(vnode) {
						return m("div", {id: vnode.attrs.id})
					},
				})
				var vnode = m(component, {id: "a", onbeforeupdate: function() {return false}})
				var updated = m(component, {id: "b", onbeforeupdate: function() {return false}})

				render(root, vnode)
				render(root, updated)

				o(root.firstChild.attributes["id"].value).equals("a")
			})

			o("does not prevent update if returning true in component and true in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return true},
					view: function(vnode) {
						return m("div", {id: vnode.attrs.id})
					},
				})
				var vnode = m(component, {id: "a", onbeforeupdate: function() {return true}})
				var updated = m(component, {id: "b", onbeforeupdate: function() {return true}})

				render(root, vnode)
				render(root, updated)

				o(root.firstChild.attributes["id"].value).equals("b")
			})

			o("prevents update if returning false in component but true in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return false},
					view: function(vnode) {
						return m("div", {id: vnode.attrs.id})
					},
				})
				var vnode = m(component, {id: "a", onbeforeupdate: function() {return true}})
				var updated = m(component, {id: "b", onbeforeupdate: function() {return true}})

				render(root, vnode)
				render(root, updated)

				o(root.firstChild.attributes["id"].value).equals("a")
			})

			o("prevents update if returning true in component but false in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return true},
					view: function(vnode) {
						return m("div", {id: vnode.attrs.id})
					},
				})
				var vnode = m(component, {id: "a", onbeforeupdate: function() {return false}})
				var updated = m(component, {id: "b", onbeforeupdate: function() {return false}})

				render(root, vnode)
				render(root, updated)

				o(root.firstChild.attributes["id"].value).equals("a")
			})

			o("does not prevent update if returning true from component", function() {
				var component = createComponent({
					onbeforeupdate: function() {return true},
					view: function(vnode) {
						return m("div", vnode.attrs)
					},
				})
				var vnode = m(component, {id: "a"})
				var updated = m(component, {id: "b"})

				render(root, vnode)
				render(root, updated)

				o(root.firstChild.attributes["id"].value).equals("b")
			})

			o("accepts arguments for comparison in component", function() {
				var component = createComponent({
					onbeforeupdate: onbeforeupdate,
					view: function(vnode) {
						return m("div", vnode.attrs)
					},
				})
				var count = 0
				var vnode = m(component, {id: "a"})
				var updated = m(component, {id: "b"})

				render(root, vnode)
				render(root, updated)

				function onbeforeupdate(vnode, old) {
					count++

					o(old.attrs.id).equals("a")
					o(vnode.attrs.id).equals("b")

					return old.attrs.id !== vnode.attrs.id
				}

				o(count).equals(1)
				o(root.firstChild.attributes["id"].value).equals("b")
			})

			o("is not called on component creation", function() {
				createComponent({
					onbeforeupdate: onbeforeupdate,
					view: function(vnode) {
						return m("div", vnode.attrs)
					},
				})

				var count = 0
				var vnode = m("div", {id: "a"})

				render(root, vnode)

				function onbeforeupdate() {
					count++
					return true
				}

				o(count).equals(0)
			})

			o("is called only once on component update", function() {
				var component = createComponent({
					onbeforeupdate: onbeforeupdate,
					view: function(vnode) {
						return m("div", vnode.attrs)
					},
				})

				var count = 0
				var vnode = m(component, {id: "a"})
				var updated = m(component, {id: "b"})

				render(root, vnode)
				render(root, updated)

				function onbeforeupdate() {
					count++
					return true
				}

				o(count).equals(1)
			})
		})
	})

	// https://github.com/MithrilJS/mithril.js/issues/2067
	o.spec("after prevented update", function() {
		o("old attributes are retained", function() {
			render(root, [
				m("div", {"id": "foo", onbeforeupdate: function() { return true }})
			])
			render(root, [
				m("div", {"id": "bar", onbeforeupdate: function() { return false }})
			])
			render(root, [
				m("div", {"id": "bar", onbeforeupdate: function() { return true }})
			])
			o(root.firstChild.attributes["id"].value).equals("bar")
		})
		o("old children is retained", function() {
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m("div")
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return false }},
					m("div", m("div"))
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m("div", m("div"))
				)
			)
			o(root.firstChild.firstChild.childNodes.length).equals(1)
		})
		o("old text is retained", function() {
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m("div")
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return false }},
					m("div", "foo")
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m("div", "foo")
				)
			)
			o(root.firstChild.firstChild.firstChild.nodeValue).equals("foo")
		})
		o("updating component children doesn't error", function() {
			var Child = {
				view(v) {
					return m("div",
						v.attrs.foo ? m("div") : null
					)
				}
			}

			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m(Child, {foo: false})
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return false }},
					m(Child, {foo: false})
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m(Child, {foo: true})
				)
			)
			o(root.firstChild.firstChild.childNodes.length).equals(1)
		})
		o("adding dom children doesn't error", function() {
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m("div")
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return false }},
					m("div")
				)
			)
			render(root,
				m("div", {onbeforeupdate: function() { return true }},
					m("div", m("div"))
				)
			)
			o(root.firstChild.firstChild.childNodes.length).equals(1)
		})
	})
})
