import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("updateElement", function() {
	var G = setupGlobals()

	o("updates attr", function() {
		var vnode = m("a", {id: "b"})
		var updated = m("a", {id: "c"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d).equals(vnode.d)
		o(updated.d).equals(G.root.firstChild)
		o(updated.d.attributes["id"].value).equals("c")
	})
	o("adds attr", function() {
		var vnode = m("a", {id: "b"})
		var updated = m("a", {id: "c", title: "d"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d).equals(vnode.d)
		o(updated.d).equals(G.root.firstChild)
		o(updated.d.attributes["title"].value).equals("d")
	})
	o("adds attr from empty attrs", function() {
		var vnode = m("a")
		var updated = m("a", {title: "d"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d).equals(vnode.d)
		o(updated.d).equals(G.root.firstChild)
		o(updated.d.attributes["title"].value).equals("d")
	})
	o("removes attr", function() {
		var vnode = m("a", {id: "b", title: "d"})
		var updated = m("a", {id: "c"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d).equals(vnode.d)
		o(updated.d).equals(G.root.firstChild)
		o("title" in updated.d.attributes).equals(false)
	})
	o("removes class", function() {
		var vnode = m("a", {id: "b", className: "d"})
		var updated = m("a", {id: "c"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d).equals(vnode.d)
		o(updated.d).equals(G.root.firstChild)
		o("class" in updated.d.attributes).equals(false)
	})
	o("creates style object", function() {
		var vnode = m("a")
		var updated = m("a", {style: {backgroundColor: "green"}})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("creates style string", function() {
		var vnode = m("a")
		var updated = m("a", {style: "background-color:green"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("updates style from object to object", function() {
		var vnode = m("a", {style: {backgroundColor: "red"}})
		var updated = m("a", {style: {backgroundColor: "green"}})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("updates style from object to string", function() {
		var vnode = m("a", {style: {backgroundColor: "red"}})
		var updated = m("a", {style: "background-color:green;"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("handles noop style change when style is string", function() {
		var vnode = m("a", {style: "background-color:green;"})
		var updated = m("a", {style: "background-color:green;"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("handles noop style change when style is object", function() {
		var vnode = m("a", {style: {backgroundColor: "red"}})
		var updated = m("a", {style: {backgroundColor: "red"}})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("red")
	})
	o("updates style from string to object", function() {
		var vnode = m("a", {style: "background-color:red;"})
		var updated = m("a", {style: {backgroundColor: "green"}})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("updates style from string to string", function() {
		var vnode = m("a", {style: "background-color:red;"})
		var updated = m("a", {style: "background-color:green;"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("green")
	})
	o("removes style from object to object", function() {
		var vnode = m("a", {style: {backgroundColor: "red", border: "1px solid red"}})
		var updated = m("a", {style: {backgroundColor: "red"}})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("red")
		o(updated.d.style.border).equals("")
	})
	o("removes style from string to object", function() {
		var vnode = m("a", {style: "background-color:red;border:1px solid red"})
		var updated = m("a", {style: {backgroundColor: "red"}})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("red")
		o(updated.d.style.border).notEquals("1px solid red")
	})
	o("removes style from object to string", function() {
		var vnode = m("a", {style: {backgroundColor: "red", border: "1px solid red"}})
		var updated = m("a", {style: "background-color:red"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("red")
		o(updated.d.style.border).equals("")
	})
	o("removes style from string to string", function() {
		var vnode = m("a", {style: "background-color:red;border:1px solid red"})
		var updated = m("a", {style: "background-color:red"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.style.backgroundColor).equals("red")
		o(updated.d.style.border).equals("")
	})
	o("does not re-render element styles for equivalent style objects", function() {
		var style = {color: "gold"}
		var vnode = m("a", {style: style})

		m.render(G.root, vnode)

		G.root.firstChild.style.color = "red"
		style = {color: "gold"}
		var updated = m("a", {style: style})
		m.render(G.root, updated)

		o(updated.d.style.color).equals("red")
	})
	o("setting style to `null` removes all styles", function() {
		var vnode = m("p", {style: "background-color: red"})
		var updated = m("p", {style: null})

		m.render(G.root, vnode)

		o("style" in vnode.d.attributes).equals(true)
		o(vnode.d.attributes.style.value).equals("background-color: red;")

		m.render(G.root, updated)

		//browsers disagree here
		try {
			o(updated.d.attributes.style.value).equals("")

		} catch (e) {
			o("style" in updated.d.attributes).equals(false)

		}
	})
	o("setting style to `undefined` removes all styles", function() {
		var vnode = m("p", {style: "background-color: red"})
		var updated = m("p", {style: undefined})

		m.render(G.root, vnode)

		o("style" in vnode.d.attributes).equals(true)
		o(vnode.d.attributes.style.value).equals("background-color: red;")

		m.render(G.root, updated)

		//browsers disagree here
		try {

			o(updated.d.attributes.style.value).equals("")

		} catch (e) {

			o("style" in updated.d.attributes).equals(false)

		}
	})
	o("not setting style removes all styles", function() {
		var vnode = m("p", {style: "background-color: red"})
		var updated = m("p")

		m.render(G.root, vnode)

		o("style" in vnode.d.attributes).equals(true)
		o(vnode.d.attributes.style.value).equals("background-color: red;")

		m.render(G.root, updated)

		//browsers disagree here
		try {

			o(updated.d.attributes.style.value).equals("")

		} catch (e) {

			o("style" in updated.d.attributes).equals(false)

		}
	})
	o("replaces el", function() {
		var vnode = m("a")
		var updated = m("b")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d).equals(G.root.firstChild)
		o(updated.d.nodeName).equals("B")
	})
	o("updates svg class", function() {
		var vnode = m("svg", {className: "a"})
		var updated = m("svg", {className: "b"})

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.attributes["class"].value).equals("b")
	})
	o("updates svg child", function() {
		var vnode = m("svg", m("circle"))
		var updated = m("svg", m("line"))

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o(updated.d.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
	})
})
