"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../src/core/render")
var m = require("../../src/core/hyperscript")

o.spec("layout remove", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	var layoutRemove = (onabort) => m.layout((_, signal) => { signal.onabort = onabort })

	o("does not abort layout signal when creating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", layoutRemove(create))
		var updated = m("div", layoutRemove(update))

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
	})
	o("does not abort layout signal when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = m("div", layoutRemove(create))
		var updated = m("div", layoutRemove(update))

		render(root, vnode)
		render(root, updated)

		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("aborts layout signal when removing element", function() {
		var remove = o.spy()
		var vnode = m("div", layoutRemove(remove))

		render(root, vnode)
		render(root, [])

		o(remove.callCount).equals(1)
	})
	o("aborts layout signal when removing fragment", function() {
		var remove = o.spy()
		var vnode = [layoutRemove(remove)]

		render(root, vnode)
		render(root, [])

		o(remove.callCount).equals(1)
	})
	o("aborts layout signal on keyed nodes", function() {
		var remove = o.spy()
		var vnode = m("div")
		var temp = m("div", layoutRemove(remove))
		var updated = m("div")

		render(root, m.key(1, vnode))
		render(root, m.key(2, temp))
		render(root, m.key(1, updated))

		o(vnode.dom).notEquals(updated.dom) // this used to be a recycling pool test
		o(remove.callCount).equals(1)
	})
	o("aborts layout signal on nested component", function() {
		var spy = o.spy()
		var comp = () => m(outer)
		var outer = () => m(inner)
		var inner = () => m.layout(spy)
		render(root, m(comp))
		render(root, null)

		o(spy.callCount).equals(1)
	})
	o("aborts layout signal on nested component child", function() {
		var spy = o.spy()
		var comp = () => m(outer)
		var outer = () => m(inner, m("a", layoutRemove(spy)))
		var inner = (attrs) => m("div", attrs.children)
		render(root, m(comp))
		render(root, null)

		o(spy.callCount).equals(1)
	})
})
