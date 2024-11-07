/* global setTimeout, clearTimeout, setImmediate, clearImmediate */
const callAsyncRaw = typeof setImmediate === "function" ? setImmediate : setTimeout
const cancelAsyncRaw = typeof clearImmediate === "function" ? clearImmediate : clearTimeout

const timers = new Set()

export function callAsync(f) {
	const id = callAsyncRaw(() => {
		timers.delete(id)
		return f()
	})
	timers.add(id)
}

export function waitAsync() {
	return new Promise((resolve) => {
		const id = callAsyncRaw(() => {
			resolve()
			timers.delete(id)
		})
		timers.add(id)
	})
}

export function clearPending() {
	for (const timer of timers) {
		cancelAsyncRaw(timer)
	}
	timers.clear()
}
