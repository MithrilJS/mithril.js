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
	o("replaces el", function() {
		var vnode = {tag: "a"}
		var updated = {tag: "b"}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(updated.dom).equals(root.firstChild)
		o(updated.dom.nodeName).equals("B")
	})
})
