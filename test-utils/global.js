// Load order is important for the imports.

/* global globalThis, window, global */

import o from "ospec"

import m from "../src/entry/mithril.esm.js"

import browserMock from "./browserMock.js"
import {clearPending} from "./callAsync.js"
import throttleMocker from "./throttleMock.js"

const G = (
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined" ? window : global
)

const originalWindow = G.window
const originalDocument = G.document
const originalConsoleError = console.error

export function restoreDOMGlobals() {
	G.window = originalWindow
	G.document = originalDocument
}

export function setupGlobals(env = {}) {
	let registeredRoots
	/** @type {ReturnType<import("./browserMock.js")["default"]>} */ let $window
	/** @type {ReturnType<import("./throttleMock.js")["default"]>} */ let rafMock

	function register(root) {
		registeredRoots.add(root)
		return root
	}

	function initialize(env) {
		$window = browserMock(env)
		rafMock = throttleMocker()
		registeredRoots = new Set([$window.document.body])

		G.window = $window.window
		G.document = $window.document
		$window.requestAnimationFrame = rafMock.schedule
		$window.cancelAnimationFrame = rafMock.clear

		if (env && env.expectNoConsoleError) {
			console.error = (...args) => {
				if (typeof process === "function") process.exitCode = 1
				var replacement = console.error
				// Node's `console.trace` delegates to `console.error` as a property. Have it
				// actually call what it intended to call.
				try {
					console.error = originalConsoleError
					console.trace("Unexpected `console.error` call")
				} finally {
					console.error = replacement
				}
				originalConsoleError.apply(console, args)
			}
		}
	}

	o.beforeEach(() => {
		initialize({...env})
		return env.initialize && env.initialize(G)
	})

	o.afterEach(() => {
		const errors = []
		const roots = registeredRoots
		registeredRoots = null
		for (const root of roots) {
			try {
				m.render(root, null)
			} catch (e) {
				errors.push(e)
			}
		}
		var mock = rafMock
		$window = null
		rafMock = null
		restoreDOMGlobals()
		console.error = originalConsoleError
		clearPending()
		o(errors).deepEquals([])
		errors.length = 0
		o(mock.queueLength()).equals(0)
		return env.cleanup && env.cleanup(G)
	})

	return {
		initialize,
		register,

		/** @returns {ReturnType<import("./browserMock.js")["default"]>} */
		get window() {
			return $window
		},

		/** @returns {ReturnType<import("./throttleMock.js")["default"]>} */
		get rafMock() {
			return rafMock
		},

		get root() {
			return $window.document.body
		},
	}
}
