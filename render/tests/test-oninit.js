"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")

o.spec("oninit", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("calls oninit when creating element", function() {
		var callback = o.spy()
		var vnode = m("div", {oninit: callback})

		render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode.state)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oninit when creating fragment", function() {
		var callback = o.spy()
		var vnode = fragment({oninit: callback})

		render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode.state)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oninit when replacing keyed", function() {
		var createDiv = o.spy()
		var createA = o.spy()
		var vnode = m("div", {key: 1, oninit: createDiv})
		var updated = m("a", {key: 1, oninit: createA})

		render(root, vnode)
		render(root, updated)

		o(createDiv.callCount).equals(1)
		o(createDiv.this).equals(vnode.state)
		o(createDiv.args[0]).equals(vnode)
		o(createA.callCount).equals(1)
		o(createA.this).equals(updated.state)
		o(createA.args[0]).equals(updated)
	})
	o("does not call oninit when noop", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {oninit: create})
		var updated = m("div", {oninit: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oninit when updating attr", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {oninit: create})
		var updated = m("div", {oninit: update, id: "a"})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oninit when updating children", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {oninit: create}, m("a"))
		var updated = m("div", {oninit: update}, m("b"))

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oninit when updating keyed", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {key: 1, oninit: create})
		var otherVnode = m("a", {key: 2})
		var updated = m("div", {key: 1, oninit: update})
		var otherUpdated = m("a", {key: 2})

		render(root, [vnode, otherVnode])
		render(root, [otherUpdated, updated])

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oninit when removing", function() {
		var create = o.spy()
		var vnode = m("div", {oninit: create})

		render(root, vnode)
		render(root, [])

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
	})
	o("calls oninit when recycling", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {key: 1, oninit: create})
		var updated = m("div", {key: 1, oninit: update})

		render(root, vnode)
		render(root, [])
		render(root, updated)

		o(create.callCount).equals(1)
		o(create.this).equals(vnode.state)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(1)
		o(update.this).equals(updated.state)
		o(update.args[0]).equals(updated)
	})
	o("calls oninit at the same step as onupdate", function() {
		var create = o.spy()
		var update = o.spy()
		var callback = o.spy()
		var vnode = m("div", {onupdate: create})
		var updated = m("div", {onupdate: update}, m("a", {oninit: callback}))

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
	o("calls oninit before full DOM creation", function() {
		var called = false
		var vnode = m("div",
			m("a", {oninit: create},
				m("b")
			)
		)

		render(root, vnode)

		function create(vnode) {
			called = true

			o(vnode.dom).equals(undefined)
			o(root.childNodes.length).equals(1)
		}
		o(called).equals(true)
	})
	o("does not set oninit as an event handler", function() {
		var create = o.spy()
		var vnode = m("div", {oninit: create})

		render(root, vnode)

		o(vnode.dom.oninit).equals(undefined)
		o(vnode.dom.attributes["oninit"]).equals(undefined)
	})

	o("No spurious oninit calls in mapped keyed diff when the pool is involved (#1992)", function () {
		var oninit1 = o.spy()
		var oninit2 = o.spy()
		var oninit3 = o.spy()

		render(root, [
			m("p", {key: 1, oninit: oninit1}),
			m("p", {key: 2, oninit: oninit2}),
			m("p", {key: 3, oninit: oninit3}),
		])
		render(root, [
			m("p", {key: 1, oninit: oninit1}),
			m("p", {key: 3, oninit: oninit3}),
		])
		render(root, [
			m("p", {key: 3, oninit: oninit3}),
		])

		o(oninit1.callCount).equals(1)
		o(oninit2.callCount).equals(1)
		o(oninit3.callCount).equals(1)
	})
})
