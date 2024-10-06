import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("layout create", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("works when rendered directly", function() {
		var callback = o.spy()
		var vnode = m.layout(callback)

		m.render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.args[0]).equals(root)
		o(callback.args[1].aborted).equals(false)
		o(callback.args[2]).equals(true)
	})
	o("works when creating element", function() {
		var callback = o.spy()
		var vnode = m("div", m.layout(callback))

		m.render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.args[1].aborted).equals(false)
		o(callback.args[2]).equals(true)
	})
	o("works when creating fragment", function() {
		var callback = o.spy()
		var vnode = [m.layout(callback)]

		m.render(root, vnode)

		o(callback.callCount).equals(1)
		o(callback.args[1].aborted).equals(false)
		o(callback.args[2]).equals(true)
	})
	o("works when replacing same-keyed", function() {
		var createDiv = o.spy()
		var createA = o.spy()
		var vnode = m("div", m.layout(createDiv))
		var updated = m("a", m.layout(createA))

		m.render(root, m.key(1, vnode))
		m.render(root, m.key(1, updated))

		o(createDiv.callCount).equals(1)
		o(createDiv.args[1].aborted).equals(true)
		o(createDiv.args[2]).equals(true)
		o(createA.callCount).equals(1)
		o(createA.args[1].aborted).equals(false)
		o(createA.args[2]).equals(true)
	})
	o("works when creating other children", function() {
		var create = o.spy()
		var vnode = m("div", m.layout(create), m("a"))

		m.render(root, vnode)

		o(create.callCount).equals(1)
		o(create.args[0]).equals(root.firstChild)
		o(create.args[1].aborted).equals(false)
		o(create.args[2]).equals(true)
	})
	o("works inside keyed", function() {
		var create = o.spy()
		var vnode = m("div", m.layout(create))
		var otherVnode = m("a")

		m.render(root, [m.key(1, vnode), m.key(2, otherVnode)])

		o(create.callCount).equals(1)
		o(create.args[0]).equals(root.firstChild)
		o(create.args[1].aborted).equals(false)
		o(create.args[2]).equals(true)
	})
	o("does not invoke callback when removing, but aborts the provided signal", function() {
		var create = o.spy()
		var vnode = m("div", m.layout(create))

		m.render(root, vnode)

		o(create.callCount).equals(1)
		o(create.args[1].aborted).equals(false)

		m.render(root, [])

		o(create.callCount).equals(1)
		o(create.args[1].aborted).equals(true)
	})
	o("works at the same step as layout update", function() {
		var create = o.spy()
		var update = o.spy()
		var callback = o.spy()
		var vnode = m("div", m.layout(create))
		var updated = m("div", m.layout(update), m("a", m.layout(callback)))

		m.render(root, vnode)
		m.render(root, updated)

		o(create.callCount).equals(1)
		o(create.args[0]).equals(root.firstChild)
		o(create.args[1].aborted).equals(false)
		o(create.args[2]).equals(true)

		o(update.callCount).equals(1)
		o(update.args[0]).equals(root.firstChild)
		o(update.args[1].aborted).equals(false)
		o(update.args[2]).equals(false)

		o(callback.callCount).equals(1)
		o(callback.args[0]).equals(root.firstChild.firstChild)
		o(callback.args[1].aborted).equals(false)
		o(callback.args[2]).equals(true)
	})
	o("works on unkeyed that falls into reverse list diff code path", function() {
		var create = o.spy()
		m.render(root, [m.key(1, m("p")), m.key(2, m("div"))])
		m.render(root, [m.key(2, m("div", m.layout(create))), m.key(1, m("p"))])

		o(create.callCount).equals(1)
		o(create.args[0]).equals(root.firstChild)
		o(create.args[1].aborted).equals(false)
		o(create.args[2]).equals(true)
	})
	o("works on unkeyed that falls into forward list diff code path", function() {
		var create = o.spy()
		m.render(root, [m("div"), m("p")])
		m.render(root, [m("div"), m("div", m.layout(create))])

		o(create.callCount).equals(1)
		o(create.args[0]).equals(root.childNodes[1])
		o(create.args[1].aborted).equals(false)
		o(create.args[2]).equals(true)
	})
	o("works after full DOM creation", function() {
		var created = false
		var vnode = m("div", m("a", m.layout(create), m("b")))

		m.render(root, vnode)

		function create(dom, _, isInit) {
			if (!isInit) return
			created = true

			o(dom.parentNode).equals(root.firstChild)
			o(dom.childNodes.length).equals(1)
		}
		o(created).equals(true)
	})
})
