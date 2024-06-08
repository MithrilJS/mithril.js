"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")

o.spec("onupdate", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("does not call onupdate when creating element", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onupdate: create})
		var updated = m("div", {onupdate: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(vnode.state)
		o(update.args[0]).equals(updated)
	})
	o("does not call onupdate when removing element", function() {
		var create = o.spy()
		var vnode = m("div", {onupdate: create})

		render(root, vnode)
		render(root, [])

		o(create.callCount).equals(0)
	})
	o("does not call onupdate when replacing keyed element", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {key: 1, onupdate: create})
		var updated = m("a", {key: 1, onupdate: update})
		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("does not recycle when there's an onupdate", function() {
		var update = o.spy()
		var vnode = m("div", {key: 1, onupdate: update})
		var updated = m("div", {key: 1, onupdate: update})

		render(root, vnode)
		render(root, [])
		render(root, updated)

		o(vnode.dom).notEquals(updated.dom)
	})
	o("does not call old onupdate when removing the onupdate property in new vnode", function() {
		var create = o.spy()
		var vnode = m("a", {onupdate: create})
		var updated = m("a")

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
	})
	o("calls onupdate when noop", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onupdate: create})
		var updated = m("div", {onupdate: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(vnode.state)
		o(update.args[0]).equals(updated)
	})
	o("calls onupdate when updating attr", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onupdate: create})
		var updated = m("div", {onupdate: update, id: "a"})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(vnode.state)
		o(update.args[0]).equals(updated)
	})
	o("calls onupdate when updating children", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onupdate: create}, m("a"))
		var updated = m("div", {onupdate: update}, m("b"))

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(vnode.state)
		o(update.args[0]).equals(updated)
	})
	o("calls onupdate when updating fragment", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = fragment({onupdate: create})
		var updated = fragment({onupdate: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(vnode.state)
		o(update.args[0]).equals(updated)
	})
	o("calls onupdate after full DOM update", function() {
		var called = false
		var vnode = m("div", {id: "1"},
			m("a", {id: "2"},
				m("b", {id: "3"})
			)
		)
		var updated = m("div", {id: "11"},
			m("a", {id: "22", onupdate: update},
				m("b", {id: "33"})
			)
		)

		render(root, vnode)
		render(root, updated)

		function update(vnode) {
			called = true

			o(vnode.dom.parentNode.attributes["id"].value).equals("11")
			o(vnode.dom.attributes["id"].value).equals("22")
			o(vnode.dom.childNodes[0].attributes["id"].value).equals("33")
		}
		o(called).equals(true)
	})
	o("does not set onupdate as an event handler", function() {
		var update = o.spy()
		var vnode = m("div", {onupdate: update})

		render(root, vnode)

		o(vnode.dom.onupdate).equals(undefined)
		o(vnode.dom.attributes["onupdate"]).equals(undefined)
	})
})
