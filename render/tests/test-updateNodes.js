"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var fragment = require("../../render/fragment")
var trust = require("../../render/trust")

function vnodify(str) {
	return str.split(",").map(function(k) {return m(k, {key: k})})
}

o.spec("updateNodes", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window)
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
		var vnodes = "a"
		var updated = "a"

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(root.firstChild.nodeValue).equals("a")
	})
	o("handles text noop w/ type casting", function() {
		var vnodes = 1
		var updated = "1"

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(root.firstChild.nodeValue).equals("1")
	})
	o("handles falsy text noop w/ type casting", function() {
		var vnodes = 0
		var updated = "0"

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeValue).equals("0")
	})
	o("handles html noop", function() {
		var vnodes = trust("a")
		var updated = trust("a")

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(root.childNodes[0].nodeValue).equals("a")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("handles fragment noop", function() {
		var vnodes = fragment(m("a"))
		var updated = fragment(m("a"))

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated.dom.nodeName).equals("A")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("handles fragment noop w/ text child", function() {
		var vnodes = fragment("a")
		var updated = fragment("a")

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated.dom.nodeValue).equals("a")
		o(updated.dom).equals(root.childNodes[0])
	})
	o("handles undefined to null noop", function() {
		var vnodes = [null, m("div")]
		var updated = [undefined, m("div")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
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
		var expectedTags = updated.map(function(vn) {return vn.tag})
		render(root, vnodes)
		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[1].dom.nodeName).equals("B")
		o(updated[2].dom.nodeName).equals("A")
		o(tagNames).deepEquals(expectedTags)
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
	o("creates, deletes, reverses els at same time with '__proto__' key", function() {
		var vnodes = [m("a", {key: "__proto__"}), m("i", {key: 3}), m("b", {key: 2})]
		var updated = [m("b", {key: 2}), m("a", {key: "__proto__"}), m("s", {key: 4})]

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
	o("adds to empty fragment followed by el", function() {
		var vnodes = [fragment({key: 1}), m("b", {key: 2})]
		var updated = [fragment({key: 1}, m("a")), m("b", {key: 2})]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].children[0].dom.nodeName).equals("A")
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("reverses followed by el", function() {
		var vnodes = [fragment({key: 1}, m("a", {key: 2}), m("b", {key: 3})), m("i", {key: 4})]
		var updated = [fragment({key: 1}, m("b", {key: 3}), m("a", {key: 2})), m("i", {key: 4})]

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
	o("updates empty fragment to html without key", function() {
		var vnodes = fragment()
		var updated = trust("<a></a><b></b>")

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated.dom.nodeName).equals("A")
		o(updated.dom).equals(root.childNodes[0])
		o(updated.domSize).equals(2)
		o(updated.dom.nextSibling.nodeName).equals("B")
		o(updated.dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates empty html to fragment without key", function() {
		var vnodes = trust()
		var updated = fragment(m("a"), m("b"))

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated.dom.nodeName).equals("A")
		o(updated.dom).equals(root.childNodes[0])
		o(updated.domSize).equals(2)
		o(updated.dom.nextSibling.nodeName).equals("B")
		o(updated.dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates fragment to html without key", function() {
		var vnodes = fragment(m("a"), m("b"))
		var updated = trust("<i></i><s></s>")

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated.dom.nodeName).equals("I")
		o(updated.dom).equals(root.childNodes[0])
		o(updated.domSize).equals(2)
		o(updated.dom.nextSibling.nodeName).equals("S")
		o(updated.dom.nextSibling).equals(root.childNodes[1])
	})
	o("updates html to fragment without key", function() {
		var vnodes = trust("<a></a><b></b>")
		var updated = fragment(m("i"), m("s"))

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated.dom.nodeName).equals("I")
		o(updated.dom).equals(root.childNodes[0])
		o(updated.domSize).equals(2)
		o(updated.dom.nextSibling.nodeName).equals("S")
		o(updated.dom.nextSibling).equals(root.childNodes[1])
	})
	o("populates fragment followed by el keyed", function() {
		var vnodes = [fragment({key: 1}), m("i", {key: 2})]
		var updated = [fragment({key: 1}, m("a"), m("b")), m("i", {key: 2})]

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
	o("throws if fragment followed by null then el on first render keyed", function() {
		var vnodes = [fragment({key: 1}), null, m("i", {key: 2})]

		o(function () { render(root, vnodes) }).throws(TypeError)
	})
	o("throws if fragment followed by null then el on next render keyed", function() {
		var vnodes = [fragment({key: 1}), m("i", {key: 2})]
		var updated = [fragment({key: 1}, m("a"), m("b")), null, m("i", {key: 2})]

		render(root, vnodes)
		o(function () { render(root, updated) }).throws(TypeError)
	})
	o("populates childless fragment replaced followed by el keyed", function() {
		var vnodes = [fragment({key: 1}), m("i", {key: 2})]
		var updated = [fragment({key: 1}, m("a"), m("b")), m("i", {key: 2})]

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
	o("throws if childless fragment replaced followed by null then el keyed", function() {
		var vnodes = [fragment({key: 1}), m("i", {key: 2})]
		var updated = [fragment({key: 1}, m("a"), m("b")), null, m("i", {key: 2})]

		render(root, vnodes)
		o(function () { render(root, updated) }).throws(TypeError)
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
	o("cached keyed nodes move when the list is reversed", function(){
		var a = m("a", {key: "a"})
		var b = m("b", {key: "b"})
		var c = m("c", {key: "c"})
		var d = m("d", {key: "d"})

		render(root, [a, b, c, d])
		render(root, [d, c, b, a])

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("D")
		o(root.childNodes[1].nodeName).equals("C")
		o(root.childNodes[2].nodeName).equals("B")
		o(root.childNodes[3].nodeName).equals("A")
	})
	o("cached keyed nodes move when diffed via the map", function() {
		var onupdate = o.spy()
		var a = m("a", {key: "a", onupdate: onupdate})
		var b = m("b", {key: "b", onupdate: onupdate})
		var c = m("c", {key: "c", onupdate: onupdate})
		var d = m("d", {key: "d", onupdate: onupdate})

		render(root, [a, b, c, d])
		render(root, [b, d, a, c])

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("B")
		o(root.childNodes[1].nodeName).equals("D")
		o(root.childNodes[2].nodeName).equals("A")
		o(root.childNodes[3].nodeName).equals("C")
		o(onupdate.callCount).equals(0)
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
	o("change type, position and length", function() {
		var vnodes = m("div",
			undefined,
			m("#", "a")
		)
		var updated = m("div",
			fragment(m("#", "b")),
			undefined,
			undefined
		)

		render(root, vnodes)
		render(root, updated)

		o(root.firstChild.childNodes.length).equals(1)
	})
	o("removes then recreates then reverses children", function() {
		var vnodes = [m("a", {key: 1}, m("i", {key: 3}), m("s", {key: 4})), m("b", {key: 2})]
		var temp1 = []
		var temp2 = [m("a", {key: 1}, m("i", {key: 3}), m("s", {key: 4})), m("b", {key: 2})]
		var updated = [m("a", {key: 1}, m("s", {key: 4}), m("i", {key: 3})), m("b", {key: 2})]

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
		var vnodes = [m("a", {key: 1}, m("a", {key: 3}, m("a", {key: 5})), m("a", {key: 4}, m("a", {key: 5}))), m("a", {key: 2})]
		var temp = []
		var updated = [m("a", {key: 1}, m("a", {key: 3}, m("a", {key: 5})), m("a", {key: 4}, m("a", {key: 5}))), m("a", {key: 2})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].childNodes.length).equals(2)
		o(root.childNodes[0].childNodes[0].childNodes.length).equals(1)
		o(root.childNodes[0].childNodes[1].childNodes.length).equals(1)
		o(root.childNodes[1].childNodes.length).equals(0)
	})
	o("doesn't recycle", function() {
		var vnodes = [m("div", {key: 1})]
		var temp = []
		var updated = [m("div", {key: 1})]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(vnodes[0].dom).notEquals(updated[0].dom) // this used to be a recycling pool test
		o(updated[0].dom.nodeName).equals("DIV")
	})
	o("doesn't recycle when not keyed", function() {
		var vnodes = [m("div")]
		var temp = []
		var updated = [m("div")]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(vnodes[0].dom).notEquals(updated[0].dom) // this used to be a recycling pool test
		o(updated[0].dom.nodeName).equals("DIV")
	})
	o("doesn't recycle deep", function() {
		var vnodes = [m("div", m("a", {key: 1}))]
		var temp = [m("div")]
		var updated = [m("div", m("a", {key: 1}))]

		render(root, vnodes)

		var oldChild = vnodes[0].dom.firstChild

		render(root, temp)
		render(root, updated)

		o(oldChild).notEquals(updated[0].dom.firstChild) // this used to be a recycling pool test
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
		var vnodes = [fragment(m("a")), m("b")]
		var temp = [m("b")]
		var updated = [fragment(m("a")), m("b")]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("onremove doesn't fire from nodes in the pool (#1990)", function () {
		var onremove = o.spy()
		render(root, [
			m("div", m("div", {onremove: onremove})),
			m("div", m("div", {onremove: onremove}))
		])
		render(root, [
			m("div", m("div", {onremove: onremove}))
		])
		render(root,[])

		o(onremove.callCount).equals(2)
	})
	o("cached, non-keyed nodes skip diff", function () {
		var onupdate = o.spy();
		var cached = m("a", {onupdate: onupdate})

		render(root, cached)
		render(root, cached)

		o(onupdate.callCount).equals(0)
	})
	o("cached, keyed nodes skip diff", function () {
		var onupdate = o.spy()
		var cached = m("a", {key: "a", onupdate: onupdate})

		render(root, cached)
		render(root, cached)

		o(onupdate.callCount).equals(0)
	})
	o("keyed cached elements are re-initialized when brought back from the pool (#2003)", function () {
		var onupdate = o.spy()
		var oncreate = o.spy()
		var cached = m("B", {key: 1},
			m("A", {oncreate: oncreate, onupdate: onupdate}, "A")
		)
		render(root, m("div", cached))
		render(root, [])
		render(root, m("div", cached))

		o(oncreate.callCount).equals(2)
		o(onupdate.callCount).equals(0)
	})

	o("unkeyed cached elements are re-initialized when brought back from the pool (#2003)", function () {
		var onupdate = o.spy()
		var oncreate = o.spy()
		var cached = m("B",
			m("A", {oncreate: oncreate, onupdate: onupdate}, "A")
		)
		render(root, m("div", cached))
		render(root, [])
		render(root, m("div", cached))

		o(oncreate.callCount).equals(2)
		o(onupdate.callCount).equals(0)
	})

	o("keyed cached elements are re-initialized when brought back from nested pools (#2003)", function () {
		var onupdate = o.spy()
		var oncreate = o.spy()
		var cached = m("B", {key: 1},
			m("A", {oncreate: oncreate, onupdate: onupdate}, "A")
		)
		render(root, m("div", cached))
		render(root, m("div"))
		render(root, [])
		render(root, m("div", cached))

		o(oncreate.callCount).equals(2)
		o(onupdate.callCount).equals(0)
	})

	o("unkeyed cached elements are re-initialized when brought back from nested pools (#2003)", function () {
		var onupdate = o.spy()
		var oncreate = o.spy()
		var cached = m("B",
			m("A", {oncreate: oncreate, onupdate: onupdate}, "A")
		)
		render(root, m("div", cached))
		render(root, m("div"))
		render(root, [])
		render(root, m("div", cached))

		o(oncreate.callCount).equals(2)
		o(onupdate.callCount).equals(0)
	})

	o("null stays in place", function() {
		var create = o.spy()
		var update = o.spy()
		var remove = o.spy()
		var vnodes = [m("div"), m("a", {oncreate: create, onupdate: update, onremove: remove})]
		var temp = [null, m("a", {oncreate: create, onupdate: update, onremove: remove})]
		var updated = [m("div"), m("a", {oncreate: create, onupdate: update, onremove: remove})]

		render(root, vnodes)
		var before = vnodes[1].dom
		render(root, temp)
		render(root, updated)
		var after = updated[1].dom

		o(before).equals(after)
		o(create.callCount).equals(1)
		o(update.callCount).equals(2)
		o(remove.callCount).equals(0)
	})
	o("null stays in place if not first", function() {
		var create = o.spy()
		var update = o.spy()
		var remove = o.spy()
		var vnodes = [m("b"), m("div"), m("a", {oncreate: create, onupdate: update, onremove: remove})]
		var temp = [m("b"), null, m("a", {oncreate: create, onupdate: update, onremove: remove})]
		var updated = [m("b"), m("div"), m("a", {oncreate: create, onupdate: update, onremove: remove})]

		render(root, vnodes)
		var before = vnodes[2].dom
		render(root, temp)
		render(root, updated)
		var after = updated[2].dom

		o(before).equals(after)
		o(create.callCount).equals(1)
		o(update.callCount).equals(2)
		o(remove.callCount).equals(0)
	})
	o("node is recreated if key changes to undefined", function () {
		var vnode = m("b", {key: 1})
		var updated = m("b")

		render(root, vnode)
		render(root, updated)

		o(vnode.dom).notEquals(updated.dom)
	})
	o("don't add back elements from fragments that are restored from the pool #1991", function() {
		render(root, [
			fragment(),
			fragment()
		])
		render(root, [
			fragment(),
			fragment(
				m("div")
			)
		])
		render(root, [
			fragment(null)
		])
		render(root, [
			fragment(),
			fragment()
		])

		o(root.childNodes.length).equals(0)
	})
	o("don't add back elements from fragments that are being removed #1991", function() {
		render(root, [
			fragment(),
			m("p"),
		])
		render(root, [
			fragment(
				m("div", 5)
			)
		])
		render(root, [
			fragment(),
			fragment()
		])

		o(root.childNodes.length).equals(0)
	})
	o("handles null values in unkeyed lists of different length (#2003)", function() {
		var oncreate = o.spy()
		var onremove = o.spy()
		var onupdate = o.spy()

		render(root, [m("div", {oncreate: oncreate, onremove: onremove, onupdate: onupdate}), null])
		render(root, [null, m("div", {oncreate: oncreate, onremove: onremove, onupdate: onupdate}), null])

		o(oncreate.callCount).equals(2)
		o(onremove.callCount).equals(1)
		o(onupdate.callCount).equals(0)
	})
	o("supports changing the element of a keyed element in a list when traversed bottom-up", function() {
		try {
			render(root, [m("a", {key: 2})])
			render(root, [m("b", {key: 1}), m("b", {key: 2})])

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("B")
			o(root.childNodes[1].nodeName).equals("B")
		} catch (e) {
			o(e).equals(null)
		}
	})
	o("supports changing the element of a keyed element in a list when looking up nodes using the map", function() {
		try {
			render(root, [m("x", {key: 1}), m("y", {key: 2}), m("z", {key: 3})])
			render(root, [m("b", {key: 2}), m("c", {key: 1}), m("d", {key: 4}), m("e", {key: 3})])

			o(root.childNodes.length).equals(4)
			o(root.childNodes[0].nodeName).equals("B")
			o(root.childNodes[1].nodeName).equals("C")
			o(root.childNodes[2].nodeName).equals("D")
			o(root.childNodes[3].nodeName).equals("E")
		} catch (e) {
			o(e).equals(null)
		}
	})
	o("don't fetch the nextSibling from the pool", function() {
		render(root, [fragment(m("div", {key: 1}), m("div", {key: 2})), m("p")])
		render(root, [fragment(), m("p")])
		render(root, [fragment(m("div", {key: 2}), m("div", {key: 1})), m("p")])

		o([].map.call(root.childNodes, function(el) {return el.nodeName})).deepEquals(["DIV", "DIV", "P"])
	})
	o("minimizes DOM operations when scrambling a keyed lists", function() {
		var vnodes = vnodify("a,b,c,d")
		var updated = vnodify("b,a,d,c")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(2)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("minimizes DOM operations when reversing a keyed lists with an odd number of items", function() {
		var vnodes = vnodify("a,b,c,d")
		var updated = vnodify("d,c,b,a")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(3)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("minimizes DOM operations when reversing a keyed lists with an even number of items", function() {
		var vnodes = vnodify("a,b,c")
		var updated = vnodify("c,b,a")
		var vnodes = [m("a", {key: "a"}), m("b", {key: "b"}), m("c", {key: "c"})]
		var updated = [m("c", {key: "c"}), m("b", {key: "b"}), m("a", {key: "a"})]
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(2)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("minimizes DOM operations when scrambling a keyed lists with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,d,j")
		var updated = vnodify("i,b,a,d,c,j")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(2)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("minimizes DOM operations when reversing a keyed lists with an odd number of items with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,d,j")
		var updated = vnodify("i,d,c,b,a,j")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(3)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("minimizes DOM operations when reversing a keyed lists with an even number of items with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,j")
		var updated = vnodify("i,c,b,a,j")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(2)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambling sample 1", function() {
		var vnodes = vnodify("k0,k1,k2,k3,k4,k5,k6,k7,k8,k9")
		var updated = vnodify("k4,k1,k2,k9,k0,k3,k6,k5,k8,k7")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(5)
		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambling sample 2", function() {
		var vnodes = vnodify("k0,k1,k2,k3,k4,k5,k6,k7,k8,k9")
		var updated = vnodify("b,d,k1,k0,k2,k3,k4,a,c,k5,k6,k7,k8,k9")
		var expectedTagNames = updated.map(function(vn) {return vn.tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(5)
		o(tagNames).deepEquals(expectedTagNames)
	})

	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o("fragment child toggles from null when followed by null component then tag", function() {
				var component = createComponent({view: function() {return null}})
				var vnodes = [fragment(m("a"), m(component), m("b"))]
				var temp = [fragment(null, m(component), m("b"))]
				var updated = [fragment(m("a"), m(component), m("b"))]

				render(root, vnodes)
				render(root, temp)
				render(root, updated)

				o(root.childNodes.length).equals(2)
				o(root.childNodes[0].nodeName).equals("A")
				o(root.childNodes[1].nodeName).equals("B")
			})
			o("fragment child toggles from null in component when followed by null component then tag", function() {
				var flag = true
				var a = createComponent({view: function() {return flag ? m("a") : null}})
				var b = createComponent({view: function() {return null}})
				var vnodes = [fragment(m(a), m(b), m("s"))]
				var temp = [fragment(m(a), m(b), m("s"))]
				var updated = [fragment(m(a), m(b), m("s"))]

				render(root, vnodes)
				flag = false
				render(root, temp)
				flag = true
				render(root, updated)

				o(root.childNodes.length).equals(2)
				o(root.childNodes[0].nodeName).equals("A")
				o(root.childNodes[1].nodeName).equals("S")
			})
			o("removing a component that returns a fragment doesn't throw (regression test for incidental bug introduced while debugging some Flems)", function() {
				var component = createComponent({
					view: function() {return fragment(m("a"), m("b"))}
				})
				try {
					render(root, [m(component)])
					render(root, [])

					o(root.childNodes.length).equals(0)
				} catch (e) {
					o(e).equals(null)
				}
			})
		})
	})
})
