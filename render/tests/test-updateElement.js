"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("updateElement", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
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
	o("re-render element styles for the same style object", function() {
		var style = {color: "gold"}
		var vnode = m("a", {style: style})

		render(root, vnode)

		// modify the same object
		style.color = "red"
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
	o("use style property setter only when cameCase keys", function() {
		var spySetProperty = o.spy()
		var spyRemoveProperty = o.spy()
		var spyDashed1 = o.spy()
		var spyDashed2 = o.spy()
		var spyDashed3 = o.spy()
		var spyCamelCase1 = o.spy()
		var spyCamelCase2 = o.spy()

		render(root, m("a"))
		var el = root.firstChild

		el.style.setProperty = spySetProperty
		el.style.removeProperty = spyRemoveProperty
		Object.defineProperties(el.style, {
			/* eslint-disable accessor-pairs */
			"background-color": {set: spyDashed1},
			"-webkit-border-radius": {set: spyDashed2},
			"--foo": {set: spyDashed3},
			backgroundColor: {set: spyCamelCase1},
			color: {set: spyCamelCase2}
			/* eslint-enable accessor-pairs */
		})

		// sets dashed properties
		render(root, m("a", {
			style: {
				"background-color": "red",
				"-webkit-border-radius": "10px",
				"--foo": "bar"
			}
		}))
		o(spySetProperty.callCount).equals(3)
		o(spySetProperty.calls[0].args).deepEquals(["background-color", "red"])
		o(spySetProperty.calls[1].args).deepEquals(["-webkit-border-radius", "10px"])
		o(spySetProperty.calls[2].args).deepEquals(["--foo", "bar"])

		// sets camelCase properties and removes dashed properties
		render(root, m("a", {
			style: {
				backgroundColor: "green",
				color: "red",
			}
		}))
		o(spyCamelCase1.callCount).equals(1)
		o(spyCamelCase2.callCount).equals(1)
		o(spyCamelCase1.calls[0].args).deepEquals(["green"])
		o(spyCamelCase2.calls[0].args).deepEquals(["red"])
		o(spyRemoveProperty.callCount).equals(3)
		o(spyRemoveProperty.calls[0].args).deepEquals(["background-color"])
		o(spyRemoveProperty.calls[1].args).deepEquals(["-webkit-border-radius"])
		o(spyRemoveProperty.calls[2].args).deepEquals(["--foo"])

		// updates "color" and removes "backgroundColor"
		render(root, m("a", {style: {color: "blue"}}))
		o(spyCamelCase1.callCount).equals(2) // set and remove
		o(spyCamelCase2.callCount).equals(2) // set and update
		o(spyCamelCase1.calls[1].args).deepEquals([""])
		o(spyCamelCase2.calls[1].args).deepEquals(["blue"])

		// unchanged by camelCase properties
		o(spySetProperty.callCount).equals(3)
		o(spyRemoveProperty.callCount).equals(3)

		// never calls dashed property setter
		o(spyDashed1.callCount).equals(0)
		o(spyDashed2.callCount).equals(0)
		o(spyDashed3.callCount).equals(0)
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
	o("doesn't restore since we're not recycling", function() {
		var vnode = m("div", {key: 1})
		var updated = m("div", {key: 2})

		render(root, vnode)
		var a = vnode.dom

		render(root, updated)

		render(root, vnode)
		var c = vnode.dom

		o(root.childNodes.length).equals(1)
		o(a).notEquals(c) // this used to be a recycling pool test
	})
	o("doesn't restore since we're not recycling (via map)", function() {
		var a = m("div", {key: 1})
		var b = m("div", {key: 2})
		var c = m("div", {key: 3})
		var d = m("div", {key: 4})
		var e = m("div", {key: 5})
		var f = m("div", {key: 6})

		render(root, [a, b, c])
		var x = root.childNodes[1]

		render(root, d)

		render(root, [e, b, f])
		var y = root.childNodes[1]

		o(root.childNodes.length).equals(3)
		o(x).notEquals(y) // this used to be a recycling pool test
	})
	o.spec("element node with `is` attribute", function() {
		o("recreate element node with `is` attribute (set `is`)", function() {
			var vnode = m("a")
			var updated = m("a", {is: "bar"})

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("bar")
		})
		o("recreate element node without `is` attribute (remove `is`)", function() {
			var vnode = m("a", {is: "foo"})
			var updated = m("a")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals(null)
		})
		o("recreate element node with `is` attribute (same tag, different `is`)", function() {
			var vnode = m("a", {is: "foo"})
			var updated = m("a", {is: "bar"})

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("bar")
		})
		o("recreate element node with `is` attribute (different tag, same `is`)", function() {
			var vnode = m("a", {is: "foo"})
			var updated = m("b", {is: "foo"})

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("B")
			o(updated.dom.getAttribute("is")).equals("foo")
		})
		o("recreate element node with `is` attribute (different tag, different `is`)", function() {
			var vnode = m("a", {is: "foo"})
			var updated = m("b", {is: "bar"})

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("B")
			o(updated.dom.getAttribute("is")).equals("bar")
		})
		o("keep element node with `is` attribute (same tag, same `is`)", function() {
			var vnode = m("a", {is: "foo"})
			var updated = m("a", {is: "foo"}, "x")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).equals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("foo")
			o(updated.dom.firstChild.nodeValue).equals("x")
		})
		o("recreate element node with `is` attribute (set `is`, CSS selector)", function() {
			var vnode = m("a")
			var updated = m("a[is=bar]")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("bar")
		})
		o("recreate element node without `is` attribute (remove `is`, CSS selector)", function() {
			var vnode = m("a[is=foo]")
			var updated = m("a")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals(null)
		})
		o("recreate element node with `is` attribute (same tag, different `is`, CSS selector)", function() {
			var vnode = m("a[is=foo]")
			var updated = m("a[is=bar]")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("bar")
		})
		o("recreate element node with `is` attribute (different tag, same `is`, CSS selector)", function() {
			var vnode = m("a[is=foo]")
			var updated = m("b[is=foo]")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("B")
			o(updated.dom.getAttribute("is")).equals("foo")
		})
		o("recreate element node with `is` attribute (different tag, different `is`, CSS selector)", function() {
			var vnode = m("a[is=foo]")
			var updated = m("b[is=bar]")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).notEquals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("B")
			o(updated.dom.getAttribute("is")).equals("bar")
		})
		o("keep element node with `is` attribute (same tag, same `is`, CSS selector)", function() {
			var vnode = m("a[is=foo]")
			var updated = m("a[is=foo]", "x")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).equals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("foo")
			o(updated.dom.firstChild.nodeValue).equals("x")
		})
		o("keep element node with `is` attribute (same tag, same `is`, from attrs to CSS selector)", function() {
			var vnode = m("a", {is: "foo"})
			var updated = m("a[is=foo]", "x")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).equals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("foo")
			o(updated.dom.firstChild.nodeValue).equals("x")
		})
		o("keep element node with `is` attribute (same tag, same `is`, from CSS selector to attrs)", function() {
			var vnode = m("a[is=foo]")
			var updated = m("a", {is: "foo"}, "x")

			render(root, vnode)
			render(root, updated)
			
			o(vnode.dom).equals(root.firstChild)
			o(updated.dom).equals(root.firstChild)
			o(updated.dom.nodeName).equals("A")
			o(updated.dom.getAttribute("is")).equals("foo")
			o(updated.dom.firstChild.nodeValue).equals("x")
		})
	})
})
