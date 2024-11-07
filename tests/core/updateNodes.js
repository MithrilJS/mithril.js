import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

function vnodify(str) {
	return m.keyed(str.split(","), (k) => [k, m(k)])
}

o.spec("updateNodes", function() {
	var G = setupGlobals()

	o("handles keyed noop", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var updated = m.keyed([[1, m("a")], [2, m("b")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("handles el noop without key", function() {
		var vnodes = [m("a"), m("b")]
		var updated = [m("a"), m("b")]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(updated[0].d).equals(G.root.childNodes[0])
		o(updated[1].d).equals(G.root.childNodes[1])
	})
	o("handles text noop", function() {
		var vnodes = "a"
		var updated = "a"

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeValue)).deepEquals(["a"])
	})
	o("handles text noop w/ type casting", function() {
		var vnodes = 1
		var updated = "1"

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeValue)).deepEquals(["1"])
	})
	o("handles falsy text noop w/ type casting", function() {
		var vnodes = 0
		var updated = "0"

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeValue)).deepEquals(["0"])
	})
	o("handles fragment noop", function() {
		var vnodes = [m("a")]
		var updated = [m("a")]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(updated[0].d).equals(G.root.childNodes[0])
	})
	o("handles fragment noop w/ text child", function() {
		var vnodes = [m.normalize("a")]
		var updated = [m.normalize("a")]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeValue)).deepEquals(["a"])
		o(updated[0].d).equals(G.root.childNodes[0])
	})
	o("handles undefined to null noop", function() {
		var vnodes = [null, m("div")]
		var updated = [undefined, m("div")]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
	})
	o("reverses els w/ even count", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")], [4, m("s")]])
		var updated = m.keyed([[4, m("s")], [3, m("i")], [2, m("b")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["S", "I", "B", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
		o([...updated.a][3][1].d).equals(G.root.childNodes[3])
	})
	o("reverses els w/ odd count", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")]])
		var updated = m.keyed([[3, m("i")], [2, m("b")], [1, m("a")]])
		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["I", "B", "A"])
	})
	o("creates el at start", function() {
		var vnodes = m.keyed([[1, m("a")]])
		var updated = m.keyed([[2, m("b")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("creates el at end", function() {
		var vnodes = m.keyed([[1, m("a")]])
		var updated = m.keyed([[1, m("a")], [2, m("b")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("creates el in middle", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var updated = m.keyed([[1, m("a")], [3, m("i")], [2, m("b")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "I", "B"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("creates el while reversing", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var updated = m.keyed([[2, m("b")], [3, m("i")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "I", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("deletes el at start", function() {
		var vnodes = m.keyed([[2, m("b")], [1, m("a")]])
		var updated = m.keyed([[1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
	})
	o("deletes el at end", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var updated = m.keyed([[1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
	})
	o("deletes el at middle", function() {
		var vnodes = m.keyed([[1, m("a")], [3, m("i")], [2, m("b")]])
		var updated = m.keyed([[1, m("a")], [2, m("b")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("deletes el while reversing", function() {
		var vnodes = m.keyed([[1, m("a")], [3, m("i")], [2, m("b")]])
		var updated = m.keyed([[2, m("b")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("creates, deletes, reverses els at same time", function() {
		var vnodes = m.keyed([[1, m("a")], [3, m("i")], [2, m("b")]])
		var updated = m.keyed([[2, m("b")], [1, m("a")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("creates, deletes, reverses els at same time with '__proto__' key", function() {
		var vnodes = m.keyed([["__proto__", m("a")], [3, m("i")], [2, m("b")]])
		var updated = m.keyed([[2, m("b")], ["__proto__", m("a")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("adds to empty fragment followed by el", function() {
		var vnodes = m.keyed([[1, []], [2, m("b")]])
		var updated = m.keyed([[1, m("a")], [2, m("b")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("reverses followed by el", function() {
		var vnodes = m.keyed([[1, m.keyed([[2, m("a")], [3, m("b")]])], [4, m("i")]])
		var updated = m.keyed([[1, m.keyed([[3, m("b")], [2, m("a")]])], [4, m("i")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "A", "I"])
		o([...[...updated.a][0][1].a][0][1].d).equals(G.root.childNodes[0])
		o([...[...updated.a][0][1].a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][1][1].d).equals(G.root.childNodes[2])
	})
	o("populates fragment followed by el keyed", function() {
		var vnodes = m.keyed([[1, []], [2, m("i")]])
		var updated = m.keyed([[1, [m("a"), m("b")]], [2, m("i")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I"])
		o([...updated.a][0][1].c[0].d).equals(G.root.childNodes[0])
		o([...updated.a][0][1].c[1].d).equals(G.root.childNodes[1])
		o([...updated.a][1][1].d).equals(G.root.childNodes[2])
	})
	o("populates childless fragment replaced followed by el keyed", function() {
		var vnodes = m.keyed([[1, []], [2, m("i")]])
		var updated = m.keyed([[1, [m("a"), m("b")]], [2, m("i")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I"])
		o([...updated.a][0][1].c[0].d).equals(G.root.childNodes[0])
		o([...updated.a][0][1].c[1].d).equals(G.root.childNodes[1])
		o([...updated.a][1][1].d).equals(G.root.childNodes[2])
	})
	o("moves from end to start", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")], [4, m("s")]])
		var updated = m.keyed([[4, m("s")], [1, m("a")], [2, m("b")], [3, m("i")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["S", "A", "B", "I"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
		o([...updated.a][3][1].d).equals(G.root.childNodes[3])
	})
	o("moves from start to end", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")], [4, m("s")]])
		var updated = m.keyed([[2, m("b")], [3, m("i")], [4, m("s")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "I", "S", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
		o([...updated.a][3][1].d).equals(G.root.childNodes[3])
	})
	o("removes then recreate", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")], [4, m("s")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
		o([...updated.a][3][1].d).equals(G.root.childNodes[3])
	})
	o("removes then recreate reversed", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")], [4, m("s")]])
		var temp = m.keyed([])
		var updated = m.keyed([[4, m("s")], [3, m("i")], [2, m("b")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["S", "I", "B", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
		o([...updated.a][3][1].d).equals(G.root.childNodes[3])
	})
	o("removes then recreate smaller", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
	})
	o("removes then recreate bigger", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B", "I"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("removes then create different", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[3, m("i")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["I", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("removes then create different smaller", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[3, m("i")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["I"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
	})
	o("removes then create different bigger", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[3, m("i")], [4, m("s")], [5, m("div")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["I", "S", "DIV"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("removes then create mixed", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("removes then create mixed reversed", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[4, m("s")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["S", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("removes then create mixed smaller", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("removes then create mixed smaller reversed", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")], [3, m("i")]])
		var temp = m.keyed([])
		var updated = m.keyed([[4, m("s")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["S", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
	})
	o("removes then create mixed bigger", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a")], [3, m("i")], [4, m("s")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "I", "S"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("removes then create mixed bigger reversed", function() {
		var vnodes = m.keyed([[1, m("a")], [2, m("b")]])
		var temp = m.keyed([])
		var updated = m.keyed([[4, m("s")], [3, m("i")], [1, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["S", "I", "A"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...updated.a][2][1].d).equals(G.root.childNodes[2])
	})
	o("in fragment, nest text inside fragment and add hole", function() {
		var vnodes = ["a"]
		var updated = [["b"], undefined]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(G.root.childNodes.length).equals(1)
	})
	o("in element, nest text inside fragment and add hole", function() {
		var vnodes = m("div", "a")
		var updated = m("div", ["b"], undefined)

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(G.root.firstChild.childNodes.length).equals(1)
	})
	o("change type, position and length", function() {
		var vnodes = m("div", {}, undefined, "a")
		var updated = m("div", {}, ["b"], undefined, undefined)

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		o(G.root.firstChild.childNodes.length).equals(1)
	})
	o("removes then recreates then reverses children", function() {
		var vnodes = m.keyed([[1, m("a", m.keyed([[3, m("i")], [4, m("s")]]))], [2, m("b")]])
		var temp1 = m.keyed([])
		var temp2 = m.keyed([[1, m("a", m.keyed([[3, m("i")], [4, m("s")]]))], [2, m("b")]])
		var updated = m.keyed([[1, m("a", m.keyed([[4, m("s")], [3, m("i")]]))], [2, m("b")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp1)
		m.render(G.root, temp2)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
		o(Array.from(G.root.childNodes[0].childNodes, (n) => n.nodeName)).deepEquals(["S", "I"])
		o([...updated.a][0][1].d).equals(G.root.childNodes[0])
		o([...updated.a][1][1].d).equals(G.root.childNodes[1])
		o([...[...updated.a][0][1].c[0].a][0][1].d).equals(G.root.childNodes[0].childNodes[0])
		o([...[...updated.a][0][1].c[0].a][1][1].d).equals(G.root.childNodes[0].childNodes[1])
	})
	o("removes then recreates nested", function() {
		var vnodes = m.keyed([[1, m("a", m.keyed([[3, m("a", m.keyed([[5, m("a")]]))], [4, m("a", m.keyed([[5, m("a")]]))]]))], [2, m("a")]])
		var temp = m.keyed([])
		var updated = m.keyed([[1, m("a", m.keyed([[3, m("a", m.keyed([[5, m("a")]]))], [4, m("a", m.keyed([[5, m("a")]]))]]))], [2, m("a")]])

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "A"])
		o(Array.from(G.root.childNodes[0].childNodes, (n) => n.nodeName)).deepEquals(["A", "A"])
		o(Array.from(G.root.childNodes[0].childNodes[0].childNodes, (n) => n.nodeName)).deepEquals(["A"])
		o(Array.from(G.root.childNodes[1].childNodes, (n) => n.nodeName)).deepEquals([])
	})
	o("reused top-level element children are retained if against the same root and from the most recent render", function () {
		var cached = m("a")

		m.render(G.root, cached)
		m.render(G.root, cached)
	})
	o("reused top-level element children are rejected against a different root", function () {
		var cached = m("a")
		var otherRoot = G.window.document.createElement("div")

		m.render(G.root, cached)
		o(() => m.render(otherRoot, cached)).throws(Error)
	})
	o("reused inner fragment element children are retained if against the same root and from the most recent render", function () {
		var cached = m("a")

		m.render(G.root, [cached])
		m.render(G.root, [cached])
	})
	o("reused inner fragment element children are rejected against a different root", function () {
		var cached = m("a")
		var otherRoot = G.window.document.createElement("div")

		m.render(G.root, [cached])
		o(() => m.render(otherRoot, [cached])).throws(Error)
	})
	o("reused inner element element children are retained if against the same root and from the most recent render", function () {
		var cached = m("a")

		m.render(G.root, m("div", cached))
		m.render(G.root, m("div", cached))
	})
	o("reused inner element element children are rejected against a different root", function () {
		var cached = m("a")
		var otherRoot = G.window.document.createElement("div")

		m.render(G.root, m("div", cached))
		o(() => m.render(otherRoot, m("div", cached))).throws(Error)
	})
	o("reused top-level retain children are retained if against the same root and from the most recent render", function () {
		var cached = m.retain()

		m.render(G.root, m("a"))
		m.render(G.root, cached)
		m.render(G.root, cached)
	})
	o("reused top-level retain children are rejected against a different root", function () {
		var cached = m.retain()
		var otherRoot = G.window.document.createElement("div")

		m.render(G.root, m("a"))
		m.render(G.root, cached)
		o(() => m.render(otherRoot, cached)).throws(Error)
	})
	o("reused inner fragment retain children are retained if against the same root and from the most recent render", function () {
		var cached = m.retain()

		m.render(G.root, [m("a")])
		m.render(G.root, [cached])
		m.render(G.root, [cached])
	})
	o("reused inner fragment retain children are rejected against a different root", function () {
		var cached = m.retain()
		var otherRoot = G.window.document.createElement("div")

		m.render(G.root, [m("a")])
		m.render(G.root, [cached])
		o(() => m.render(otherRoot, [cached])).throws(Error)
	})
	o("reused inner element retain children are retained if against the same root and from the most recent render", function () {
		var cached = m.retain()

		m.render(G.root, m("div", m("a")))
		m.render(G.root, m("div", cached))
		m.render(G.root, m("div", cached))
	})
	o("reused inner element retain children are rejected against a different root", function () {
		var cached = m.retain()
		var otherRoot = G.window.document.createElement("div")

		m.render(G.root, m("div", m("a")))
		m.render(G.root, m("div", cached))
		o(() => m.render(otherRoot, m("div", cached))).throws(Error)
	})
	o("cross-removal reused top-level element children are rejected against the same root", function () {
		var cached = m("a")

		m.render(G.root, cached)
		m.render(G.root, null)
		o(() => m.render(G.root, cached)).throws(Error)
	})
	o("cross-removal reused inner fragment element children are rejected against the same root", function () {
		var cached = m("a")

		m.render(G.root, [cached])
		m.render(G.root, [null])
		o(() => m.render(G.root, [cached])).throws(Error)
	})
	o("cross-removal reused inner element element children are rejected against the same root", function () {
		var cached = m("a")

		m.render(G.root, m("div", cached))
		m.render(G.root, null)
		o(() => m.render(G.root, m("div", cached))).throws(Error)
	})
	o("cross-removal reused top-level retain children are rejected against the same root", function () {
		var cached = m.retain()

		m.render(G.root, m("a"))
		m.render(G.root, cached)
		m.render(G.root, null)
		m.render(G.root, m("a"))
		o(() => m.render(G.root, cached)).throws(Error)
	})
	o("cross-removal reused inner fragment retain children are rejected against the same root", function () {
		var cached = m.retain()

		m.render(G.root, [m("a")])
		m.render(G.root, [cached])
		m.render(G.root, [null])
		m.render(G.root, [m("a")])
		o(() => m.render(G.root, [cached])).throws(Error)
	})
	o("cross-removal reused inner element retain children are rejected against the same root", function () {
		var cached = m.retain()

		m.render(G.root, m("div", m("a")))
		m.render(G.root, m("div", cached))
		m.render(G.root, m("b"))
		m.render(G.root, m("div", m("a")))
		o(() => m.render(G.root, m("div", cached))).throws(Error)
	})
	o("cross-replacement reused top-level element children are rejected against the same root", function () {
		var cached = m("a")

		m.render(G.root, cached)
		m.render(G.root, m("b"))
		o(() => m.render(G.root, cached)).throws(Error)
	})
	o("cross-replacement reused inner fragment element children are rejected against the same root", function () {
		var cached = m("a")

		m.render(G.root, [cached])
		m.render(G.root, [m("b")])
		o(() => m.render(G.root, [cached])).throws(Error)
	})
	o("cross-replacement reused inner element element children are rejected against the same root", function () {
		var cached = m("a")

		m.render(G.root, m("div", cached))
		m.render(G.root, m("b"))
		o(() => m.render(G.root, m("div", cached))).throws(Error)
	})
	o("cross-replacement reused top-level retain children are rejected against the same root", function () {
		var cached = m.retain()

		m.render(G.root, m("a"))
		m.render(G.root, cached)
		m.render(G.root, m("b"))
		m.render(G.root, m("a"))
		o(() => m.render(G.root, cached)).throws(Error)
	})
	o("cross-replacement reused inner fragment retain children are rejected against the same root", function () {
		var cached = m.retain()

		m.render(G.root, [m("a")])
		m.render(G.root, [cached])
		m.render(G.root, [m("b")])
		m.render(G.root, [m("a")])
		o(() => m.render(G.root, [cached])).throws(Error)
	})
	o("cross-replacement reused inner element retain children are rejected against the same root", function () {
		var cached = m.retain()

		m.render(G.root, m("div", m("a")))
		m.render(G.root, m("div", cached))
		m.render(G.root, null)
		m.render(G.root, m("div", m("a")))
		o(() => m.render(G.root, m("div", cached))).throws(Error)
	})

	o("null stays in place", function() {
		var remove = o.spy()
		var layout = o.spy()
		var vnodes = [m("div"), m("a", m.layout(layout), m.remove(remove))]
		var temp = [null, m("a", m.layout(layout), m.remove(remove))]
		var updated = [m("div"), m("a", m.layout(layout), m.remove(remove))]

		m.render(G.root, vnodes)
		var before = vnodes[1].d

		o(layout.callCount).equals(1)
		o(remove.callCount).equals(0)

		m.render(G.root, temp)

		o(layout.callCount).equals(2)
		o(remove.callCount).equals(0)

		m.render(G.root, updated)
		var after = updated[1].d

		o(layout.callCount).equals(3)
		o(remove.callCount).equals(0)
		o(before).equals(after)
	})
	o("null stays in place if not first", function() {
		var remove = o.spy()
		var layout = o.spy()
		var vnodes = [m("b"), m("div"), m("a", m.layout(layout), m.remove(remove))]
		var temp = [m("b"), null, m("a", m.layout(layout), m.remove(remove))]
		var updated = [m("b"), m("div"), m("a", m.layout(layout), m.remove(remove))]

		m.render(G.root, vnodes)
		var before = vnodes[2].d

		o(layout.callCount).equals(1)
		o(remove.callCount).equals(0)

		m.render(G.root, temp)

		o(layout.callCount).equals(2)
		o(remove.callCount).equals(0)

		m.render(G.root, updated)
		var after = updated[2].d

		o(layout.callCount).equals(3)
		o(remove.callCount).equals(0)
		o(before).equals(after)
	})
	o("node is recreated if unwrapped from a key", function () {
		var vnode = m.keyed([[1, m("b")]])
		var updated = m("b")

		m.render(G.root, vnode)
		m.render(G.root, updated)

		o([...vnode.a][0][1].d).notEquals(updated.d)
	})
	o("don't add back elements from fragments that are restored from the pool #1991", function() {
		m.render(G.root, [
			[],
			[]
		])
		m.render(G.root, [
			[],
			[m("div")]
		])
		m.render(G.root, [
			[null]
		])
		m.render(G.root, [
			[],
			[]
		])

		o(G.root.childNodes.length).equals(0)
	})
	o("don't add back elements from fragments that are being removed #1991", function() {
		m.render(G.root, [
			[],
			m("p"),
		])
		m.render(G.root, [
			[m("div", 5)]
		])
		m.render(G.root, [
			[],
			[]
		])

		o(G.root.childNodes.length).equals(0)
	})
	o("handles null values in unkeyed lists of different length (#2003)", function() {
		var remove = o.spy()
		var layout = o.spy()

		m.render(G.root, [m("div", m.layout(layout), m.remove(remove)), null])
		m.render(G.root, [null, m("div", m.layout(layout), m.remove(remove)), null])

		o(layout.callCount).equals(2)
		o(remove.callCount).equals(1)
	})
	o("supports changing the element of a keyed element in a list when traversed bottom-up", function() {
		m.render(G.root, m.keyed([[2, m("a")]]))
		m.render(G.root, m.keyed([[1, m("b")], [2, m("b")]]))

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "B"])
	})
	o("supports changing the element of a keyed element in a list when looking up nodes using the map", function() {
		m.render(G.root, m.keyed([[1, m("x")], [2, m("y")], [3, m("z")]]))
		m.render(G.root, m.keyed([[2, m("b")], [1, m("c")], [4, m("d")], [3, m("e")]]))

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["B", "C", "D", "E"])
	})
	o("don't fetch the nextSibling from the pool", function() {
		m.render(G.root, [m.keyed([[1, m("div")], [2, m("div")]]), m("p")])
		m.render(G.root, [m.keyed([]), m("p")])
		m.render(G.root, [m.keyed([[2, m("div")], [1, m("div")]]), m("p")])

		o(Array.from(G.root.childNodes, (el) => el.nodeName)).deepEquals(["DIV", "DIV", "P"])
	})
	o("reverses a keyed lists with an odd number of items", function() {
		var vnodes = vnodify("a,b,c,d")
		var updated = vnodify("d,c,b,a")
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("reverses a keyed lists with an even number of items", function() {
		var vnodes = vnodify("a,b,c")
		var updated = vnodify("c,b,a")
		var vnodes = m.keyed([["a", m("a")], ["b", m("b")], ["c", m("c")]])
		var updated = m.keyed([["c", m("c")], ["b", m("b")], ["a", m("a")]])
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambles a keyed lists with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,d,j")
		var updated = vnodify("i,b,a,d,c,j")
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("reverses a keyed lists with an odd number of items with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,d,j")
		var updated = vnodify("i,d,c,b,a,j")
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("reverses a keyed lists with an even number of items with prefixes and suffixes", function() {
		var vnodes = vnodify("i,a,b,c,j")
		var updated = vnodify("i,c,b,a,j")
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambling sample 1", function() {
		var vnodes = vnodify("k0,k1,k2,k3,k4,k5,k6,k7,k8,k9")
		var updated = vnodify("k4,k1,k2,k9,k0,k3,k6,k5,k8,k7")
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})
	o("scrambling sample 2", function() {
		var vnodes = vnodify("k0,k1,k2,k3,k4,k5,k6,k7,k8,k9")
		var updated = vnodify("b,d,k1,k0,k2,k3,k4,a,c,k5,k6,k7,k8,k9")
		var expectedTagNames = [...updated.a.keys()]

		m.render(G.root, vnodes)
		m.render(G.root, updated)

		var tagNames = Array.from(G.root.childNodes, (n) => n.nodeName.toLowerCase())

		o(tagNames).deepEquals(expectedTagNames)
	})

	o("fragment child toggles from null when followed by null component then tag", function() {
		var component = () => null
		var vnodes = [[m("a"), m(component), m("b")]]
		var temp = [[null, m(component), m("b")]]
		var updated = [[m("a"), m(component), m("b")]]

		m.render(G.root, vnodes)
		m.render(G.root, temp)
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "B"])
	})
	o("fragment child toggles from null in component when followed by null component then tag", function() {
		var flag = true
		var a = () => (flag ? m("a") : null)
		var b = () => null
		var vnodes = [[m(a), m(b), m("s")]]
		var temp = [[m(a), m(b), m("s")]]
		var updated = [[m(a), m(b), m("s")]]

		m.render(G.root, vnodes)
		flag = false
		m.render(G.root, temp)
		flag = true
		m.render(G.root, updated)

		o(Array.from(G.root.childNodes, (n) => n.nodeName)).deepEquals(["A", "S"])
	})
	o("removing a component that returns a fragment doesn't throw (regression test for incidental bug introduced while debugging some Flems)", function() {
		var component = () => [m("a"), m("b")]
		m.render(G.root, [m(component)])
		m.render(G.root, [])

		o(G.root.childNodes.length).equals(0)
	})
})
