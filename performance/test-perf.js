/* global window, document */

import m from "../dist/mithril.esm.min.js"

import {runBenchmarks} from "./bench.js"

import {mutateStylesPropertiesTree} from "./components/mutate-styles-properties-tree.js"
import {nestedTree} from "./components/nested-tree.js"
import {repeatedTree} from "./components/repeated-tree.js"
import {shuffledKeyedTree} from "./components/shuffled-keyed-tree.js"
import {simpleTree} from "./components/simple-tree.js"

/** @type {Parameters<typeof runBenchmarks>[0]} */
const benchmarks = Object.create(null)

async function run() {
	if (!isBrowser) await import("../test-utils/injectBrowserMock.js")
	await runBenchmarks(benchmarks)
	cycleRoot()
	if (isBrowser) document.body.innerHTML = "Benchmarks completed. See console."
}

const isBrowser = typeof process === "undefined"

function nextFrame() {
	return new Promise((resolve) => window.requestAnimationFrame(resolve))
}

let rootElem, allElems

function cycleRoot() {
	if (allElems) {
		for (const elem of allElems) {
			elem.remove()
			m.render(elem, null)
		}
	}
	if (rootElem) {
		rootElem.remove()
		m.render(rootElem, null)
	}
	document.body.appendChild(rootElem = document.createElement("div"))
}

const allTrees = []

function addTree(name, treeFn) {
	allTrees.push(treeFn)

	benchmarks[`construct ${name}`] = (b) => {
		do {
			b.start()
			do {
				treeFn()
			} while (!b.tick())
		} while (!b.done())
	}

	benchmarks[`render ${name}`] = async (b) => {
		do {
			cycleRoot()
			m.render(rootElem, treeFn())
			b.start()
			do {
				m.render(rootElem, treeFn())
			} while (!b.tick())
			if (isBrowser) await nextFrame()
		} while (!b.done())
	}

	benchmarks[`add/remove ${name}`] = async (b) => {
		do {
			cycleRoot()
			b.start()
			do {
				m.render(rootElem, treeFn())
				m.render(rootElem, null)
			} while (!b.tick())
			if (isBrowser) await nextFrame()
		} while (!b.done())
	}
}

benchmarks["null test"] = (b) => {
	do {
		cycleRoot()
		b.start()
		do {
			// nothing
		} while (!b.tick())
	} while (!b.done())
}

const {routes, stringVars, numVars, templates} = (() => {
const routes = []
const stringVars = []
const numVars = []
const templates = []

for (let i = 0; i < 16; i++) {
	for (let j = 0; j < 16; j++) {
		templates.push(`/foo${i}/:id${i}/bar${j}/:sub${j}`)
		routes.push(`/foo${i}/${i}/bar${j}/${j}`)
		stringVars.push({
			[`id${i}`]: `${i}`,
			[`sub${j}`]: `${j}`,
		})
		numVars.push({
			[`id${i}`]: i,
			[`sub${j}`]: j,
		})
	}
}

return {
	// Flatten everything, since they're usually flat strings in practice.
	routes: JSON.parse(JSON.stringify(routes)).map((path) => ({path, params: new URLSearchParams()})),
	templates: JSON.parse(JSON.stringify(templates)),
	stringVars: JSON.parse(JSON.stringify(stringVars)),
	numVars: JSON.parse(JSON.stringify(numVars)),
}
})()


// This just needs to be sub-millisecond
benchmarks["route match"] = (b) => {
	let i = 0
	do {
		cycleRoot()
		do {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			globalThis.test = m.match(routes[i], templates[i])
		} while (!b.tick())
	} while (!b.done())
}

// These four need to be at most a few microseconds, as 300 of these * 3 us/op = 0.9 ms. (And yes,
// while 300 may seem like a lot, I've worked with apps that exceeded 100, and for 60 FPS, you only
// truly have room for about 5ms total for logic.)

benchmarks["route non-match"] = (b) => {
	let i = 0
	do {
		cycleRoot()
		do {
			const j = i
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			globalThis.test = m.match(routes[i], templates[j])
		} while (!b.tick())
	} while (!b.done())
}

benchmarks["path generate with string interpolations"] = (b) => {
	let i = 0
	do {
		cycleRoot()
		do {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			globalThis.test = m.p(templates[i], stringVars[i])
		} while (!b.tick())
	} while (!b.done())
}

benchmarks["path generate with number interpolations"] = (b) => {
	let i = 0
	do {
		cycleRoot()
		do {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			globalThis.test = m.p(templates[i], numVars[i])
		} while (!b.tick())
	} while (!b.done())
}

benchmarks["path generate no interpolations"] = (b) => {
	let i = 0
	do {
		cycleRoot()
		do {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			globalThis.test = m.p(templates[i])
		} while (!b.tick())
	} while (!b.done())
}

addTree("simpleTree", simpleTree)
addTree("nestedTree", nestedTree)
addTree("mutateStylesPropertiesTree", mutateStylesPropertiesTree)
addTree("repeatedTree", repeatedTree)
addTree("shuffledKeyedTree", shuffledKeyedTree)

benchmarks["mount simpleTree"] = async (b) => {
	do {
		cycleRoot()
		b.start()
		do {
			m.mount(rootElem, simpleTree)
		} while (!b.tick())
		if (isBrowser) await nextFrame()
	} while (!b.done())
}

benchmarks["redraw simpleTree"] = async (b) => {
	do {
		cycleRoot()
		var redraw = m.mount(rootElem, simpleTree)
		b.start()
		do {
			redraw.sync()
		} while (!b.tick())
		if (isBrowser) await nextFrame()
	} while (!b.done())
}

benchmarks["mount all"] = async (b) => {
	do {
		cycleRoot()
		allElems = allTrees.map(() => {
			const elem = document.createElement("div")
			rootElem.appendChild(elem)
			return elem
		})
		b.start()
		do {
			for (let i = 0; i < allTrees.length; i++) {
				m.mount(allElems[i], allTrees[i])
			}
		} while (!b.tick())
		if (isBrowser) await nextFrame()
	} while (!b.done())
}

benchmarks["redraw all"] = async (b) => {
	do {
		cycleRoot()
		allElems = allTrees.map(() => {
			const elem = document.createElement("div")
			rootElem.appendChild(elem)
			return elem
		})
		const allRedraws = allElems.map((elem, i) => m.mount(elem, allTrees[i]))
		b.start()
		do {
			for (const redraw of allRedraws) redraw.sync()
		} while (!b.tick())
		if (isBrowser) await nextFrame()
	} while (!b.done())
}

if (isBrowser) {
	window.onload = run
} else {
	run()
}
