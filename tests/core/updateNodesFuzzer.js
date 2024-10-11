import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("updateNodes keyed list Fuzzer", () => {
	const maxLength = 12
	const testCount = 250

	const fromUsed = new Set()
	const toUsed = new Set()

	function randomInt(max) {
		// eslint-disable-next-line no-bitwise
		return (Math.random() * max) | 0
	}

	function randomUnique(used) {
		for (;;) {
			let max = randomInt(maxLength)
			const keys = Array.from({length: max}, (_, i) => i)
			// Perform a simple Fisher-Yates shuffle on the generated key range.
			while (max) {
				const index = randomInt(max--)
				const temp = keys[index]
				keys[index] = keys[max]
				keys[max] = temp
			}

			const serialized = keys.join()
			if (!used.has(serialized)) {
				used.add(serialized)
				return keys
			}
		}
	}

	var G = setupGlobals()

	function fuzzGroup(label, view, assert) {
		o.spec(label, () => {
			for (let i = 0; i < testCount; i++) {
				const from = randomUnique(fromUsed)
				const to = randomUnique(toUsed)
				o(`${i}: ${from} -> ${to}`, () => {
					m.render(G.root, from.map((x) => m.key(x, view(x))))
					m.render(G.root, to.map((x) => m.key(x, view(x))))
					assert(G.root, to)
				})
			}
		})
	}

	fuzzGroup(
		"element tag",
		(i) => m(`t${i}`),
		(root, to) => o(Array.from(root.childNodes, (n) => n.nodeName)).deepEquals(to.map((i) => `T${i}`))
	)

	fuzzGroup(
		"text value",
		(i) => `${i}`,
		(root, to) => o(Array.from(root.childNodes, (n) => n.nodeValue)).deepEquals(to.map((i) => `${i}`))
	)

	fuzzGroup(
		"text value in element",
		(i) => m("div", `${i}`),
		(root, to) => o(Array.from(root.childNodes, (n) => n.childNodes[0].nodeValue)).deepEquals(to.map((i) => `${i}`))
	)
})
