import m from "../../dist/mithril.esm.min.js"

const keys = []
for (let i = 0; i < 1000; i++) keys.push(`key-${i}`)

function shuffle() {
	// Performs a simple Fisher-Yates shuffle.
	let current = keys.length
	while (current) {
		// eslint-disable-next-line no-bitwise
		const index = (Math.random() * current--) | 0
		const temp = keys[index]
		keys[index] = keys[current]
		keys[current] = temp
	}
}

export const shuffledKeyedTree = () => {
	shuffle()
	var vnodes = []
	for (const key of keys) {
		vnodes.push(m("div.item", {key}))
	}
	return vnodes
}
