import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("retain", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("prevents update in element", function() {
		var vnode = m("div", {id: "a"}, "b")
		var updated = m.retain()

		m.render(root, vnode)
		m.render(root, updated)

		o(root.firstChild.attributes["id"].value).equals("a")
		o(root.firstChild.childNodes.length).equals(1)
		o(root.firstChild.childNodes[0].nodeValue).equals("b")
		o(updated).deepEquals(vnode)
	})

	o("prevents update in fragment", function() {
		var vnode = m.normalize(["a"])
		var updated = m.retain()

		m.render(root, vnode)
		m.render(root, updated)

		o(root.firstChild.nodeValue).equals("a")
		o(updated).deepEquals(vnode)
	})

	o("throws on creation", function() {
		o(() => m.render(root, m.retain())).throws(Error)
	})

	o("prevents update in component", function() {
		var component = (vnode, old) => (old ? m.retain() : m("div", vnode.children))
		var vnode = m(component, "a")
		var updated = m(component, "b")

		m.render(root, vnode)
		m.render(root, updated)

		o(root.firstChild.firstChild.nodeValue).equals("a")
		o(updated.children).deepEquals(vnode.children)
	})

	o("prevents update in component and for component", function() {
		var component = ({id}, old) => (old ? m.retain() : m("div", {id}))
		var vnode = m(component, {id: "a"})
		var updated = m.retain()

		m.render(root, vnode)
		m.render(root, updated)

		o(root.firstChild.attributes["id"].value).equals("a")
		o(updated).deepEquals(vnode)
	})

	o("prevents update for component but not in component", function() {
		var component = ({id}) => m("div", {id})
		var vnode = m(component, {id: "a"})
		var updated = m.retain()

		m.render(root, vnode)
		m.render(root, updated)

		o(root.firstChild.attributes["id"].value).equals("a")
		o(updated).deepEquals(vnode)
	})

	o("throws if used on component creation", function() {
		var component = () => m.retain()

		o(() => m.render(root, m(component))).throws(Error)
	})
})
