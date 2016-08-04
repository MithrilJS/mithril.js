"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
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
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("a")
	})

	o("prevents update in text", function() {
		var onbeforeupdate = function() {return false}
		var vnode = m("#", {onbeforeupdate: onbeforeupdate}, "a")
		var updated = m("#", {onbeforeupdate: onbeforeupdate}, "b")

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.nodeValue).equals("a")
	})

	o("prevents update in html", function() {
		var onbeforeupdate = function() {return false}
		var vnode = m("<", {onbeforeupdate: onbeforeupdate}, "a")
		var updated = m("<", {onbeforeupdate: onbeforeupdate}, "b")

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.nodeValue).equals("a")
	})

	o("prevents update in fragment", function() {
		var onbeforeupdate = function() {return false}
		var vnode = m("[", {onbeforeupdate: onbeforeupdate}, [m("#", "a")])
		var updated = m("[", {onbeforeupdate: onbeforeupdate}, [m("#", "b")])

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.nodeValue).equals("a")
	})

	o("prevents update in component", function() {
		var component = {
			onbeforeupdate: function() {return false},
			view: function(vnode) {
				return m("div", vnode.children)
			},
		}
		var vnode = m(component, [m("#", "a")])
		var updated = m(component, [m("#", "b")])

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.firstChild.nodeValue).equals("a")
	})

	o("prevents update if returning false in component and false in vnode", function() {
		var component = {
			onbeforeupdate: function() {return false},
			view: function(vnode) {
				return m("div", {id: vnode.attrs.id})
			},
		}
		var vnode = m(component, {id: "a", onbeforeupdate: function() {return false}})
		var updated = m(component, {id: "b", onbeforeupdate: function() {return false}})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("a")
	})

	o("does not prevent update if returning true in component and true in vnode", function() {
		var component = {
			onbeforeupdate: function() {return true},
			view: function(vnode) {
				return m("div", {id: vnode.attrs.id})
			},
		}
		var vnode = m(component, {id: "a", onbeforeupdate: function() {return true}})
		var updated = m(component, {id: "b", onbeforeupdate: function() {return true}})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("does not prevent update if returning false in component but true in vnode", function() {
		var component = {
			onbeforeupdate: function() {return false},
			view: function(vnode) {
				return m("div", {id: vnode.attrs.id})
			},
		}
		var vnode = m(component, {id: "a", onbeforeupdate: function() {return true}})
		var updated = m(component, {id: "b", onbeforeupdate: function() {return true}})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("does not prevent update if returning true in component but false in vnode", function() {
		var component = {
			onbeforeupdate: function() {return true},
			view: function(vnode) {
				return m("div", {id: vnode.attrs.id})
			},
		}
		var vnode = m(component, {id: "a", onbeforeupdate: function() {return false}})
		var updated = m(component, {id: "b", onbeforeupdate: function() {return false}})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("does not prevent update if returning true", function() {
		var onbeforeupdate = function() {return true}
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("does not prevent update if returning true from component", function() {
		var component = {
			onbeforeupdate: function() {return true},
			view: function(vnode) {
				return m("div", vnode.attrs)
			},
		}
		var vnode = m(component, {id: "a"})
		var updated = m(component, {id: "b"})

		render(root, [vnode])
		render(root, [updated])

		o(root.firstChild.attributes["id"].nodeValue).equals("b")
	})

	o("accepts arguments for comparison", function() {
		var count = 0
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

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

	o("accepts arguments for comparison in component", function() {
		var component = {
			onbeforeupdate: onbeforeupdate,
			view: function(vnode) {
				return m("div", vnode.attrs)
			},
		}
		var count = 0
		var vnode = m(component, {id: "a"})
		var updated = m(component, {id: "b"})

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
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, [vnode])

		function onbeforeupdate(vnode, old) {
			count++
			return true
		}

		o(count).equals(0)
	})

	o("is not called on component creation", function() {
		var component = {
			onbeforeupdate: onbeforeupdate,
			view: function(vnode) {
				return m("div", vnode.attrs)
			},
		}

		var count = 0
		var vnode = m("div", {id: "a"})
		var updated = m("div", {id: "b"})

		render(root, [vnode])

		function onbeforeupdate(vnode, old) {
			count++
			return true
		}

		o(count).equals(0)
	})

	o("is called only once on update", function() {
		var count = 0
		var vnode = m("div", {id: "a", onbeforeupdate: onbeforeupdate})
		var updated = m("div", {id: "b", onbeforeupdate: onbeforeupdate})

		render(root, [vnode])
		render(root, [updated])

		function onbeforeupdate(vnode, old) {
			count++
			return true
		}

		o(count).equals(1)
	})

	o("is called only once on component update", function() {
		var component = {
			onbeforeupdate: onbeforeupdate,
			view: function(vnode) {
				return m("div", vnode.attrs)
			},
		}

		var count = 0
		var vnode = m(component, {id: "a"})
		var updated = m(component, {id: "b"})

		render(root, [vnode])
		render(root, [updated])

		function onbeforeupdate(vnode, old) {
			count++
			return true
		}

		o(count).equals(1)
	})
})
