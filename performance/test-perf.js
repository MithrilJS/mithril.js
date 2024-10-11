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
		const allElems = allTrees.map(() => {
			const elem = document.createElement("div")
			rootElem.appendChild(elem)
			return elem
		})
		const allRedraws = allElems.map((elem, i) => m.mount(elem, allTrees[i]))
		try {
			b.start()
			do {
				for (const redraw of allRedraws) redraw.sync()
			} while (!b.tick())
			if (isBrowser) await nextFrame()
		} finally {
			for (const elem of allElems) {
				m.render(elem, null)
			}
		}
	} while (!b.done())
}

if (isBrowser) {
	window.onload = run
} else {
	run()
}
