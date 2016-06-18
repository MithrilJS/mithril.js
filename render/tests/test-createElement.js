"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("createElement", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("creates element", function() {
		var vnode = {tag: "div"}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("DIV")
	})
	o("creates attr", function() {
		var vnode = {tag: "div", attrs: {id: "a", title: "b"}}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.attributes["id"].nodeValue).equals("a")
		o(vnode.dom.attributes["title"].nodeValue).equals("b")
	})
	o("creates style", function() {
		var vnode = {tag: "div", attrs: {style: {backgroundColor: "red"}}}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.style.backgroundColor).equals("red")
	})
	o("creates children", function() {
		var vnode = {tag: "div", children: [{tag: "a"}, {tag: "b"}]}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.childNodes.length).equals(2)
		o(vnode.dom.childNodes[0].nodeName).equals("A")
		o(vnode.dom.childNodes[1].nodeName).equals("B")
	})
	o("creates attrs and children", function() {
		var vnode = {tag: "div", attrs: {id: "a", title: "b"}, children: [{tag: "a"}, {tag: "b"}]}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("DIV")
		o(vnode.dom.attributes["id"].nodeValue).equals("a")
		o(vnode.dom.attributes["title"].nodeValue).equals("b")
		o(vnode.dom.childNodes.length).equals(2)
		o(vnode.dom.childNodes[0].nodeName).equals("A")
		o(vnode.dom.childNodes[1].nodeName).equals("B")
	})
	o("creates svg", function() {
		var vnode = {tag: "svg", ns: "http://www.w3.org/2000/svg", children: [{tag: "a", ns: "http://www.w3.org/2000/svg", attrs: {"xlink:href": "javascript:;"}}]}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("svg")
		o(vnode.dom.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(vnode.dom.firstChild.nodeName).equals("a")
		o(vnode.dom.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
		o(vnode.dom.firstChild.attributes["href"].nodeValue).equals("javascript:;")
		o(vnode.dom.firstChild.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")
	})
	o("sets attributes correctly for svg", function() {
		var vnode = {tag: "svg", ns: "http://www.w3.org/2000/svg", attrs: {viewBox: "0 0 100 100"}}
		render(root, [vnode])

		o(vnode.dom.attributes["viewBox"].nodeValue).equals("0 0 100 100")
	})
	o("creates mathml", function() {
		var vnode = {tag: "math", ns: "http://www.w3.org/1998/Math/MathML", children: [{tag: "mrow", ns: "http://www.w3.org/1998/Math/MathML"}]}
		render(root, [vnode])

		o(vnode.dom.nodeName).equals("math")
		o(vnode.dom.namespaceURI).equals("http://www.w3.org/1998/Math/MathML")
		o(vnode.dom.firstChild.nodeName).equals("mrow")
		o(vnode.dom.firstChild.namespaceURI).equals("http://www.w3.org/1998/Math/MathML")
	})
})
