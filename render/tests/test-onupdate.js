"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("layout update", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("is not invoked when removing element", function() {
		var layout = o.spy()
		var vnode = m("div", m.layout(layout))

		render(root, vnode)
		render(root, [])

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
	})
	o("is not updated when replacing keyed element", function() {
		var layout = o.spy()
		var update = o.spy()
		var vnode = m.key(1, m("div", m.layout(layout)))
		var updated = m.key(1, m("a", m.layout(update)))
		render(root, vnode)
		render(root, updated)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
		o(update.calls.map((c) => c.args[2])).deepEquals([true])
	})
	o("does not call old callback when removing layout vnode from new vnode", function() {
		var layout = o.spy()

		render(root, m("a", m.layout(layout)))
		render(root, m("a", m.layout(layout)))
		render(root, m("a"))

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, false])
	})
	o("invoked on noop", function() {
		var layout = o.spy()
		var update = o.spy()
		var vnode = m("div", m.layout(layout))
		var updated = m("div", m.layout(update))

		render(root, vnode)
		render(root, updated)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
		o(update.calls.map((c) => c.args[2])).deepEquals([false])
	})
	o("invoked on updating attr", function() {
		var layout = o.spy()
		var update = o.spy()
		var vnode = m("div", m.layout(layout))
		var updated = m("div", {id: "a"}, m.layout(update))

		render(root, vnode)
		render(root, updated)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
		o(update.calls.map((c) => c.args[2])).deepEquals([false])
	})
	o("invoked on updating children", function() {
		var layout = o.spy()
		var update = o.spy()
		var vnode = m("div", m.layout(layout), m("a"))
		var updated = m("div", m.layout(update), m("b"))

		render(root, vnode)
		render(root, updated)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
		o(update.calls.map((c) => c.args[2])).deepEquals([false])
	})
	o("invoked on updating fragment", function() {
		var layout = o.spy()
		var update = o.spy()
		var vnode = [m.layout(layout)]
		var updated = [m.layout(update)]

		render(root, vnode)
		render(root, updated)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
		o(update.calls.map((c) => c.args[2])).deepEquals([false])
	})
	o("invoked on full DOM update", function() {
		var called = false
		var vnode = m("div", {id: "1"},
			m("a", {id: "2"}, m.layout(() => {}),
				m("b", {id: "3"})
			)
		)
		var updated = m("div", {id: "11"},
			m("a", {id: "22"}, m.layout(update),
				m("b", {id: "33"})
			)
		)

		render(root, vnode)
		render(root, updated)

		function update(dom, _, isInit) {
			if (isInit) return
			called = true

			o(dom.parentNode.attributes["id"].value).equals("11")
			o(dom.attributes["id"].value).equals("22")
			o(dom.childNodes[0].attributes["id"].value).equals("33")
		}
		o(called).equals(true)
	})
})
