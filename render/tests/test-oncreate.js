"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")

o.spec("oncreate", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("calls oncreate when creating element", function() {
		var callback = o.spy()
		var vnode = m("div", {oncreate: callback})

		render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode.state)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oncreate when creating fragment", function() {
		var callback = o.spy()
		var vnode = fragment({oncreate: callback})

		render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode.state)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oncreate when replacing keyed", function() {
		var createDiv = o.spy()
		var createA = o.spy()
		var vnode = m("div", {key: 1, oncreate: createDiv})
		var updated = m("a", {key: 1, oncreate: createA})

		render(root, vnode)
		render(root, updated)

		o(createDiv.callCount).equals(1)
		o(createDiv.this).equals(vnode.state)
		o(createDiv.args[0]).equals(vnode)
		o(createA.callCount).equals(1)
		o(createA.this).equals(updated.state)
		o(createA.args[0]).equals(updated)
	})
	o("does not call oncreate when noop", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {oncreate: create})
		var updated = m("div", {oncreate: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when updating attr", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {oncreate: create})
		var updated = m("div", {oncreate: update, id: "a"})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when updating children", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {oncreate: create}, m("a"))
		var updated = m("div", {oncreate: update}, m("b"))

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when updating keyed", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {key: 1, oncreate: create})
		var otherVnode = m("a", {key: 2})
		var updated = m("div", {key: 1, oncreate: update})
		var otherUpdated = m("a", {key: 2})

		render(root, [vnode, otherVnode])
		render(root, [otherUpdated, updated])

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when removing", function() {
		var create = o.spy()
		var vnode = m("div", {oncreate: create})

		render(root, vnode)
		render(root, [])

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
	})
	o("does not recycle when there's an oncreate", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {key: 1, oncreate: create})
		var updated = m("div", {key: 1, oncreate: update})

		render(root, vnode)
		render(root, [])
		render(root, updated)

		o(vnode.dom).notEquals(updated.dom)
		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(1)
		o(update.this).equals(updated.state)
		o(update.args[0]).equals(updated)
	})
	o("calls oncreate at the same step as onupdate", function() {
		var create = o.spy()
		var update = o.spy()
		var callback = o.spy()
		var vnode = m("div", {onupdate: create})
		var updated = m("div", {onupdate: update}, m("a", {oncreate: callback}))

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(vnode.state)
		o(update.args[0]).equals(updated)
		o(callback.callCount).equals(1)
		o(callback.this).equals(updated.children[0].state)
		o(callback.args[0]).equals(updated.children[0])
	})
	o("calls oncreate on unkeyed that falls into reverse list diff code path", function() {
		var create = o.spy()
		render(root, m("p", m("div")))
		render(root, m("div", {oncreate: create}, m("div")))

		o(create.callCount).equals(1)
	})
	o("calls oncreate on unkeyed that falls into forward list diff code path", function() {
		var create = o.spy()
		render(root, [m("div"), m("p")])
		render(root, [m("div"), m("div", {oncreate: create})])

		o(create.callCount).equals(1)
	})
	o("calls oncreate after full DOM creation", function() {
		var created = false
		var vnode = m("div",
			m("a", {oncreate: create},
				m("b")
			)
		)

		render(root, vnode)

		function create(vnode) {
			created = true

			o(vnode.dom.parentNode).notEquals(null)
			o(vnode.dom.childNodes.length).equals(1)
		}
		o(created).equals(true)
	})
	o("does not set oncreate as an event handler", function() {
		var create = o.spy()
		var vnode = m("div", {oncreate: create})

		render(root, vnode)

		o(vnode.dom.oncreate).equals(undefined)
		o(vnode.dom.attributes["oncreate"]).equals(undefined)
	})
	o("calls oncreate on recycle", function() {
		var create = o.spy()
		var vnodes = m("div", {key: 1, oncreate: create})
		var temp = []
		var updated = m("div", {key: 1, oncreate: create})

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(create.callCount).equals(2)
	})
})
