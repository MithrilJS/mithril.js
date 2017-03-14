"use strict"

var o = require("../../ospec/ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("onbeforeupdate", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("prevents update in element", function() {
		var onbeforeupdate = function() {return false}
		var vnode = {tag: "div", attrs: {id: "a", onbeforeupdate: onbeforeupdate}}
		var updated = {tag: "div", attrs: {id: "b", onbeforeupdate: onbeforeupdate}}

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("a")
	})

	o("prevents update in text", function() {
		var onbeforeupdate = function() {return false}
		var vnode = {tag: "#", attrs: {onbeforeupdate: onbeforeupdate}, children: "a"}
		var updated = {tag: "#", attrs: {onbeforeupdate: onbeforeupdate}, children: "b"}

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.nodeValue).equals("a")
	})

	o("prevents update in html", function() {
		var onbeforeupdate = function() {return false}
		var vnode = {tag: "<", attrs: {onbeforeupdate: onbeforeupdate}, children: "a"}
		var updated = {tag: "<", attrs: {onbeforeupdate: onbeforeupdate}, children: "b"}

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.nodeValue).equals("a")
	})

	o("prevents update in fragment", function() {
		var onbeforeupdate = function() {return false}
		var vnode = {tag: "[", attrs: {onbeforeupdate: onbeforeupdate}, children: [{tag: "#", children: "a"}]}
		var updated = {tag: "[", attrs: {onbeforeupdate: onbeforeupdate}, children: [{tag: "#", children: "b"}]}

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.nodeValue).equals("a")
	})

	o("does not prevent update if returning true", function() {
		var onbeforeupdate = function() {return true}
		var vnode = {tag: "div", attrs: {id: "a", onbeforeupdate: onbeforeupdate}}
		var updated = {tag: "div", attrs: {id: "b", onbeforeupdate: onbeforeupdate}}

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("accepts arguments for comparison", function() {
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a", onbeforeupdate: onbeforeupdate}}
		var updated = {tag: "div", attrs: {id: "b", onbeforeupdate: onbeforeupdate}}

		render(root, [vnode])
		render(root, [updated])

		function onbeforeupdate(vnode, old) {
			count++

			o(old.attrs.id).equals("a")
			o(vnode.attrs.id).equals("b")

			return old.attrs.id !== vnode.attrs.id
		}

		o(count).equals(1)
		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("is not called on creation", function() {
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a", onbeforeupdate: onbeforeupdate}}

		render(root, [vnode])

		function onbeforeupdate() {
			count++
			return true
		}

		o(count).equals(0)
	})

	o("is called only once on update", function() {
		var count = 0
		var vnode = {tag: "div", attrs: {id: "a", onbeforeupdate: onbeforeupdate}}
		var updated = {tag: "div", attrs: {id: "b", onbeforeupdate: onbeforeupdate}}

		render(root, [vnode])
		render(root, [updated])

		function onbeforeupdate() {
			count++
			return true
		}

		o(count).equals(1)
	})

	o("doesn't fire on recycled nodes", function() {
		var onbeforeupdate = o.spy()
		var vnodes = [{tag: "div", key: 1}]
		var temp = []
		var updated = [{tag: "div", key: 1, attrs: {onbeforeupdate: onbeforeupdate}}]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(vnodes[0].dom).equals(updated[0].dom)
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
						return {tag: "div", children: vnode.children}
					},
				})
				var vnode = {tag: component, children: [{tag: "#", children: "a"}]}
				var updated = {tag: component, children: [{tag: "#", children: "b"}]}

				render(root, [vnode])
				render(root, [updated])

				o(root.firstChild.firstChild.nodeValue).equals("a")
			})

			o("prevents update if returning false in component and false in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return false},
					view: function(vnode) {
						return {tag: "div", attrs: {id: vnode.attrs.id}}
					},
				})
				var vnode = {tag: component, attrs: {id: "a", onbeforeupdate: function() {return false}}}
				var updated = {tag: component, attrs: {id: "b", onbeforeupdate: function() {return false}}}

				render(root, [vnode])
				render(root, [updated])

				o(root.firstChild.attributes["id"].nodeValue).equals("a")
			})

			o("does not prevent update if returning true in component and true in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return true},
					view: function(vnode) {
						return {tag: "div", attrs: {id: vnode.attrs.id}}
					},
				})
				var vnode = {tag: component, attrs: {id: "a", onbeforeupdate: function() {return true}}}
				var updated = {tag: component, attrs: {id: "b", onbeforeupdate: function() {return true}}}

				render(root, [vnode])
				render(root, [updated])

				o(root.firstChild.attributes["id"].nodeValue).equals("b")
			})

			o("does not prevent update if returning false in component but true in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return false},
					view: function(vnode) {
						return {tag: "div", attrs: {id: vnode.attrs.id}}
					},
				})
				var vnode = {tag: component, attrs: {id: "a", onbeforeupdate: function() {return true}}}
				var updated = {tag: component, attrs: {id: "b", onbeforeupdate: function() {return true}}}

				render(root, [vnode])
				render(root, [updated])

				o(root.firstChild.attributes["id"].nodeValue).equals("b")
			})

			o("does not prevent update if returning true in component but false in vnode", function() {
				var component = createComponent({
					onbeforeupdate: function() {return true},
					view: function(vnode) {
						return {tag: "div", attrs: {id: vnode.attrs.id}}
					},
				})
				var vnode = {tag: component, attrs: {id: "a", onbeforeupdate: function() {return false}}}
				var updated = {tag: component, attrs: {id: "b", onbeforeupdate: function() {return false}}}

				render(root, [vnode])
				render(root, [updated])

				o(root.firstChild.attributes["id"].nodeValue).equals("b")
			})

			o("does not prevent update if returning true from component", function() {
				var component = createComponent({
					onbeforeupdate: function() {return true},
					view: function(vnode) {
						return {tag: "div", attrs: vnode.attrs}
					},
				})
				var vnode = {tag: component, attrs: {id: "a"}}
				var updated = {tag: component, attrs: {id: "b"}}

				render(root, [vnode])
				render(root, [updated])

				o(root.firstChild.attributes["id"].nodeValue).equals("b")
			})

			o("accepts arguments for comparison in component", function() {
				var component = createComponent({
					onbeforeupdate: onbeforeupdate,
					view: function(vnode) {
						return {tag: "div", attrs: vnode.attrs}
					},
				})
				var count = 0
				var vnode = {tag: component, attrs: {id: "a"}}
				var updated = {tag: component, attrs: {id: "b"}}

				render(root, [vnode])
				render(root, [updated])

				function onbeforeupdate(vnode, old) {
					count++

					o(old.attrs.id).equals("a")
					o(vnode.attrs.id).equals("b")

					return old.attrs.id !== vnode.attrs.id
				}

				o(count).equals(1)
				o(root.firstChild.attributes["id"].nodeValue).equals("b")
			})

			o("is not called on component creation", function() {
				createComponent({
					onbeforeupdate: onbeforeupdate,
					view: function(vnode) {
						return {tag: "div", attrs: vnode.attrs}
					},
				})

				var count = 0
				var vnode = {tag: "div", attrs: {id: "a"}}

				render(root, [vnode])

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
						return {tag: "div", attrs: vnode.attrs}
					},
				})

				var count = 0
				var vnode = {tag: component, attrs: {id: "a"}}
				var updated = {tag: component, attrs: {id: "b"}}

				render(root, [vnode])
				render(root, [updated])

				function onbeforeupdate() {
					count++
					return true
				}

				o(count).equals(1)
			})
		})
	})
})
