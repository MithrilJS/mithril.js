"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../src/core/render")
var m = require("../../src/core/hyperscript")

o.spec("updateElement", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("updates attr", function() {
		var vnode = m("a", {id: "b"})
		var updated = m("a", {id: "c"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.attributes["id"].value).equals("c")
	})
	o("adds attr", function() {
		var vnode = m("a", {id: "b"})
		var updated = m("a", {id: "c", title: "d"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.attributes["title"].value).equals("d")
	})
	o("adds attr from empty attrs", function() {
		var vnode = m("a")
		var updated = m("a", {title: "d"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.attributes["title"].value).equals("d")
	})
	o("removes attr", function() {
		var vnode = m("a", {id: "b", title: "d"})
		var updated = m("a", {id: "c"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o("title" in updated.dom.attributes).equals(false)
	})
	o("removes class", function() {
		var vnode = m("a", {id: "b", className: "d"})
		var updated = m("a", {id: "c"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o("class" in updated.dom.attributes).equals(false)
	})
	o("creates style object", function() {
		var vnode = m("a")
		var updated = m("a", {style: {backgroundColor: "green"}})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("creates style string", function() {
		var vnode = m("a")
		var updated = m("a", {style: "background-color:green"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("updates style from object to object", function() {
		var vnode = m("a", {style: {backgroundColor: "red"}})
		var updated = m("a", {style: {backgroundColor: "green"}})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("updates style from object to string", function() {
		var vnode = m("a", {style: {backgroundColor: "red"}})
		var updated = m("a", {style: "background-color:green;"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("handles noop style change when style is string", function() {
		var vnode = m("a", {style: "background-color:green;"})
		var updated = m("a", {style: "background-color:green;"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("handles noop style change when style is object", function() {
		var vnode = m("a", {style: {backgroundColor: "red"}})
		var updated = m("a", {style: {backgroundColor: "red"}})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("red")
	})
	o("updates style from string to object", function() {
		var vnode = m("a", {style: "background-color:red;"})
		var updated = m("a", {style: {backgroundColor: "green"}})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("updates style from string to string", function() {
		var vnode = m("a", {style: "background-color:red;"})
		var updated = m("a", {style: "background-color:green;"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("removes style from object to object", function() {
		var vnode = m("a", {style: {backgroundColor: "red", border: "1px solid red"}})
		var updated = m("a", {style: {backgroundColor: "red"}})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).equals("")
	})
	o("removes style from string to object", function() {
		var vnode = m("a", {style: "background-color:red;border:1px solid red"})
		var updated = m("a", {style: {backgroundColor: "red"}})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).notEquals("1px solid red")
	})
	o("removes style from object to string", function() {
		var vnode = m("a", {style: {backgroundColor: "red", border: "1px solid red"}})
		var updated = m("a", {style: "background-color:red"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).equals("")
	})
	o("removes style from string to string", function() {
		var vnode = m("a", {style: "background-color:red;border:1px solid red"})
		var updated = m("a", {style: "background-color:red"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).equals("")
	})
	o("does not re-render element styles for equivalent style objects", function() {
		var style = {color: "gold"}
		var vnode = m("a", {style: style})

		render(root, vnode)

		root.firstChild.style.color = "red"
		style = {color: "gold"}
		var updated = m("a", {style: style})
		render(root, updated)

		o(updated.dom.style.color).equals("red")
	})
	o("setting style to `null` removes all styles", function() {
		var vnode = m("p", {style: "background-color: red"})
		var updated = m("p", {style: null})

		render(root, vnode)

		o("style" in vnode.dom.attributes).equals(true)
		o(vnode.dom.attributes.style.value).equals("background-color: red;")

		render(root, updated)

		//browsers disagree here
		try {
			o(updated.dom.attributes.style.value).equals("")

		} catch (e) {
			o("style" in updated.dom.attributes).equals(false)

		}
	})
	o("setting style to `undefined` removes all styles", function() {
		var vnode = m("p", {style: "background-color: red"})
		var updated = m("p", {style: undefined})

		render(root, vnode)

		o("style" in vnode.dom.attributes).equals(true)
		o(vnode.dom.attributes.style.value).equals("background-color: red;")

		render(root, updated)

		//browsers disagree here
		try {

			o(updated.dom.attributes.style.value).equals("")

		} catch (e) {

			o("style" in updated.dom.attributes).equals(false)

		}
	})
	o("not setting style removes all styles", function() {
		var vnode = m("p", {style: "background-color: red"})
		var updated = m("p")

		render(root, vnode)

		o("style" in vnode.dom.attributes).equals(true)
		o(vnode.dom.attributes.style.value).equals("background-color: red;")

		render(root, updated)

		//browsers disagree here
		try {

			o(updated.dom.attributes.style.value).equals("")

		} catch (e) {

			o("style" in updated.dom.attributes).equals(false)

		}
	})
	o("replaces el", function() {
		var vnode = m("a")
		var updated = m("b")

		render(root, vnode)
		render(root, updated)

		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeName).equals("B")
	})
	o("updates svg class", function() {
		var vnode = m("svg", {className: "a"})
		var updated = m("svg", {className: "b"})

		render(root, vnode)
		render(root, updated)

		o(updated.dom.attributes["class"].value).equals("b")
	})
	o("updates svg child", function() {
		var vnode = m("svg", m("circle"))
		var updated = m("svg", m("line"))

		render(root, vnode)
		render(root, updated)

		o(updated.dom.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
	})
})
