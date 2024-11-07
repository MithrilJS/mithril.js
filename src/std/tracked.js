/*
Here's the intent.
- Usage in model:
	- List
	- Get
	- Track
	- Delete
	- Replace (equivalent to delete + track)
- Usage in view:
	- Iterate live handles
	- Release aborted live handles that no longer needed

Models can do basic CRUD operations on the collection.
- They can list what's currently there.
- They can get a current value.
- They can set the current value.
- They can delete the current value.
- They can replace the current value, deleting a value that's already there.

In the view, they use handles to abstract over the concept of a key. Duplicates are theoretically
possible, so they should use the handle itself as the key for `m.keyed(...)`. It might look
something like this:

```js
return m.keyed(t.live(), (handle) => (
	[handle.key, m(Entry, {
		name: handle.key,
		value: handle.value,
		removed: handle.signal.aborted,
		onremovaltransitionended: () => handle.release(),
	})]
))
```

There used to be an in-renderer way to manage this transparently, but there's a couple big reasons
why that was removed in favor of this:

1. It's very complicated to get right. Like, the majority of the removal code was related to it. In
   fact, this module is considerably smaller than the code that'd have to go into the renderer to
   support it, as this isn't nearly as perf-sensitive as that.
2. When you need to remove something asynchronously, there's multiple ways you may want to manage
   transitions. You might want to stagger them. You might want to do them all at once. You might
   want to clear some state and not other state. You might want to preserve some elements of a
   sibling's state. Embedding it in the renderer would force an opinion on you, and in order to
   work around it, you'd have to do something like this anyways.

As for the difference between `m.trackedList()` and `m.tracked()`, the first is for tracking lists
(and is explained above), and `m.tracked()` is for single values (but uses `m.trackedList()`
internally to avoid a ton of code duplication).
*/

import m from "../core.js"

import {checkCallback, noop} from "../util.js"

/**
 * @template K, V
 * @typedef TrackedHandle
 *
 * @property {K} key
 * @property {V} value
 * @property {AbortSignal} signal
 * @property {() => void} release
 * @property {() => void} remove
 */

/**
 * @template K, V
 * @typedef Tracked
 *
 * @property {() => Array<TrackedHandle<K, V>>} live
 * @property {() => Array<[K, V]>} list
 * @property {(key: K) => boolean} has
 * @property {(key: K) => undefined | V} get
 * @property {(key: K, value: V) => void} set
 * @property {(key: K, value: V) => void} replace
 * @property {(key: K) => boolean} delete
 */

var trackedState = (redraw) => {
	checkCallback(redraw, false, "redraw")
	/** @type {Map<K, AbortController & TrackedHandle<K, V>>} */
	var state = new Map()
	var removed = new WeakSet()
	/** @type {Set<TrackedHandle<K, V>>} */ var live = new Set()

	/** @param {null | AbortController & TrackedHandle<K, V>} prev */
	var abort = (prev) => {
		try {
			if (prev) {
				if (removed.has(prev)) {
					live.delete(prev)
				} else {
					prev.abort()
				}
			}
		} catch (e) {
			console.error(e)
		}
	}

	/** @param {K} k */
	var remove = (k, r) => {
		var prev = state.get(k)
		var result = state.delete(k)
		abort(prev)
		if (r) redraw()
		return result
	}

	/**
	 * @param {K} k
	 * @param {V} v
	 * @param {number} bits
	 * Bit 1 forcibly releases the old handle, and bit 2 causes an update notification to be sent
	 * (something that's unwanted during initialization).
	 */
	var setHandle = (k, v, bits) => {
		var prev = state.get(k)
		// Note: it extending `AbortController` is an implementation detail. It exposing a `signal`
		// property is *not*.
		var handle = /** @type {AbortController & TrackedHandle<K, V>} */ (new AbortController())
		handle.key = k
		handle.value = v
		handle.release = (ev) => {
			if (ev) m.capture(ev)
			if (!handle) return
			if (state.get(handle.key) === handle) {
				removed.add(handle)
				handle = null
			} else if (live.delete(handle)) {
				redraw()
			}
		}
		handle.remove = (ev) => {
			if (ev) m.capture(ev)
			remove(handle.key, 0)
		}
		state.set(k, handle)
		live.add(handle)
		// eslint-disable-next-line no-bitwise
		if (bits & 1) live.delete(prev)
		abort(prev)
		// eslint-disable-next-line no-bitwise
		if (bits & 2) redraw()
	}

	return {s: state, l: live, h: setHandle, r: remove}
}

/**
 * @template K, V
 * @param {Iterable<[K, V]>} [initial]
 * @param {() => void} redraw
 * @returns {TrackedList<K, V>}
 */
var trackedList = (redraw, initial) => {
	var {s: state, l: live, h: setHandle, r: remove} = trackedState(redraw)

	for (var [k, v] of initial || []) setHandle(k, v, 1)

	return {
		live: () => [...live],
		list: () => Array.from(state.values(), (h) => [h.key, h.value]),
		has: (k) => state.has(k),
		get: (k) => (k = state.get(k)) && k.value,
		set: (k, v) => setHandle(k, v, 3),
		replace: (k, v) => setHandle(k, v, 2),
		delete: (k) => remove(k, 1),
		forget: (k) => (k = state.get(k)) && k.release(),
	}
}

var tracked = (redraw) => {
	var {l: live, h: setHandle, r: remove} = trackedState(redraw)
	var initial = noop
	var id = -1
	return (state) => {
		if (!Object.is(initial, initial = state)) {
			remove(id++, 0)
			setHandle(id, state, 1)
		}
		return [...live]
	}
}

export {tracked, trackedList}
