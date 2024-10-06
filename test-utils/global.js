import {clearPending} from "./callAsync.js"

/* global globalThis, window, global */
export const G = (
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined" ? window : global
)

const keys = [
	"window",
	"document",
	"requestAnimationFrame",
	"setTimeout",
	"clearTimeout",
]

const original = keys.map((k) => G[k])
const originalConsoleError = console.error

export function injectGlobals($window, rafMock, throttleMock) {
	if ($window) {
		for (const k of keys) {
			if ({}.hasOwnProperty.call($window, k)) G[k] = $window[k]
		}
	}
	if (rafMock) {
		G.requestAnimationFrame = rafMock.schedule
		G.cancelAnimationFrame = rafMock.clear
	}
	if (throttleMock) {
		G.setTimeout = throttleMock.schedule
		G.clearTimeout = throttleMock.clear
	}
}

export function restoreDOMGlobals() {
	for (let i = 0; i < keys.length; i++) G[keys[i]] = original[i]
}

export function restoreGlobalState() {
	restoreDOMGlobals()
	clearPending()
	console.error = originalConsoleError
}
