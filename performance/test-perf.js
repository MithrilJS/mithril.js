/* global window, document */

import m from "../dist/mithril.esm.min.js"

import {setupBenchmarks} from "./bench.js"

import {mutateStylesPropertiesTree} from "./components/mutate-styles-properties-tree.js"
import {nestedTree} from "./components/nested-tree.js"
import {repeatedTree} from "./components/repeated-tree.js"
import {shuffledKeyedTree} from "./components/shuffled-keyed-tree.js"
import {simpleTree} from "./components/simple-tree.js"

import {numVars, routes, stringVars, templates} from "./routes.js"

async function setup() {
	if (typeof window === "undefined") {
		// Gotta use `eval` here for Node.
		// eslint-disable-next-line no-eval
		await eval('import("../test-utils/injectBrowserMock.js")')
	}
}

const allTrees = [
	simpleTree,
	nestedTree,
	mutateStylesPropertiesTree,
	repeatedTree,
	shuffledKeyedTree,
]

// 1. `m.match` requires a `{path, params}` object to be given (to match).
// 2. In practice, these have a shared shape, and this ensures it has that shared shape.
const routeObjects = routes.map((path) => ({path, params: new URLSearchParams()}))

// For route selection
let i = 0

let rootElem, allElems, redraw, allRedraws

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

setupBenchmarks(setup, cycleRoot, {
	// This just needs to be sub-millisecond
	"route match": {
		fn() {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			return m.match(routeObjects[i], templates[i])
		},
	},

	// These four need to be at most a few microseconds, as 300 of these * 3 us/op = 0.9 ms. (And yes,
	// while 300 may seem like a lot, I've worked with apps that exceeded 100, and for 60 FPS, you only
	// truly have room for about 5ms total for logic.)

	"route non-match": {
		fn() {
			const j = i
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			return m.match(routeObjects[i], templates[j])
		},
	},

	"path generate with string interpolations": {
		fn() {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			return m.p(templates[i], stringVars[i])
		},
	},

	"path generate with number interpolations": {
		fn() {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			return m.p(templates[i], numVars[i])
		},
	},

	"path generate no interpolations": {
		fn() {
			// eslint-disable-next-line no-bitwise
			i = (i - 1) & 255
			return m.p(templates[i])
		},
	},

	"construct `simpleTree`": {
		fn: simpleTree,
	},

	"render `simpleTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, simpleTree())
		},
		fn() {
			m.render(rootElem, simpleTree())
		},
	},

	"add/remove `simpleTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, null)
		},
		fn() {
			m.render(rootElem, simpleTree())
			m.render(rootElem, null)
		},
	},

	"construct `nestedTree`": {
		fn: nestedTree,
	},

	"render `nestedTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, nestedTree())
		},
		fn() {
			m.render(rootElem, nestedTree())
		},
	},

	"add/remove `nestedTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, null)
		},
		fn() {
			m.render(rootElem, nestedTree())
			m.render(rootElem, null)
		},
	},

	"construct `mutateStylesPropertiesTree`": {
		fn: mutateStylesPropertiesTree,
	},

	"render `mutateStylesPropertiesTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, mutateStylesPropertiesTree())
		},
		fn() {
			m.render(rootElem, mutateStylesPropertiesTree())
		},
	},

	"add/remove `mutateStylesPropertiesTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, null)
		},
		fn() {
			m.render(rootElem, mutateStylesPropertiesTree())
			m.render(rootElem, null)
		},
	},

	"construct `repeatedTree`": {
		fn: repeatedTree,
	},

	"render `repeatedTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, repeatedTree())
		},
		fn() {
			m.render(rootElem, repeatedTree())
		},
	},

	"add/remove `repeatedTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, null)
		},
		fn() {
			m.render(rootElem, repeatedTree())
			m.render(rootElem, null)
		},
	},

	"construct `shuffledKeyedTree`": {
		fn: shuffledKeyedTree,
	},

	"render `shuffledKeyedTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, shuffledKeyedTree())
		},
		fn() {
			m.render(rootElem, shuffledKeyedTree())
		},
	},

	"add/remove `shuffledKeyedTree`": {
		tick() {
			cycleRoot()
			m.render(rootElem, null)
		},
		fn() {
			m.render(rootElem, shuffledKeyedTree())
			m.render(rootElem, null)
		},
	},

	"mount simpleTree": {
		tick() {
			cycleRoot()
			// For consistency across the interval
			m.mount(rootElem, simpleTree)
		},
		fn() {
			m.mount(rootElem, simpleTree)
		},
	},

	"redraw simpleTree": {
		tick() {
			cycleRoot()
			redraw = m.mount(rootElem, simpleTree)
		},
		fn() {
			redraw.sync()
		},
	},

	"mount all": {
		tick() {
			cycleRoot()
			allElems = allTrees.map((tree) => {
				const elem = document.createElement("div")
				rootElem.appendChild(elem)
				// For consistency across the interval
				m.mount(elem, tree)
				return elem
			})
		},
		fn() {
			for (let i = 0; i < allTrees.length; i++) {
				m.mount(allElems[i], allTrees[i])
			}
		},
	},

	"redraw all": {
		tick() {
			cycleRoot()
			allElems = allTrees.map(() => {
				const elem = document.createElement("div")
				rootElem.appendChild(elem)
				return elem
			})
			allRedraws = allElems.map((elem, i) => m.mount(elem, allTrees[i]))
		},
		fn() {
			for (const redraw of allRedraws) redraw.sync()
		},
	},
})
