import m from "../core/hyperscript.js"

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
possible, so they should use the handle itself as the key for `m.key(...)`. It might look something
like this:

```js
return t.live().map((handle) => (
	m.key(handle, m(Entry, {
		name: handle.key,
		value: handle.value,
		removed: handle.signal.aborted,
		onremovaltransitionended: () => handle.release(),
	}))
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
*/

/**
 * @template K, V
 * @typedef TrackedHandle
 *
 * @property {K} key
 * @property {V} value
 * @property {AbortSignal} signal
 * @property {() => void} release
 */

/**
 * @template K, V
 * @typedef Tracked
 *
 * @property {() => Array<TrackedHandle<K, V>>} live
 * @property {() => Array<[K, V]>} list
 * @property {(key: K) => boolean} has
 * @property {(key: K) => undefined | V} get
 * @property {(key: K, value: V) => void} track
 * @property {(key: K, value: V) => void} replace
 * @property {(key: K) => boolean} delete
 */

/**
 * @template K, V
 * @param {Iterable<[K, V]>} [initial]
 * @param {() => void} [onUpdate]
 * @returns {Tracked<K, V>}
 */
var tracked = (initial, onUpdate = m.redraw) => {
	/** @type {Map<K, TrackedHandle<K, V> & {_: AbortController}>} */ var state = new Map()
	/** @type {Set<TrackedHandle<K, V>>} */ var live = new Set()

	var abort = (prev) => {
		try {
			if (prev) {
				if (prev._) prev._.abort()
				else live.delete(prev)
			}
		} catch (e) {
			console.error(e)
		}
	}

	// Bit 1 forcibly releases the old handle, and bit 2 causes an update notification to be sent
	// (something that's unwanted during initialization).
	var setHandle = (k, v, bits) => {
		var prev = state.get(k)
		var ctrl = new AbortController()
		/** @type {TrackedHandle<K, V>} */
		var handle = {
			_: ctrl,
			key: k,
			value: v,
			signal: ctrl.signal,
			release() {
				if (state.get(handle.key) === handle) {
					handle._ = null
				} else if (live.delete(handle)) {
					onUpdate()
				}
			},
		}
		state.set(k, handle)
		live.add(handle)
		// eslint-disable-next-line no-bitwise
		if (bits & 1) live.delete(prev)
		abort(prev)
		// eslint-disable-next-line no-bitwise
		if (bits & 2) onUpdate()
	}

	for (var [k, v] of initial || []) setHandle(k, v, 1)

	return {
		live: () => [...live],
		list: () => Array.from(state.values(), (h) => [h.key, h.value]),
		has: (k) => state.has(k),
		get: (k) => (k = state.get(k)) && k.value,
		set: (k, v) => setHandle(k, v, 3),
		replace: (k, v) => setHandle(k, v, 2),
		delete(k) {
			var prev = state.get(k)
			var result = state.delete(k)
			abort(prev)
			onUpdate()
			return result
		},
	}
}

export {tracked as default}
