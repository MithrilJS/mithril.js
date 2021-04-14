"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("createElement", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("creates element", function() {
		var vnode = m("div")
		render(root, vnode)

		o(vnode.dom.nodeName).equals("DIV")
	})
	o("creates attr", function() {
		var vnode = m("div", {id: "a", title: "b"})
		render(root, vnode)

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.attributes["id"].value).equals("a")
		o(vnode.dom.attributes["title"].value).equals("b")
	})
	o("creates style", function() {
		var vnode = m("div", {style: {backgroundColor: "red"}})
		render(root, vnode)

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.style.backgroundColor).equals("red")
	})
	o("allows css vars in style", function() {
		var vnode = m("div", {style: {"--css-var": "red"}})
		render(root, vnode)

		o(vnode.dom.style["--css-var"]).equals("red")
	})
	o("allows css vars in style with uppercase letters", function() {
		var vnode = m("div", {style: {"--cssVar": "red"}})
		render(root, vnode)

		o(vnode.dom.style["--cssVar"]).equals("red")
	})
	o("censors cssFloat to float", function() {
		var vnode = m("a", {style: {cssFloat: "left"}})

		render(root, vnode)

		o(vnode.dom.style.float).equals("left")
	})
	o("creates children", function() {
		var vnode = m("div", m("a"), m("b"))
		render(root, vnode)

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.childNodes.length).equals(2)
		o(vnode.dom.childNodes[0].nodeName).equals("A")
		o(vnode.dom.childNodes[1].nodeName).equals("B")
	})
	o("creates attrs and children", function() {
		var vnode = m("div", {id: "a", title: "b"}, m("a"), m("b"))
		render(root, vnode)

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.attributes["id"].value).equals("a")
		o(vnode.dom.attributes["title"].value).equals("b")
		o(vnode.dom.childNodes.length).equals(2)
		o(vnode.dom.childNodes[0].nodeName).equals("A")
		o(vnode.dom.childNodes[1].nodeName).equals("B")
	})
	/* eslint-disable no-script-url */
	o("creates svg", function() {
		var vnode = m("svg",
			m("a", {"xlink:href": "javascript:;"}),
			m("foreignObject", m("body", {xmlns: "http://www.w3.org/1999/xhtml"}))
		)
		render(root, vnode)

		o(vnode.dom.nodeName).equals("svg")
		o(vnode.dom.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(vnode.dom.firstChild.nodeName).equals("a")
		o(vnode.dom.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(vnode.dom.firstChild.attributes["href"].value).equals("javascript:;")
		o(vnode.dom.firstChild.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")
		o(vnode.dom.childNodes[1].nodeName).equals("foreignObject")
		o(vnode.dom.childNodes[1].firstChild.nodeName).equals("body")
		o(vnode.dom.childNodes[1].firstChild.namespaceURI).equals("http://www.w3.org/1999/xhtml")
	})
	/* eslint-enable no-script-url */
	o("sets attributes correctly for svg", function() {
		var vnode = m("svg", {viewBox: "0 0 100 100"})
		render(root, vnode)

		o(vnode.dom.attributes["viewBox"].value).equals("0 0 100 100")
	})
	o("creates mathml", function() {
		var vnode = m("math", m("mrow"))
		render(root, vnode)

		o(vnode.dom.nodeName).equals("math")
		o(vnode.dom.namespaceURI).equals("http://www.w3.org/1998/Math/MathML")
		o(vnode.dom.firstChild.nodeName).equals("mrow")
		o(vnode.dom.firstChild.namespaceURI).equals("http://www.w3.org/1998/Math/MathML")
	})
})
