"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("onbeforeremove", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("does not call onbeforeremove when creating", function() {
		var create = o.spy()
		var vnode = m("div", {onbeforeremove: create})

		render(root, vnode)

		o(create.callCount).equals(0)
	})
	o("does not call onbeforeremove when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", {onbeforeremove: create})
		var updated = m("div", {onbeforeremove: update})

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("calls onbeforeremove when removing element", function() {
		var onbeforeremove = o.spy()
		var vnode = m("div", {onbeforeremove})

		render(root, [vnode])
		var firstChild = root.firstChild
		o(firstChild).notEquals(null)
		render(root, [])

		o(onbeforeremove.callCount).equals(1)
		o(onbeforeremove.this).equals(vnode.state)
		o(onbeforeremove.this).satisfies((v) => ({
			pass: v !== null && typeof v === "object",
			message: "`onbeforeremove` should be called with an object",
		}))
		o(onbeforeremove.args[0]).equals(vnode)
		o(root.childNodes.length).equals(0)
		o(vnode.dom).equals(firstChild)
	})
	o("calls onbeforeremove when removing fragment", function() {
		var onbeforeremove = o.spy()
		var vnode = m.fragment({onbeforeremove}, m("div"))

		render(root, [vnode])
		var firstChild = root.firstChild
		o(firstChild).notEquals(null)
		render(root, [])

		o(onbeforeremove.callCount).equals(1)
		o(onbeforeremove.this).equals(vnode.state)
		o(onbeforeremove.this).satisfies((v) => ({
			pass: v !== null && typeof v === "object",
			message: "`onbeforeremove` should be called with an object",
		}))
		o(onbeforeremove.args[0]).equals(vnode)
		o(root.childNodes.length).equals(0)
		o(vnode.dom).equals(firstChild)
	})
	o("calls onremove after onbeforeremove returns", function() {
		var callOrder = []
		var onbeforeremove = o.spy(() => { callOrder.push("onbeforeremove") })
		var spy = o.spy(() => { callOrder.push("onremove") })
		var vnode = m.fragment({onbeforeremove: onbeforeremove, onremove: spy}, "a")

		render(root, [vnode])
		var firstChild = root.firstChild
		o(firstChild).notEquals(null)
		render(root, [])

		o(onbeforeremove.callCount).equals(1)
		o(onbeforeremove.this).equals(vnode.state)
		o(onbeforeremove.this).satisfies((v) => ({
			pass: v !== null && typeof v === "object",
			message: "`onbeforeremove` should be called with an object",
		}))
		o(onbeforeremove.args[0]).equals(vnode)
		o(root.childNodes.length).equals(0)
		o(vnode.dom).equals(firstChild)
		o(spy.callCount).equals(1)

		o(callOrder).deepEquals(["onbeforeremove", "onremove"])
	})
	o("calls onremove after onbeforeremove resolves", function() {
		var removed = Promise.resolve()
		var onbeforeremove = o.spy(() => removed)
		var spy = o.spy()
		var vnode = m.fragment({onbeforeremove: onbeforeremove, onremove: spy}, "a")

		render(root, [vnode])
		var firstChild = root.firstChild
		o(firstChild).notEquals(null)
		render(root, [])

		o(onbeforeremove.callCount).equals(1)
		o(onbeforeremove.this).equals(vnode.state)
		o(onbeforeremove.this).satisfies((v) => ({
			pass: v !== null && typeof v === "object",
			message: "`onbeforeremove` should be called with an object",
		}))
		o(onbeforeremove.args[0]).equals(vnode)
		o(root.childNodes.length).equals(1)
		o(vnode.dom).equals(firstChild)
		o(root.firstChild).equals(firstChild)
		o(spy.callCount).equals(0)

		return removed.then(() => {
			o(onbeforeremove.callCount).equals(1)
			o(spy.callCount).equals(1)
		})
	})
	o("does not set onbeforeremove as an event handler", function() {
		var remove = o.spy()
		var vnode = m("div", {onbeforeremove: remove})

		render(root, vnode)

		o(vnode.dom.onbeforeremove).equals(undefined)
		o(vnode.dom.attributes["onbeforeremove"]).equals(undefined)
	})
	o("does not leave elements out of order during removal", function() {
		var removed = Promise.resolve()
		var vnodes = [
			m.key(1, m("div", {onbeforeremove: () => removed})),
			m.key(2, m("span")),
		]
		var updated = [m.key(2, m("span"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.firstChild.nodeName).equals("DIV")

		return removed.then(() => {
			o(root.childNodes.length).equals(1)
			o(root.firstChild.nodeName).equals("SPAN")
		})
	})
	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create
			o("finalizes the remove phase asynchronously when promise is returned synchronously from both attrs- and tag.onbeforeremove", function() {
				var removed = Promise.resolve()
				var onremove = o.spy()
				var component = createComponent({
					onbeforeremove: () => removed,
					onremove: onremove,
					view: function() {},
				})
				render(root, [m(component, {onbeforeremove: () => removed, onremove: onremove})])
				render(root, [])
				return removed.then(() => {
					o(onremove.callCount).equals(2) // once for `tag`, once for `attrs`
				})
			})
		})
	})
})
