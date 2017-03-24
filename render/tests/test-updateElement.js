"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("updateElement", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("updates attr", function() {
		var vnode = {tag: "a", attrs: {id: "b"}}
		var updated = {tag: "a", attrs: {id: "c"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.attributes["id"].nodeValue).equals("c")
	})
	o("adds attr", function() {
		var vnode = {tag: "a", attrs: {id: "b"}}
		var updated = {tag: "a", attrs: {id: "c", title: "d"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.attributes["title"].nodeValue).equals("d")
	})
	o("adds attr from empty attrs", function() {
		var vnode = {tag: "a"}
		var updated = {tag: "a", attrs: {title: "d"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.attributes["title"].nodeValue).equals("d")
	})
	o("removes attr", function() {
		var vnode = {tag: "a", attrs: {id: "b", title: "d"}}
		var updated = {tag: "a", attrs: {id: "c"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o("title" in updated.dom.attributes).equals(false)
	})
	o("removes class", function() {
		var vnode = {tag: "a", attrs: {id: "b", className: "d"}}
		var updated = {tag: "a", attrs: {id: "c"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(vnode.dom)
		o(updated.dom).equals(root.firstChild)
		o("class" in updated.dom.attributes).equals(false)
	})
	o("creates style object", function() {
		var vnode = {tag: "a", attrs: {}}
		var updated = {tag: "a", attrs: {style: {backgroundColor: "green"}}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("creates style string", function() {
		var vnode = {tag: "a", attrs: {}}
		var updated = {tag: "a", attrs: {style: "background-color:green"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("updates style from object to object", function() {
		var vnode = {tag: "a", attrs: {style: {backgroundColor: "red"}}}
		var updated = {tag: "a", attrs: {style: {backgroundColor: "green"}}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("updates style from object to string", function() {
		var vnode = {tag: "a", attrs: {style: {backgroundColor: "red"}}}
		var updated = {tag: "a", attrs: {style: "background-color:green;"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("handles noop style change when style is string", function() {
		var vnode = {tag: "a", attrs: {style: "background-color:green;"}}
		var updated = {tag: "a", attrs: {style: "background-color:green;"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("handles noop style change when style is object", function() {
		var vnode = {tag: "a", attrs: {style: {backgroundColor: "red"}}}
		var updated = {tag: "a", attrs: {style: {backgroundColor: "red"}}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("red")
	})
	o("updates style from string to object", function() {
		var vnode = {tag: "a", attrs: {style: "background-color:red;"}}
		var updated = {tag: "a", attrs: {style: {backgroundColor: "green"}}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("updates style from string to string", function() {
		var vnode = {tag: "a", attrs: {style: "background-color:red;"}}
		var updated = {tag: "a", attrs: {style: "background-color:green;"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("green")
	})
	o("removes style from object to object", function() {
		var vnode = {tag: "a", attrs: {style: {backgroundColor: "red", border: "1px solid red"}}}
		var updated = {tag: "a", attrs: {style: {backgroundColor: "red"}}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).equals("")
	})
	o("removes style from string to object", function() {
		var vnode = {tag: "a", attrs: {style: "background-color:red;border:1px solid red"}}
		var updated = {tag: "a", attrs: {style: {backgroundColor: "red"}}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).notEquals("1px solid red")
	})
	o("removes style from object to string", function() {
		var vnode = {tag: "a", attrs: {style: {backgroundColor: "red", border: "1px solid red"}}}
		var updated = {tag: "a", attrs: {style: "background-color:red"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).equals("")
	})
	o("removes style from string to string", function() {
		var vnode = {tag: "a", attrs: {style: "background-color:red;border:1px solid red"}}
		var updated = {tag: "a", attrs: {style: "background-color:red"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("red")
		o(updated.dom.style.border).equals("")
	})
	o("updates style when it's same object but mutated", function() {
		var style = {backgroundColor: "red", color: "gold"}
		var vnode = {tag: "a", attrs: {style: style}}

		render(root, [vnode])

		delete style.backgroundColor
		var updated = {tag: "a", attrs: {style: style}}
		render(root, [updated])

		o(updated.dom.style.backgroundColor).equals("")
		o(updated.dom.style.color).equals("gold")
	})
	o("replaces el", function() {
		var vnode = {tag: "a"}
		var updated = {tag: "b"}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeName).equals("B")
	})
	o("updates svg class", function() {
		var vnode = {tag: "svg", attrs: {className: "a"}}
		var updated = {tag: "svg", attrs: {className: "b"}}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.attributes["class"].nodeValue).equals("b")
	})
	o("updates svg child", function() {
		var vnode = {tag: "svg", children: [{
			tag: "circle"
		}]}
		var updated = {tag: "svg", children: [{
			tag: "line"
		}]}

		render(root, [vnode])
		render(root, [updated])

		o(updated.dom.firstChild.namespaceURI).equals("http://www.w3.org/2000/svg")
	})
	o("restores correctly when recycling", function() {
		var vnode = {tag: "div", key: 1}
		var updated = {tag: "div", key: 2}

		render(root, [vnode])
		var a = vnode.dom

		render(root, [updated])

		render(root, [vnode])
		var c = vnode.dom

		o(root.childNodes.length).equals(1)
		o(a).equals(c)
	})
	o("restores correctly when recycling via map", function() {
		var a = {tag: "div", key: 1}
		var b = {tag: "div", key: 2}
		var c = {tag: "div", key: 3}
		var d = {tag: "div", key: 4}
		var e = {tag: "div", key: 5}
		var f = {tag: "div", key: 6}

		render(root, [a, b, c])
		var x = root.childNodes[1]

		render(root, [d])

		render(root, [e, b, f])
		var y = root.childNodes[1]

		o(root.childNodes.length).equals(3)
		o(x).equals(y)
	})
})
