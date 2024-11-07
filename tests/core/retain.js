import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("retain", function() {
	var G = setupGlobals()

	o("prevents update in element", function() {
		var vnode = m("div", {id: "a"}, "b")
		var updated = m.retain()

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.attributes["id"].value).equals("a")
		o(G.root.firstChild.childNodes.length).equals(1)
		o(G.root.firstChild.childNodes[0].nodeValue).equals("b")
		o(updated).deepEquals(vnode)
	})

	o("prevents update in fragment", function() {
		var vnode = m.normalize(["a"])
		var updated = m.retain()

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.nodeValue).equals("a")
		o(updated).deepEquals(vnode)
	})

	o("ignored if used on creation", function() {
		var retain = m.retain()

		m.render(G.root, retain)

		o(G.root.childNodes.length).equals(0)
		o(retain.m).equals(-1)
	})

	o("prevents update in component", function() {
		var component = (attrs, old) => (old ? m.retain() : m("div", attrs.children))
		var vnode = m(component, "a")
		var updated = m(component, "b")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.firstChild.nodeValue).equals("a")
		o(updated.c).deepEquals(vnode.c)
	})

	o("prevents update in component and for component", function() {
		var component = ({id}, old) => (old ? m.retain() : m("div", {id}))
		var vnode = m(component, {id: "a"})
		var updated = m.retain()

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.attributes["id"].value).equals("a")
		o(updated).deepEquals(vnode)
	})

	o("prevents update for component but not in component", function() {
		var component = ({id}) => m("div", {id})
		var vnode = m(component, {id: "a"})
		var updated = m.retain()

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(G.root.firstChild.attributes["id"].value).equals("a")
		o(updated).deepEquals(vnode)
	})

	o("ignored if used on component creation", function() {
		var retain = m.retain()
		var component = () => retain

		m.render(G.root, m(component))

		o(G.root.childNodes.length).equals(0)
		o(retain.m).equals(-1)
	})
})
