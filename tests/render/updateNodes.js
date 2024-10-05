"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var render = require("../../src/core/render")
var m = require("../../src/core/hyperscript")

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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("handles el noop without key", function() {
		var vnodes = [m("a"), m("b")]
		var updated = [m("a"), m("b")]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(updated[0].dom).equals(root.childNodes[0])
		o(updated[1].dom).equals(root.childNodes[1])
	})
	o("handles text noop", function() {
		var vnodes = "a"
		var updated = "a"

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeValue)).deepEquals(["a"])
	})
	o("handles text noop w/ type casting", function() {
		var vnodes = 1
		var updated = "1"

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeValue)).deepEquals(["1"])
	})
	o("handles falsy text noop w/ type casting", function() {
		var vnodes = 0
		var updated = "0"

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeValue)).deepEquals(["0"])
	})
	o("handles fragment noop", function() {
		var vnodes = [m("a")]
		var updated = [m("a")]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(updated[0].dom).equals(root.childNodes[0])
	})
	o("handles fragment noop w/ text child", function() {
		var vnodes = [m.normalize("a")]
		var updated = [m.normalize("a")]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeValue)).deepEquals(["a"])
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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["S", "I", "B", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
		o(updated[3].children[0].dom).equals(root.childNodes[3])
	})
	o("reverses els w/ odd count", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]
		var updated = [m.key(3, m("i")), m.key(2, m("b")), m.key(1, m("a"))]
		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["I", "B", "A"])
	})
	o("creates el at start", function() {
		var vnodes = [m.key(1, m("a"))]
		var updated = [m.key(2, m("b")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("creates el at end", function() {
		var vnodes = [m.key(1, m("a"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("creates el in middle", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "I", "B"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("creates el while reversing", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key(3, m("i")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "I", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("deletes el at start", function() {
		var vnodes = [m.key(2, m("b")), m.key(1, m("a"))]
		var updated = [m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
	})
	o("deletes el at end", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
	})
	o("deletes el at middle", function() {
		var vnodes = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("deletes el while reversing", function() {
		var vnodes = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("creates, deletes, reverses els at same time", function() {
		var vnodes = [m.key(1, m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key(1, m("a")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("creates, deletes, reverses els at same time with '__proto__' key", function() {
		var vnodes = [m.key("__proto__", m("a")), m.key(3, m("i")), m.key(2, m("b"))]
		var updated = [m.key(2, m("b")), m.key("__proto__", m("a")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("adds to empty fragment followed by el", function() {
		var vnodes = [m.key(1), m.key(2, m("b"))]
		var updated = [m.key(1, m("a")), m.key(2, m("b"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("reverses followed by el", function() {
		var vnodes = [m.key(1, m.key(2, m("a")), m.key(3, m("b"))), m.key(4, m("i"))]
		var updated = [m.key(1, m.key(3, m("b")), m.key(2, m("a"))), m.key(4, m("i"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A", "I"])
		o(updated[0].children[0].children[0].dom).equals(root.childNodes[0])
		o(updated[0].children[1].children[0].dom).equals(root.childNodes[1])
		o(updated[1].children[0].dom).equals(root.childNodes[2])
	})
	o("populates fragment followed by el keyed", function() {
		var vnodes = [m.key(1), m.key(2, m("i"))]
		var updated = [m.key(1, m("a"), m("b")), m.key(2, m("i"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[0].children[1].dom).equals(root.childNodes[1])
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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[0].children[1].dom).equals(root.childNodes[1])
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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["S", "A", "B", "I"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
		o(updated[3].children[0].dom).equals(root.childNodes[3])
	})
	o("moves from start to end", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var updated = [m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "I", "S", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
		o(updated[3].children[0].dom).equals(root.childNodes[3])
	})
	o("removes then recreate", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
		o(updated[3].children[0].dom).equals(root.childNodes[3])
	})
	o("removes then recreate reversed", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i")), m.key(4, m("s"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(3, m("i")), m.key(2, m("b")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["S", "I", "B", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
		o(updated[3].children[0].dom).equals(root.childNodes[3])
	})
	o("removes then recreate smaller", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
	})
	o("removes then recreate bigger", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("removes then create different", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(3, m("i")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["I", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("removes then create different smaller", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(3, m("i"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["I"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
	})
	o("removes then create different bigger", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(3, m("i")), m.key(4, m("s")), m.key(5, m("div"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["I", "S", "DIV"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("removes then create mixed", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed reversed", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["S", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed smaller", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed smaller reversed", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b")), m.key(3, m("i"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["S", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
	})
	o("removes then create mixed bigger", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(1, m("a")), m.key(3, m("i")), m.key(4, m("s"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "I", "S"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("removes then create mixed bigger reversed", function() {
		var vnodes = [m.key(1, m("a")), m.key(2, m("b"))]
		var temp = []
		var updated = [m.key(4, m("s")), m.key(3, m("i")), m.key(1, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["S", "I", "A"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[2].children[0].dom).equals(root.childNodes[2])
	})
	o("change type, position and length", function() {
		var vnodes = m("div", undefined, "a")
		var updated = m("div", ["b"], undefined, undefined)

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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(Array.from(root.childNodes[0].childNodes, (n) => n.nodeName)).deepEquals(["S", "I"])
		o(updated[0].children[0].dom).equals(root.childNodes[0])
		o(updated[1].children[0].dom).equals(root.childNodes[1])
		o(updated[0].children[0].children[0].children[0].dom).equals(root.childNodes[0].childNodes[0])
		o(updated[0].children[0].children[1].children[0].dom).equals(root.childNodes[0].childNodes[1])
	})
	o("removes then recreates nested", function() {
		var vnodes = [m.key(1, m("a", m.key(3, m("a", m.key(5, m("a")))), m.key(4, m("a", m.key(5, m("a")))))), m.key(2, m("a"))]
		var temp = []
		var updated = [m.key(1, m("a", m.key(3, m("a", m.key(5, m("a")))), m.key(4, m("a", m.key(5, m("a")))))), m.key(2, m("a"))]

		render(root, vnodes)
		render(root, temp)
		render(root, updated)

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "A"])
		o(Array.from(root.childNodes[0].childNodes, (n) => n.nodeName)).deepEquals(["A", "A"])
		o(Array.from(root.childNodes[0].childNodes[0].childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(Array.from(root.childNodes[1].childNodes, (n) => n.nodeName)).deepEquals([])
	})
	o("reused top-level element children are rejected against the same root", function () {
		var cached = m("a")

		render(root, cached)
		o(() => render(root, cached)).throws(Error)
	})
	o("reused top-level element children are rejected against a different root", function () {
		var cached = m("a")
		var otherRoot = $window.document.createElement("div")

		render(root, cached)
		o(() => render(otherRoot, cached)).throws(Error)
	})
	o("reused inner fragment element children are rejected against the same root", function () {
		var cached = m("a")

		render(root, [cached])
		o(() => render(root, [cached])).throws(Error)
	})
	o("reused inner fragment element children are rejected against a different root", function () {
		var cached = m("a")
		var otherRoot = $window.document.createElement("div")

		render(root, [cached])
		o(() => render(otherRoot, [cached])).throws(Error)
	})
	o("reused inner element element children are rejected against the same root", function () {
		var cached = m("a")

		render(root, m("div", cached))
		o(() => render(root, m("div", cached))).throws(Error)
	})
	o("reused inner element element children are rejected against a different root", function () {
		var cached = m("a")
		var otherRoot = $window.document.createElement("div")

		render(root, m("div", cached))
		o(() => render(otherRoot, m("div", cached))).throws(Error)
	})
	o("reused top-level retain children are rejected against the same root", function () {
		var cached = m.retain()

		render(root, m("a"))
		render(root, cached)
		o(() => render(root, cached)).throws(Error)
	})
	o("reused top-level retain children are rejected against a different root", function () {
		var cached = m.retain()
		var otherRoot = $window.document.createElement("div")

		render(root, m("a"))
		render(root, cached)
		o(() => render(otherRoot, cached)).throws(Error)
	})
	o("reused inner fragment retain children are rejected against the same root", function () {
		var cached = m.retain()

		render(root, [m("a")])
		render(root, [cached])
		o(() => render(root, [cached])).throws(Error)
	})
	o("reused inner fragment retain children are rejected against a different root", function () {
		var cached = m.retain()
		var otherRoot = $window.document.createElement("div")

		render(root, [m("a")])
		render(root, [cached])
		o(() => render(otherRoot, [cached])).throws(Error)
	})
	o("reused inner element retain children are rejected against the same root", function () {
		var cached = m.retain()

		render(root, m("div", m("a")))
		render(root, m("div", cached))
		o(() => render(root, m("div", cached))).throws(Error)
	})
	o("reused inner element retain children are rejected against a different root", function () {
		var cached = m.retain()
		var otherRoot = $window.document.createElement("div")

		render(root, m("div", m("a")))
		render(root, m("div", cached))
		o(() => render(otherRoot, m("div", cached))).throws(Error)
	})
	o("cross-removal reused top-level element children are rejected against the same root", function () {
		var cached = m("a")

		render(root, cached)
		render(root, null)
		o(() => render(root, cached)).throws(Error)
	})
	o("cross-removal reused inner fragment element children are rejected against the same root", function () {
		var cached = m("a")

		render(root, [cached])
		render(root, null)
		o(() => render(root, [cached])).throws(Error)
	})
	o("cross-removal reused inner element element children are rejected against the same root", function () {
		var cached = m("a")

		render(root, m("div", cached))
		render(root, null)
		o(() => render(root, m("div", cached))).throws(Error)
	})
	o("cross-removal reused top-level retain children are rejected against the same root", function () {
		var cached = m.retain()

		render(root, m("a"))
		render(root, cached)
		render(root, null)
		render(root, m("a"))
		o(() => render(root, cached)).throws(Error)
	})
	o("cross-removal reused inner fragment retain children are rejected against the same root", function () {
		var cached = m.retain()

		render(root, [m("a")])
		render(root, [cached])
		render(root, null)
		render(root, [m("a")])
		o(() => render(root, [cached])).throws(Error)
	})
	o("cross-removal reused inner element retain children are rejected against the same root", function () {
		var cached = m.retain()

		render(root, m("div", m("a")))
		render(root, m("div", cached))
		render(root, null)
		render(root, m("div", m("a")))
		o(() => render(root, m("div", cached))).throws(Error)
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
	o("node is recreated if unwrapped from a key", function () {
		var vnode = m.key(1, m("b"))
		var updated = m("b")

		render(root, vnode)
		render(root, updated)

		o(vnode.children[0].dom).notEquals(updated.dom)
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
		render(root, [m.key(2, m("a"))])
		render(root, [m.key(1, m("b")), m.key(2, m("b"))])

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "B"])
	})
	o("supports changing the element of a keyed element in a list when looking up nodes using the map", function() {
		render(root, [m.key(1, m("x")), m.key(2, m("y")), m.key(3, m("z"))])
		render(root, [m.key(2, m("b")), m.key(1, m("c")), m.key(4, m("d")), m.key(3, m("e"))])

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["B", "C", "D", "E"])
	})
	o("don't fetch the nextSibling from the pool", function() {
		render(root, [[m.key(1, m("div")), m.key(2, m("div"))], m("p")])
		render(root, [[], m("p")])
		render(root, [[m.key(2, m("div")), m.key(1, m("div"))], m("p")])

		o(Array.from(root.childNodes, (el) => el.nodeName)).deepEquals(["DIV", "DIV", "P"])
	})
	o("reverses a keyed lists with an odd number of items", function() {
		var vnodes = vnodify("a,b,c,d")
		var updated = vnodify("d,c,b,a")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("reverses a keyed lists with an even number of items", function() {
		var vnodes = vnodify("a,b,c")
		var updated = vnodify("c,b,a")
		var vnodes = [m.key("a", m("a")), m.key("b", m("b")), m.key("c", m("c"))]
		var updated = [m.key("c", m("c")), m.key("b", m("b")), m.key("a", m("a"))]
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambles a keyed lists with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,d,j")
		var updated = vnodify("i,b,a,d,c,j")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("reverses a keyed lists with an odd number of items with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,d,j")
		var updated = vnodify("i,d,c,b,a,j")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("reverses a keyed lists with an even number of items with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,j")
		var updated = vnodify("i,c,b,a,j")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambling sample 1", function() {
		var vnodes = vnodify("k0,k1,k2,k3,k4,k5,k6,k7,k8,k9")
		var updated = vnodify("k4,k1,k2,k9,k0,k3,k6,k5,k8,k7")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambling sample 2", function() {
		var vnodes = vnodify("k0,k1,k2,k3,k4,k5,k6,k7,k8,k9")
		var updated = vnodify("b,d,k1,k0,k2,k3,k4,a,c,k5,k6,k7,k8,k9")
		var expectedTagNames = updated.map(function(vn) {return vn.children[0].tag})

		render(root, vnodes)
		render(root, updated)

		var tagNames = Array.from(root.childNodes, (n) => n.nodeName.toLowerCase())

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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
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

		o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(["A", "S"])
	})
	o("removing a component that returns a fragment doesn't throw (regression test for incidental bug introduced while debugging some Flems)", function() {
		var component = () => [m("a"), m("b")]
		render(root, [m(component)])
		render(root, [])

		o(root.childNodes.length).equals(0)
	})
})
