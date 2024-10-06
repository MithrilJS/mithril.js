// Load order is important for the imports.
/* eslint-disable sort-imports */
import o from "ospec"
import * as global from "./global.js"
import m from "../src/entry/mithril.esm.js"

let registeredRoots, currentRafMock, currentThrottleMock

export function register(root) {
	registeredRoots.add(root)
	return root
}

export function injectGlobals($window, rafMock, throttleMock) {
	registeredRoots = new Set()
	global.injectGlobals($window, rafMock, throttleMock)
}

export function restoreGlobalState() {
	const errors = []
	const roots = registeredRoots
	registeredRoots = null
	for (const root of roots) {
		try {
			m.mount(root, null)
		} catch (e) {
			errors.push(e)
		}
	}
	global.restoreGlobalState()
	o(errors).deepEquals([])
	if (currentRafMock) o(currentRafMock.queueLength()).equals(0)
	if (currentThrottleMock) o(currentThrottleMock.queueLength()).equals(0)
}
