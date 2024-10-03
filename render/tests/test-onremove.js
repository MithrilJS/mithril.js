"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var render = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("onremove", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("does not call onremove when creating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onremove: create})
		var updated = m("div", {onremove: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
	})
	o("does not call onremove when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onremove: create})
		var updated = m("div", {onremove: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("calls onremove when removing element", function() {
		var remove = o.spy()
		var vnode = m("div", {onremove: remove})

		render(root, vnode)
		render(root, [])

		o(remove.callCount).equals(1)
		o(remove.this).equals(vnode.state)
		o(remove.args[0]).equals(vnode)
	})
	o("calls onremove when removing fragment", function() {
		var remove = o.spy()
		var vnode = m.fragment({onremove: remove})

		render(root, vnode)
		render(root, [])

		o(remove.callCount).equals(1)
		o(remove.this).equals(vnode.state)
		o(remove.args[0]).equals(vnode)
	})
	o("does not set onremove as an event handler", function() {
		var remove = o.spy()
		var vnode = m("div", {onremove: remove})

		render(root, vnode)

		o(vnode.dom.onremove).equals(undefined)
		o(vnode.dom.attributes["onremove"]).equals(undefined)
		o(vnode.instance).equals(undefined)
	})
	o("calls onremove on keyed nodes", function() {
		var remove = o.spy()
		var vnode = m("div")
		var temp = m("div", {onremove: remove})
		var updated = m("div")

		render(root, m.key(1, vnode))
		render(root, m.key(2, temp))
		render(root, m.key(1, updated))

		o(vnode.dom).notEquals(updated.dom) // this used to be a recycling pool test
		o(remove.callCount).equals(1)
	})
	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o("calls onremove on nested component", function() {
				var spy = o.spy()
				var comp = createComponent({
					view: function() {return m(outer)}
				})
				var outer = createComponent({
					view: function() {return m(inner)}
				})
				var inner = createComponent({
					onremove: spy,
					view: function() {return m("div")}
				})
				render(root, m(comp))
				render(root, null)

				o(spy.callCount).equals(1)
			})
			o("calls onremove on nested component child", function() {
				var spy = o.spy()
				var comp = createComponent({
					view: function() {return m(outer)}
				})
				var outer = createComponent({
					view: function() {return m(inner, m("a", {onremove: spy}))}
				})
				var inner = createComponent({
					view: function(vnode) {return m("div", vnode.children)}
				})
				render(root, m(comp))
				render(root, null)

				o(spy.callCount).equals(1)
			})
			o("doesn't call onremove on children when the corresponding view returns null (after removing the parent)", function() {
				var threw = false
				var spy = o.spy()
				var parent = createComponent({
					view: function() {}
				})
				var child = createComponent({
					view: function() {},
					onremove: spy
				})
				render(root, m(parent, m(child)))
				try {
					render(root, null)
				} catch (e) {
					threw = e
				}

				o(spy.callCount).equals(0)
				o(threw).equals(false)
			})
			o("doesn't call onremove on children when the corresponding view returns null (after removing the children)", function() {
				var threw = false
				var spy = o.spy()
				var parent = createComponent({
					view: function() {}
				})
				var child = createComponent({
					view: function() {},
					onremove: spy
				})
				render(root, m(parent, m(child)))
				try {
					render(root, m(parent))
				} catch (e) {
					threw = true
				}

				o(spy.callCount).equals(0)
				o(threw).equals(false)
			})
			o("onremove doesn't fire on nodes that go from pool to pool (#1990)", function() {
				var onremove = o.spy();

				render(root, [m("div", m("div")), m("div", m("div", {onremove: onremove}))]);
				render(root, [m("div", m("div"))]);
				render(root, []);

				o(onremove.callCount).equals(1)
			})
			o("doesn't fire when removing the children of a node that's brought back from the pool (#1991 part 2)", function() {
				var onremove = o.spy()
				var vnode = m("div", m("div", {onremove: onremove}))
				var temp = m("div")
				var updated = m("div", m("p"))

				render(root, m.key(1, vnode))
				render(root, m.key(2, temp))
				render(root, m.key(1, updated))

				o(vnode.dom).notEquals(updated.dom) // this used to be a recycling pool test
				o(onremove.callCount).equals(1)
			})
		})
	})
})
