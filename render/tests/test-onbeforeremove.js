"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("onbeforeremove", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("does not call onbeforeremove when creating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onbeforeremove: create})

		render(root, [vnode])

		o(create.callCount).equals(0)
	})
	o("does not call onbeforeremove when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onbeforeremove: create})
		var updated = m("div", {onbeforeremove: update})

		render(root, [vnode])
		render(root, [updated])

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("calls onbeforeremove when removing element", function(done) {
		var vnode = m("div", {
			oninit: function(){vnode.state = {}},
			onbeforeremove: remove
		})

		render(root, [vnode])
		render(root, [])

		function remove(node, complete) {
			o(node).equals(vnode)
			o(this).equals(vnode.state)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(1)

				complete()

				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing text", function(done) {
		var vnode = m("#", {onbeforeremove: remove}, "a")

		render(root, [vnode])
		render(root, [])

		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(1)

				complete()

				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing fragment", function(done) {
		var vnode = m("[", {onbeforeremove: remove}, [m("div")])

		render(root, [vnode])
		render(root, [])

		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(1)

				complete()

				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing html", function(done) {
		var vnode = m("<", {onbeforeremove: remove}, "a")

		render(root, [vnode])
		render(root, [])

		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(1)

				complete()

				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls remove after onbeforeremove resolves", function(done) {
		var spy = o.spy()
		var vnode = m("<", {onbeforeremove: remove, onremove: spy}, "a")

		render(root, [vnode])
		render(root, [])

		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)

			callAsync(function() {
				o(root.childNodes.length).equals(1)
				o(spy.callCount).equals(0)

				complete()

				o(root.childNodes.length).equals(0)
				o(spy.callCount).equals(1)

				done()
			})
		}
	})
	o("does not set onbeforeremove as an event handler", function() {
		var remove = o.spy()
		var vnode = m("div", {onbeforeremove: remove})

		render(root, [vnode])

		o(vnode.dom.onbeforeremove).equals(undefined)
		o(vnode.dom.attributes["onbeforeremove"]).equals(undefined)
	})
	o("does not recycle when there's an onbeforeremove", function() {
		var remove = function(vnode, done) {done()}
		var vnode = m("div", {key: 1, onbeforeremove: remove})
		var updated = m("div", {key: 1, onbeforeremove: remove})

		render(root, [vnode])
		render(root, [])
		render(root, [updated])

		o(vnode.dom).notEquals(updated.dom)
	})
})
