import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("createElement", function() {
	var G = setupGlobals()

	o("creates element", function() {
		var vnode = m("div")
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("DIV")
	})
	o("creates attr", function() {
		var vnode = m("div", {id: "a", title: "b"})
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("DIV")
		o(vnode.d.attributes["id"].value).equals("a")
		o(vnode.d.attributes["title"].value).equals("b")
	})
	o("creates style", function() {
		var vnode = m("div", {style: {backgroundColor: "red"}})
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("DIV")
		o(vnode.d.style.backgroundColor).equals("red")
	})
	o("allows css vars in style", function() {
		var vnode = m("div", {style: {"--css-var": "red"}})
		m.render(G.root, vnode)

		o(vnode.d.style["--css-var"]).equals("red")
	})
	o("allows css vars in style with uppercase letters", function() {
		var vnode = m("div", {style: {"--cssVar": "red"}})
		m.render(G.root, vnode)

		o(vnode.d.style["--cssVar"]).equals("red")
	})
	o("censors cssFloat to float", function() {
		var vnode = m("a", {style: {cssFloat: "left"}})

		m.render(G.root, vnode)

		o(vnode.d.style.float).equals("left")
	})
	o("creates children", function() {
		var vnode = m("div", m("a"), m("b"))
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("DIV")
		o(vnode.d.childNodes.length).equals(2)
		o(vnode.d.childNodes[0].nodeName).equals("A")
		o(vnode.d.childNodes[1].nodeName).equals("B")
	})
	o("creates attrs and children", function() {
		var vnode = m("div", {id: "a", title: "b"}, m("a"), m("b"))
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("DIV")
		o(vnode.d.attributes["id"].value).equals("a")
		o(vnode.d.attributes["title"].value).equals("b")
		o(vnode.d.childNodes.length).equals(2)
		o(vnode.d.childNodes[0].nodeName).equals("A")
		o(vnode.d.childNodes[1].nodeName).equals("B")
	})
	/* eslint-disable no-script-url */
	o("creates svg", function() {
		var vnode = m("svg",
			m("a", {"xlink:href": "javascript:;"}),
			m("foreignObject", m("body", {xmlns: "http://www.w3.org/1999/xhtml"}))
		)
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("svg")
		o(vnode.d.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(vnode.d.firstChild.nodeName).equals("a")
		o(vnode.d.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(vnode.d.firstChild.attributes["href"].value).equals("javascript:;")
		o(vnode.d.firstChild.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")
		o(vnode.d.childNodes[1].nodeName).equals("foreignObject")
		o(vnode.d.childNodes[1].firstChild.nodeName).equals("body")
		o(vnode.d.childNodes[1].firstChild.namespaceURI).equals("http://www.w3.org/1999/xhtml")
	})
	/* eslint-enable no-script-url */
	o("sets attributes correctly for svg", function() {
		var vnode = m("svg", {viewBox: "0 0 100 100"})
		m.render(G.root, vnode)

		o(vnode.d.attributes["viewBox"].value).equals("0 0 100 100")
	})
	o("creates mathml", function() {
		var vnode = m("math", m("mrow"))
		m.render(G.root, vnode)

		o(vnode.d.nodeName).equals("math")
		o(vnode.d.namespaceURI).equals("http://www.w3.org/1998/Math/MathML")
		o(vnode.d.firstChild.nodeName).equals("mrow")
		o(vnode.d.firstChild.namespaceURI).equals("http://www.w3.org/1998/Math/MathML")
	})
})
