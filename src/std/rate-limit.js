/* global performance, setTimeout, clearTimeout */

import {noop} from "../util.js"

var validateDelay = (delay) => {
	if (!Number.isFinite(delay) || delay <= 0) {
		throw new RangeError("Timer delay must be finite and positive")
	}
}

var rateLimiterImpl = (delay = 500, isThrottler) => {
	validateDelay(delay)

	var closed = false
	var start = 0
	var timer = 0
	var resolveNext = noop

	var callback = () => {
		timer = undefined
		resolveNext(false)
		resolveNext = noop
	}

	var rateLimiter = async (ignoreLeading) => {
		if (closed) {
			return true
		}

		resolveNext(true)
		resolveNext = noop

		if (timer) {
			if (isThrottler) {
				return new Promise((resolve) => resolveNext = resolve)
			}

			clearTimeout(timer)
			ignoreLeading = true
		}

		start = performance.now()
		timer = setTimeout(callback, delay)

		if (!ignoreLeading) {
			return
		}

		return new Promise((resolve) => resolveNext = resolve)
	}

	rateLimiter.update = (newDelay) => {
		validateDelay(newDelay)
		delay = newDelay

		if (closed) return
		if (timer) {
			clearTimeout(timer)
			timer = setTimeout(callback, (start - performance.now()) + delay)
		}
	}

	rateLimiter.dispose = () => {
		if (closed) return
		closed = true
		clearTimeout(timer)
		resolveNext(true)
		resolveNext = noop
	}

	return rateLimiter
}

/**
 * A general-purpose bi-edge throttler, with a dynamically configurable limit. It's much better
 * than your typical `throttle(f, ms)` because it lets you easily separate the trigger and reaction
 * using a single shared, encapsulated state object. That same separation is also used to make the
 * rate limit dynamically reconfigurable on hit.
 *
 * Create as `throttled = m.throttler(ms)` and do `if (await throttled()) return` to rate-limit
 * the code that follows. The result is one of three values, to allow you to identify edges:
 *
 * - Leading edge: `undefined`
 * - Trailing edge: `false`, returned only if a second call was made
 * - No edge: `true`
 *
 * Call `throttled.update(ms)` to update the interval. This not only impacts future delays, but also any current one.
 *
 * To dispose, like on component removal, call `throttled.dispose()`.
 *
 * If you don't sepecify a delay, it defaults to 500ms on creation, which works well enough for
 * most needs. There is no default for `throttled.update(...)` - you must specify one explicitly.
 *
 * Example usage:
 *
 * ```js
 * const throttled = m.throttler()
 * let results, error
 * return function () {
 *     return [
 *         m.remove(throttled.dispose),
 *         m("input[type=search]", {
 *             oninput: async (ev) => {
 *                 // Skip redraw if rate limited - it's pointless
 *                 if (await throttled()) return false
 *                 error = results = null
 *                 this.redraw()
 *                 try {
 *                     const response = await fetch(m.p("/search", {q: ev.target.value}))
 *                     if (response.ok) {
 *                         results = await response.json()
 *                     } else {
 *                         error = await response.text()
 *                     }
 *                 } catch (e) {
 *                     error = e.message
 *                 }
 *             },
 *         }),
 *         results.map((result) => m(SearchResult, {result})),
 *         !error || m(ErrorDisplay, {error})),
 *     ]
 * }
 * ```
 *
 * Important note: due to the way this is implemented in basically all runtimes, the throttler's
 * clock might not tick during sleep, so if you do `await throttled()` and immediately sleep in a
 * low-power state for 5 minutes, you might have to wait another 10 minutes after resuming to a
 * high-power state.
 */
var throttler = (delay) => rateLimiterImpl(delay, 1)

/**
 * A general-purpose bi-edge debouncer, with a dynamically configurable limit. It's much better
 * than your typical `debounce(f, ms)` because it lets you easily separate the trigger and reaction
 * using a single shared, encapsulated state object. That same separation is also used to make the
 * rate limit dynamically reconfigurable on hit.
 *
 * Create as `debounced = m.debouncer(ms)` and do `if (await debounced()) return` to rate-limit
 * the code that follows. The result is one of three values, to allow you to identify edges:
 *
 * - Leading edge: `undefined`
 * - Trailing edge: `false`, returned only if a second call was made
 * - No edge: `true`
 *
 * Call `debounced.update(ms)` to update the interval. This not only impacts future delays, but also any current one.
 *
 * To dispose, like on component removal, call `debounced.dispose()`.
 *
 * If you don't sepecify a delay, it defaults to 500ms on creation, which works well enough for
 * most needs. There is no default for `debounced.update(...)` - you must specify one explicitly.
 *
 * Example usage:
 *
 * ```js
 * const debounced = m.debouncer()
 * let results, error
 * return (attrs) => [
 *     m.remove(debounced.dispose),
 *     m("input[type=text].value", {
 *         async oninput(ev) {
 *             // Skip redraw if rate limited - it's pointless
 *             if ((await debounced()) !== false) return false
 *             try {
 *                 const response = await fetch(m.p("/save/:id", {id: attrs.id}), {
 *                     body: JSON.stringify({value: ev.target.value}),
 *                 })
 *                 if (!response.ok) {
 *                     error = await response.text()
 *                 }
 *             } catch (e) {
 *                 error = e.message
 *             }
 *         },
 *     }),
 *     results.map((result) => m(SearchResult, {result})),
 *     !error || m(ErrorDisplay, {error})),
 * ]
 * ```
 *
 * Important note: due to the way this is implemented in basically all runtimes, the debouncer's
 * clock might not tick during sleep, so if you do `await debounced()` and immediately sleep in a
 * low-power state for 5 minutes, you might have to wait another 10 minutes after resuming to a
 * high-power state.
 */
var debouncer = (delay) => rateLimiterImpl(delay, 0)

export {throttler, debouncer}
