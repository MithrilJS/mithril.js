"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var trust = require("../../render/trust")

o.spec("updateHTML", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
	})

	o("updates html", function() {
		var vnode = trust("a")
		var updated = trust("b")

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(root.firstChild)
		o(updated.domSize).equals(1)
		o(updated.dom.nodeValue).equals("b")
	})
	o("adds html", function() {
		var vnode = trust("")
		var updated = trust("<a></a><b></b>")

		render(root, vnode)
		render(root, updated)

		o(updated.domSize).equals(2)
		o(updated.dom).equals(root.firstChild)
		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("removes html", function() {
		var vnode = trust("<a></a><b></b>")
		var updated = trust("")

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(null)
		o(updated.domSize).equals(0)
		o(root.childNodes.length).equals(0)
	})
	function childKeysOf(elem, key) {
		var keys = key.split(".")
		var result = []
		for (var i = 0; i < elem.childNodes.length; i++) {
			var child = elem.childNodes[i]
			for (var j = 0; j < keys.length; j++) child = child[keys[j]]
			result.push(child)
		}
		return result
	}
	o("updates the dom correctly with a contenteditable parent", function() {
		var div = m("div", {contenteditable: true}, trust("<a></a>"))

		render(root, div)
		o(childKeysOf(div.dom, "nodeName")).deepEquals(["A"])
	})
	o("updates dom with multiple text children", function() {
		var vnode = ["a", trust("<a></a>"), trust("<b></b>")]
		var replacement = ["a", trust("<c></c>"), trust("<d></d>")]

		render(root, vnode)
		render(root, replacement)

		o(childKeysOf(root, "nodeName")).deepEquals(["#text", "C", "D"])
	})
	o("updates dom with multiple text children in other parents", function() {
		var vnode = [
			m("div", "a", trust("<a></a>")),
			m("div", "b", trust("<b></b>")),
		]
		var replacement = [
			m("div", "c", trust("<c></c>")),
			m("div", "d", trust("<d></d>")),
		]

		render(root, vnode)
		render(root, replacement)

		o(childKeysOf(root, "nodeName")).deepEquals(["DIV", "DIV"])
		o(childKeysOf(root.childNodes[0], "nodeName")).deepEquals(["#text", "C"])
		o(root.childNodes[0].firstChild.nodeValue).equals("c")
		o(childKeysOf(root.childNodes[1], "nodeName")).deepEquals(["#text", "D"])
		o(root.childNodes[1].firstChild.nodeValue).equals("d")
	})
	o("correctly diffs if followed by another trusted vnode", function() {
		render(root, [
			trust("<span>A</span>"),
			trust("<span>A</span>"),
		])
		o(childKeysOf(root, "nodeName")).deepEquals(["SPAN", "SPAN"])
		o(childKeysOf(root, "firstChild.nodeValue")).deepEquals(["A", "A"])
		render(root, [
			trust("<span>B</span>"),
			trust("<span>A</span>"),
		])
		o(childKeysOf(root, "nodeName")).deepEquals(["SPAN", "SPAN"])
		o(childKeysOf(root, "firstChild.nodeValue")).deepEquals(["B", "A"])
		render(root, [
			trust("<span>B</span>"),
			trust("<span>B</span>"),
		])
		o(childKeysOf(root, "nodeName")).deepEquals(["SPAN", "SPAN"])
		o(childKeysOf(root, "firstChild.nodeValue")).deepEquals(["B", "B"])
	})
})
