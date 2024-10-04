"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../render/render")
var m = require("../../render/hyperscript")

function vnodify(str) {
	return str.split(",").map((k) => m.key(k, m(k)))
}

o.spec("updateNodes", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
	})

	o("handles el noop", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

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
	o("handles fragment noop", function() {
		var vnodes = [m("a")]
		var updated = [m("a")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles fragment noop w/ text child", function() {
		var vnodes = [m.normalize("a")]
		var updated = [m.normalize("a")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeValue).equals("a")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles undefined to null noop", function() {
		var vnodes = [null, m("div")]
		var updated = [undefined, m("div")]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
	})
	o("reverses els w/ even count", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var updated = [m.key(4, m("s")), m.key(3, m("i")), m.key(2, m("b")), m.key(1, m("a"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]
		var updated = [m.key(3, m("i")), m.key(2, m("b")), m.key(1, m("a"))]
		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[1].dom.nodeName).equals("B")
		o(updated[2].dom.nodeName).equals("A")
	})
	o("creates el at start", function() {
		var vnodes = [m.key(1, m("a"))]
		var updated = [m.key(2, m("b")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("creates el at end", function() {
		var vnodes = [m.key(1, m("a"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("creates el in middle", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key(3, m("i")), m.key(1, m("a"))]

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
		var vnodes = [m.key(2, m("b")), m.key(1, m("a"))]
		var updated = [m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("deletes el at end", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("deletes el at middle", function() {
		var vnodes = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("deletes el while reversing", function() {
		var vnodes = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].dom.nodeName).equals("B")
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("A")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("creates, deletes, reverses els at same time", function() {
		var vnodes = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key(1, m("a")), m.key(4, m("s"))]

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
		var vnodes = [m.key("__proto__", m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key("__proto__", m("a")), m.key(4, m("s"))]

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
		var vnodes = [m.key(1), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(updated[0].children[0].dom.nodeName).equals("A")
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].dom.nodeName).equals("B")
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("reverses followed by el", function() {
		var vnodes = [m.key(1, m.key(2, m("a")), m.key(3, m("b"))), m.key(4, m("i"))]
		var updated = [m.key(1, m.key(3, m("b")), m.key(2, m("a"))), m.key(4, m("i"))]

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
	o("populates fragment followed by el keyed", function() {
		var vnodes = [m.key(1), m.key(2, m("i"))]
		var updated = [m.key(1, m("a"), m("b")), m.key(2, m("i"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].children[0].dom.nodeName).equals("A")
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[0].children[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].children[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[1].children[0].dom.nodeName).equals("I")
		o(updated[1].children[0].dom).equals(root.childNodes[2])
	})
	o("throws if fragment followed by null then el on first render keyed", function() {
		var vnodes = [m.key(1), null, m.key(2, m("i"))]

		o(function () { render(root, vnodes) }).throws(TypeError)
	})
	o("throws if fragment followed by null then el on next render keyed", function() {
		var vnodes = [m.key(1), m.key(2, m("i"))]
		var updated = [m.key(1, m("a"), m("b")), null, m.key(2, m("i"))]

		render(root, vnodes)
		o(function () { render(root, updated) }).throws(TypeError)
	})
	o("populates childless fragment replaced followed by el keyed", function() {
		var vnodes = [m.key(1), m.key(2, m("i"))]
		var updated = [m.key(1, m("a"), m("b")), m.key(2, m("i"))]

		render(root, vnodes)
		render(root, updated)

		o(root.childNodes.length).equals(3)
		o(updated[0].children[0].dom.nodeName).equals("A")
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[0].children[0].dom.nextSibling.nodeName).equals("B")
		o(updated[0].children[0].dom.nextSibling).equals(root.childNodes[1])
		o(updated[1].children[0].dom.nodeName).equals("I")
		o(updated[1].children[0].dom).equals(root.childNodes[2])
	})
	o("throws if childless fragment replaced followed by null then el keyed", function() {
		var vnodes = [m.key(1), m.key(2, m("i"))]
		var updated = [m.key(1, m("a"), m("b")), null, m.key(2, m("i"))]

		render(root, vnodes)
		o(function () { render(root, updated) }).throws(TypeError)
	})
	o("moves from end to start", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var updated = [m.key(4, m("s")), m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var updated = [m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s")), m.key(1, m("a"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(3, m("i")), m.key(2, m("b")), m.key(1, m("a"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("A")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("removes then recreate bigger", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(3, m("i")), m.key(4, m("s"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(3, m("i"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(1)
		o(updated[0].dom.nodeName).equals("I")
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("cached keyed nodes move when the list is reversed", function(){
		var a = m.key("a", m("a"))
		var b = m.key("b", m("b"))
		var c = m.key("c", m("c"))
		var d = m.key("d", m("d"))

		render(root, [a, b, c, d])
		render(root, [d, c, b, a])

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("D")
		o(root.childNodes[1].nodeName).equals("C")
		o(root.childNodes[2].nodeName).equals("B")
		o(root.childNodes[3].nodeName).equals("A")
	})
	o("cached keyed nodes move when diffed via the map", function() {
		var layout = o.spy()
		var a = m.key("a", m("a", m.layout(layout)))
		var b = m.key("b", m("b", m.layout(layout)))
		var c = m.key("c", m("c", m.layout(layout)))
		var d = m.key("d", m("d", m.layout(layout)))

		render(root, [a, b, c, d])
		render(root, [b, d, a, c])

		o(root.childNodes.length).equals(4)
		o(root.childNodes[0].nodeName).equals("B")
		o(root.childNodes[1].nodeName).equals("D")
		o(root.childNodes[2].nodeName).equals("A")
		o(root.childNodes[3].nodeName).equals("C")

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, true, true, true])
	})
	o("removes then create different bigger", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(3, m("i")), m.key(4, m("s")), m.key(5, m("div"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(4, m("s"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(1, m("a"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(4, m("s"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(1, m("a"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(3, m("i")), m.key(4, m("s"))]

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
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(3, m("i")), m.key(1, m("a"))]

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
			[m("#", "b")],
			undefined,
			undefined
		)

		render(root, vnodes)
		render(root, updated)

		o(root.firstChild.childNodes.length).equals(1)
	})
	o("removes then recreates then reverses children", function() {
		var vnodes = [m.key(1, m("a", m.key(3, m("i")), m.key(4, m("s")))), m.key(2, m("b"))]
		var temp1 = []
		var temp2 = [m.key(1, m("a", m.key(3, m("i")), m.key(4, m("s")))), m.key(2, m("b"))]
		var updated = [m.key(1, m("a", m.key(4, m("s")), m.key(3, m("i")))), m.key(2, m("b"))]

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
		var vnodes = [m.key(1, m("a", m.key(3, m("a", m.key(5, m("a")))), m.key(4, m("a", m.key(5, m("a")))))), m.key(2, m("a"))]
		var temp = []
		var updated = [m.key(1, m("a", m.key(3, m("a", m.key(5, m("a")))), m.key(4, m("a", m.key(5, m("a")))))), m.key(2, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].childNodes.length).equals(2)
		o(root.childNodes[0].childNodes[0].childNodes.length).equals(1)
		o(root.childNodes[0].childNodes[1].childNodes.length).equals(1)
		o(root.childNodes[1].childNodes.length).equals(0)
	})
	o("cached, non-keyed nodes skip diff", function () {
		var layout = o.spy();
		var cached = m("a", m.layout(layout))

		render(root, cached)
		render(root, cached)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
	})
	o("cached, keyed nodes skip diff", function () {
		var layout = o.spy()
		var cached = m.key("a", m("a", m.layout(layout)))

		render(root, cached)
		render(root, cached)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
	})
	o("keyed cached elements are re-initialized when brought back from the pool (#2003)", function () {
		var layout = o.spy()
		var cached = m.key(1, m("B",
			m("A", m.layout(layout), "A")
		))
		render(root, m("div", cached))
		render(root, [])
		render(root, m("div", cached))

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, true])
	})

	o("unkeyed cached elements are re-initialized when brought back from the pool (#2003)", function () {
		var layout = o.spy()
		var cached = m("B",
			m("A", m.layout(layout), "A")
		)
		render(root, m("div", cached))
		render(root, [])
		render(root, m("div", cached))

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, true])
	})

	o("keyed cached elements are re-initialized when brought back from nested pools (#2003)", function () {
		var layout = o.spy()
		var cached = m.key(1, m("B",
			m("A", m.layout(layout), "A")
		))
		render(root, m("div", cached))
		render(root, m("div"))
		render(root, [])
		render(root, m("div", cached))

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, true])
	})

	o("unkeyed cached elements are re-initialized when brought back from nested pools (#2003)", function () {
		var layout = o.spy()
		var cached = m("B",
			m("A", m.layout(layout), "A")
		)
		render(root, m("div", cached))
		render(root, m("div"))
		render(root, [])
		render(root, m("div", cached))

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, true])
	})

	o("null stays in place", function() {
		var onabort = o.spy()
		var layout = o.spy((_, signal) => { signal.onabort = onabort })
		var vnodes = [m("div"), m("a", m.layout(layout))]
		var temp = [null, m("a", m.layout(layout))]
		var updated = [m("div"), m("a", m.layout(layout))]

		render(root, vnodes)
		var before = vnodes[1].dom
		render(root, temp)
		render(root, updated)
		var after = updated[1].dom

		o(before).equals(after)
		o(layout.calls.map((c) => c.args[2])).deepEquals([true, false, false])
		o(onabort.callCount).equals(0)
	})
	o("null stays in place if not first", function() {
		var onabort = o.spy()
		var layout = o.spy((_, signal) => { signal.onabort = onabort })
		var vnodes = [m("b"), m("div"), m("a", m.layout(layout))]
		var temp = [m("b"), null, m("a", m.layout(layout))]
		var updated = [m("b"), m("div"), m("a", m.layout(layout))]

		render(root, vnodes)
		var before = vnodes[2].dom
		render(root, temp)
		render(root, updated)
		var after = updated[2].dom

		o(before).equals(after)
		o(layout.calls.map((c) => c.args[2])).deepEquals([true, false, false])
		o(onabort.callCount).equals(0)
	})
	o("node is recreated if key changes to undefined", function () {
		var vnode = m.key(1, m("b"))
		var updated = m("b")

		render(root, vnode)
		render(root, updated)

		o(vnode.dom).notEquals(updated.dom)
	})
	o("don't add back elements from fragments that are restored from the pool #1991", function() {
		render(root, [
			[],
			[]
		])
		render(root, [
			[],
			[m("div")]
		])
		render(root, [
			[null]
		])
		render(root, [
			[],
			[]
		])

		o(root.childNodes.length).equals(0)
	})
	o("don't add back elements from fragments that are being removed #1991", function() {
		render(root, [
			[],
			m("p"),
		])
		render(root, [
			[m("div", 5)]
		])
		render(root, [
			[],
			[]
		])

		o(root.childNodes.length).equals(0)
	})
	o("handles null values in unkeyed lists of different length (#2003)", function() {
		var onabort = o.spy()
		var layout = o.spy((_, signal) => { signal.onabort = onabort })

		render(root, [m("div", m.layout(layout)), null])
		render(root, [null, m("div", m.layout(layout)), null])

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, true])
		o(onabort.callCount).equals(1)
	})
	o("supports changing the element of a keyed element in a list when traversed bottom-up", function() {
		try {
			render(root, [m.key(2, m("a"))])
			render(root, [m.key(1, m("b")), m.key(2, m("b"))])

			o(root.childNodes.length).equals(2)
			o(root.childNodes[0].nodeName).equals("B")
			o(root.childNodes[1].nodeName).equals("B")
		} catch (e) {
			o(e).equals(null)
		}
	})
	o("supports changing the element of a keyed element in a list when looking up nodes using the map", function() {
		try {
			render(root, [m.key(1, m("x")), m.key(2, m("y")), m.key(3, m("z"))])
			render(root, [m.key(2, m("b")), m.key(1, m("c")), m.key(4, m("d")), m.key(3, m("e"))])

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
		render(root, [[m.key(1, m("div")), m.key(2, m("div"))], m("p")])
		render(root, [[], m("p")])
		render(root, [[m.key(2, m("div")), m.key(1, m("div"))], m("p")])

		o([].map.call(root.childNodes, function(el) {return el.nodeName})).deepEquals(["DIV", "DIV", "P"])
	})
	o("minimizes DOM operations when scrambling a keyed lists", function() {
		var vnodes = vnodify("a,b,c,d")
		var updated = vnodify("b,a,d,c")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var vnodes = [m.key("a", m("a")), m.key("b", m("b")), m.key("c", m("c"))]
		var updated = [m.key("c", m("c")), m.key("b", m("b")), m.key("a", m("a"))]
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

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
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)

		root.appendChild = o.spy(root.appendChild)
		root.insertBefore = o.spy(root.insertBefore)

		render(root, updated)

		var tagNames = [].map.call(root.childNodes, function(n) {return n.nodeName.toLowerCase()})

		o(root.appendChild.callCount + root.insertBefore.callCount).equals(5)
		o(tagNames).deepEquals(expectedTagNames)
	})

	o("fragment child toggles from null when followed by null component then tag", function() {
		var component = () => null
		var vnodes = [[m("a"), m(component), m("b")]]
		var temp = [[null, m(component), m("b")]]
		var updated = [[m("a"), m(component), m("b")]]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(root.childNodes.length).equals(2)
		o(root.childNodes[0].nodeName).equals("A")
		o(root.childNodes[1].nodeName).equals("B")
	})
	o("fragment child toggles from null in component when followed by null component then tag", function() {
		var flag = true
		var a = () => (flag ? m("a") : null)
		var b = () => null
		var vnodes = [[m(a), m(b), m("s")]]
		var temp = [[m(a), m(b), m("s")]]
		var updated = [[m(a), m(b), m("s")]]

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
		var component = () => [m("a"), m("b")]
		try {
			render(root, [m(component)])
			render(root, [])

			o(root.childNodes.length).equals(0)
		} catch (e) {
			o(e).equals(null)
		}
	})
})
