"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
var vdom = require("../../render/render")

o.spec("updateNodes", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("handles el noop", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var updated = [m("a", {key: 1}), m("b", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("handles el noop without key", function() {
		var vnodes = [m("a"), m("b")]
		var updated = [m("a"), m("b")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("handles text noop", function() {
		var vnodes = [m("#", "a")]
		var updated = [m("#", "a")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeValue).equals("a")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles text noop w/ type casting", function() {
		var vnodes = [m("#", 1)]
		var updated = [m("#", "1")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeValue).equals("1")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles falsy text noop w/ type casting", function() {
		var vnodes = [m("#", 0)]
		var updated = [m("#", "0")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeValue).equals("0")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles html noop", function() {
		var vnodes = [m("<", "a")]
		var updated = [m("<", "a")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeValue).equals("a")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles fragment noop", function() {
		var vnodes = [m("[", [m("a")])]
		var updated = [m("[", [m("a")])]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles fragment noop w/ text child", function() {
		var vnodes = [m("[", [m("#", "a")])]
		var updated = [m("[", [m("#", "a")])]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeValue).equals("a")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("reverses els w/ even count", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4})]
		var updated = [m("s", {key: 4}), m("i", {key: 3}), m("b", {key: 2}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(4)
		o(updated[0].dom.nodeName).equals("S")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("B")
		o(updated[2].dom).equals(root.childNodes[2])
		o(updated[3].dom.nodeName).equals("A")
		o(updated[3].dom).equals(root.childNodes[3])
	})
	o("reverses els w/ odd count", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3})]
		var updated = [m("i", {key: 3}), m("b", {key: 2}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("A")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("creates el at start", function() {
		var vnodes = [m("a", {key: 1})]
		var updated = [m("b", {key: 2}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("creates el at end", function() {
		var vnodes = [m("a", {key: 1})]
		var updated = [m("a", {key: 1}), m("b", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("creates el in middle", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var updated = [m("a", {key: 1}), m("i", {key: 3}), m("b", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("B")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("creates el while reversing", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var updated = [m("b", {key: 2}), m("i", {key: 3}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("A")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("deletes el at start", function() {
		var vnodes = [m("b", {key: 2}), m("a", {key: 1})]
		var updated = [m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("deletes el at end", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var updated = [m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("deletes el at middle", function() {
		var vnodes = [m("a", {key: 1}), m("i", {key: 3}), m("b", {key: 2})]
		var updated = [m("a", {key: 1}), m("b", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("deletes el while reversing", function() {
		var vnodes = [m("a", {key: 1}), m("i", {key: 3}), m("b", {key: 2})]
		var updated = [m("b", {key: 2}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("creates, deletes, reverses els at same time", function() {
		var vnodes = [m("a", {key: 1}), m("i", {key: 3}), m("b", {key: 2})]
		var updated = [m("b", {key: 2}), m("a", {key: 1}), m("s", {key: 4})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("S")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("adds to empty array followed by el", function() {
		var vnodes = [m("[", {key: 1}), m("b", {key: 2})]
		var updated = [m("[", {key: 1}, [m("a")]), m("b", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].children[0].dom.nodeName).equals("A")
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("reverses followed by el", function() {
		var vnodes = [m("[", {key: 1}, [m("a", {key: 2}), m("b", {key: 3})]), m("i", {key: 4})]
		var updated = [m("[", {key: 1}, [m("b", {key: 3}), m("a", {key: 2})]), m("i", {key: 4})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].children[0].dom.nodeName).equals("B")
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[0].children[1].dom.nodeName).equals("A")
		o(updated[0].children[1].dom).equals(root.childNodes[1])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[2])
	})
	o("updates empty array to html with same key", function() {
		var vnodes = [m("[", {key: 1})]
		var updated = [m("<", {key: 1}, "<a></a><b></b>")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates empty html to array with same key", function() {
		var vnodes = [m("<", {key: 1}, "")]
		var updated = [m("[", {key: 1}, [m("a"), m("b")])]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates empty array to html without key", function() {
		var vnodes = [m("[")]
		var updated = [m("<", "<a></a><b></b>")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates empty html to array without key", function() {
		var vnodes = [m("<", "")]
		var updated = [m("[", [m("a"), m("b")])]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates array to html with same key", function() {
		var vnodes = [m("[", {key: 1}, [m("a"), m("b")])]
		var updated = [m("<", {key: 1}, "<i></i><s></s>")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("S")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates html to array with same key", function() {
		var vnodes = [m("<", {key: 1}, "<a></a><b></b>")]
		var updated = [m("[", {key: 1}, [m("i"), m("s")])]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("S")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates array to html without key", function() {
		var vnodes = [m("[", [m("a"), m("b")])]
		var updated = [m("<", "<i></i><s></s>")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("S")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates html to array without key", function() {
		var vnodes = [m("<", "<a></a><b></b>")]
		var updated = [m("[", [m("i"), m("s")])]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("S")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates empty array to html with same key followed by el", function() {
		var vnodes = [m("[", {key: 1}), m("i", {key: 2})]
		var updated = [m("<", {key: 1}, "<a></a><b></b>"), m("i", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[2])
	})
	o("updates empty html to array with same key followed by el", function() {
		var vnodes = [m("[", {key: 1}), m("i", {key: 2})]
		var updated = [m("<", {key: 1}, "<a></a><b></b>"), m("i", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[2])
	})
	o("populates array followed by null then el", function() {
		var vnodes = [m("[", {key: 1}), null, m("i", {key: 2})]
		var updated = [m("[", {key: 1}, [m("a"), m("b")]), null, m("i", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("I")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("populates childless array followed by el", function() {
		var vnodes = [m("[", {key: 1}), m("i", {key: 2})]
		var updated = [m("[", {key: 1}, [m("a"), m("b")]), m("i", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[2])
	})
	o("populates childless array followed by null then el", function() {
		var vnodes = [m("[", {key: 1}), null, m("i", {key: 2})]
		var updated = [m("[", {key: 1}, [m("a"), m("b")]), null, m("i", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[0].domSize).equals(2)
		o(updated[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("I")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("moves from end to start", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4})]
		var updated = [m("s", {key: 4}), m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(4)
		o(updated[0].dom.nodeName).equals("S")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("B")
		o(updated[2].dom).equals(root.childNodes[2])
		o(updated[3].dom.nodeName).equals("I")
		o(updated[3].dom).equals(root.childNodes[3])
	})
	o("moves from start to end", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4})]
		var updated = [m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(4)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("S")
		o(updated[2].dom).equals(root.childNodes[2])
		o(updated[3].dom.nodeName).equals("A")
		o(updated[3].dom).equals(root.childNodes[3])
	})
	o("removes then recreate", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4})]
		var temp = []
		var updated = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(4)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("I")
		o(updated[2].dom).equals(root.childNodes[2])
		o(updated[3].dom.nodeName).equals("S")
		o(updated[3].dom).equals(root.childNodes[3])
	})
	o("removes then recreate reversed", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3}), m("s", {key: 4})]
		var temp = []
		var updated = [m("s", {key: 4}), m("i", {key: 3}), m("b", {key: 2}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(4)
		o(updated[0].dom.nodeName).equals("S")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("B")
		o(updated[2].dom).equals(root.childNodes[2])
		o(updated[3].dom.nodeName).equals("A")
		o(updated[3].dom).equals(root.childNodes[3])
	})
	o("removes then recreate smaller", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("a", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("removes then recreate bigger", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("I")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("removes then create different", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("i", {key: 3}), m("s", {key: 4})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("S")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("removes then create different smaller", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("i", {key: 3})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("removes then create different bigger", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("i", {key: 3}), m("s", {key: 4}), m("div", {key: 5})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("S")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("DIV")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("removes then create mixed", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("a", {key: 1}), m("s", {key: 4})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("S")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed reversed", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("s", {key: 4}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("S")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed smaller", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3})]
		var temp = []
		var updated = [m("a", {key: 1}), m("s", {key: 4})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("S")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed smaller reversed", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2}), m("i", {key: 3})]
		var temp = []
		var updated = [m("s", {key: 4}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("S")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed bigger", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("a", {key: 1}), m("i", {key: 3}), m("s", {key: 4})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("S")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("removes then create mixed bigger reversed", function() {
		var vnodes = [m("a", {key: 1}), m("b", {key: 2})]
		var temp = []
		var updated = [m("s", {key: 4}), m("i", {key: 3}), m("a", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("S")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("I")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[2].dom.nodeName).equals("A")
		o(updated[2].dom).equals(root.childNodes[2])
	})
	o("removes then recreates then reverses children", function() {
		var vnodes = [m("a", {key: 1}, [m("i", {key: 3}), m("s", {key: 4})]), m("b", {key: 2})]
		var temp1 = []
		var temp2 = [m("a", {key: 1}, [m("i", {key: 3}), m("s", {key: 4})]), m("b", {key: 2})]
		var updated = [m("a", {key: 1}, [m("s", {key: 4}), m("i", {key: 3})]), m("b", {key: 2})]

		render(root, vnodes)
		render(root, temp1)
		render(root, temp2)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
		o(updated[0].dom.childNodes.length).equals(2)
		o(updated[0].dom.childNodes[0].nodeName).equals("S")
		o(updated[0].dom.childNodes[1].nodeName).equals("I")
	})
	o("removes then recreates nested", function() {
		var vnodes = [m("a", {key: 1}, [m("a", {key: 3}, [m("a", {key: 5})]), m("a", {key: 4}, [m("a", {key: 5})])]), m("a", {key: 2})]
		var temp = []
		var updated = [m("a", {key: 1}, [m("a", {key: 3}, [m("a", {key: 5})]), m("a", {key: 4}, [m("a", {key: 5})])]), m("a", {key: 2})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].childNodes.length).equals(2)
		o(root.childNodes[0].childNodes[0].childNodes.length).equals(1)
		o(root.childNodes[0].childNodes[1].childNodes.length).equals(1)
		o(root.childNodes[1].childNodes.length).equals(0)
	})
	o("recycles", function() {
		var vnodes = [m("div", {key: 1})]
		var temp = []
		var updated = [m("div", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(vnodes[0].dom).equals(updated[0].dom)
		o(updated[0].dom.nodeName).equals("DIV")
	})
	o("recycles when not keyed", function() {
		var vnodes = [m("div")]
		var temp = []
		var updated = [m("div")]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom).equals(updated[0].dom)
		o(updated[0].dom.nodeName).equals("DIV")
	})
	o("recycles deep", function() {
		var vnodes = [m("div", [m("a", {key: 1})])]
		var temp = [m("div")]
		var updated = [m("div", [m("a", {key: 1})])]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(vnodes[0].dom.firstChild).equals(updated[0].dom.firstChild)
		o(updated[0].dom.firstChild.nodeName).equals("A")
	})
	o("mixed unkeyed tags are not broken by recycle", function() {
		var vnodes = [m("a"), m("b")]
		var temp = [m("b")]
		var updated = [m("a"), m("b")]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("mixed unkeyed vnode types are not broken by recycle", function() {
		var vnodes = [m("[", [m("a")]), m("b")]
		var temp = [m("b")]
		var updated = [m("[", [m("a")]), m("b")]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("fragment child toggles from null when followed by null component then tag", function() {
		var component = {view: function() {return null}}
		var vnodes = [m("[", [m("a"), m(component), m("b")])]
		var temp = [m("[", [null, m(component), m("b")])]
		var updated = [m("[", [m("a"), m(component), m("b")])]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("fragment child toggles from null in component when followed by null component then tag", function() {
		var flag = true
		var a = {view: function() {return flag ? m("a") : null}}
		var b = {view: function() {return null}}
		var vnodes = [m("[", [m(a), m(b), m("s")])]
		var temp = [m("[", [m(a), m(b), m("s")])]
		var updated = [m("[", [m(a), m(b), m("s")])]

		render(root, vnodes)
		flag = false
		render(root, temp)
		flag = true
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("S")
	})
})
