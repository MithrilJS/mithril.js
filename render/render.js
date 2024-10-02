"use strict"

var Vnode = require("../render/vnode")

var xlinkNs = "http://www.w3.org/1999/xlink"
var nameSpace = {
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML"
}

// The vnode path is needed for proper removal unblocking. It's not retained past a given
// render and is overwritten on every vnode visit, so callers wanting to retain it should
// always clone the part they're interested in.
var vnodePath
var blockedRemovalRefCount = /*@__PURE__*/new WeakMap()
var removalRequested = /*@__PURE__*/new WeakSet()
var currentRedraw

function getDocument(dom) {
	return dom.ownerDocument;
}

function getNameSpace(vnode) {
	return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
}

//sanity check to discourage people from doing `vnode.state = ...`
function checkState(vnode, original) {
	if (vnode.state !== original) throw new Error("'vnode.state' must not be modified.")
}

//Note: the hook is passed as the `this` argument to allow proxying the
//arguments without requiring a full array allocation to do so. It also
//takes advantage of the fact the current `vnode` is the first argument in
//all lifecycle methods.
function callHook(vnode) {
	var original = vnode.state
	try {
		return this.apply(original, arguments)
	} finally {
		checkState(vnode, original)
	}
}

// IE11 (at least) throws an UnspecifiedError when accessing document.activeElement when
// inside an iframe. Catch and swallow this error, and heavy-handidly return null.
function activeElement(dom) {
	try {
		return getDocument(dom).activeElement
	} catch (e) {
		return null
	}
}
//create
function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
	for (var i = start; i < end; i++) {
		var vnode = vnodes[i]
		if (vnode != null) {
			createNode(parent, vnode, hooks, ns, nextSibling)
		}
	}
}
function createNode(parent, vnode, hooks, ns, nextSibling) {
	var tag = vnode.tag
	if (typeof tag === "string") {
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
		switch (tag) {
			case "#": createText(parent, vnode, nextSibling); break
			case "=":
			case "[": createFragment(parent, vnode, hooks, ns, nextSibling); break
			default: createElement(parent, vnode, hooks, ns, nextSibling)
		}
	}
	else createComponent(parent, vnode, hooks, ns, nextSibling)
}
function createText(parent, vnode, nextSibling) {
	vnode.dom = getDocument(parent).createTextNode(vnode.children)
	insertDOM(parent, vnode.dom, nextSibling)
}
function createFragment(parent, vnode, hooks, ns, nextSibling) {
	var fragment = getDocument(parent).createDocumentFragment()
	if (vnode.children != null) {
		var children = vnode.children
		createNodes(fragment, children, 0, children.length, hooks, null, ns)
	}
	vnode.dom = fragment.firstChild
	insertDOM(parent, fragment, nextSibling)
}
function createElement(parent, vnode, hooks, ns, nextSibling) {
	var tag = vnode.tag
	var attrs = vnode.attrs
	var is = attrs && attrs.is

	ns = getNameSpace(vnode) || ns

	var element = ns ?
		is ? getDocument(parent).createElementNS(ns, tag, {is: is}) : getDocument(parent).createElementNS(ns, tag) :
		is ? getDocument(parent).createElement(tag, {is: is}) : getDocument(parent).createElement(tag)
	vnode.dom = element

	if (attrs != null) {
		setAttrs(vnode, attrs, ns)
	}

	insertDOM(parent, element, nextSibling)

	if (!maybeSetContentEditable(vnode)) {
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(element, children, 0, children.length, hooks, null, ns)
			if (vnode.tag === "select" && attrs != null) setLateSelectAttrs(vnode, attrs)
		}
	}
}
var reentrantLock = new WeakSet()
function initComponent(vnode, hooks) {
	vnode.state = void 0
	if (reentrantLock.has(vnode.tag)) return
	reentrantLock.add(vnode.tag)
	vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode)
	initLifecycle(vnode.state, vnode, hooks)
	if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
	vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
	if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
	reentrantLock.delete(vnode.tag)
}
function createComponent(parent, vnode, hooks, ns, nextSibling) {
	initComponent(vnode, hooks)
	if (vnode.instance != null) {
		createNode(parent, vnode.instance, hooks, ns, nextSibling)
		vnode.dom = vnode.instance.dom
	}
}

//update
/**
 * @param {Element|Fragment} parent - the parent element
 * @param {Vnode[] | null} old - the list of vnodes of the last `render()` call for
 *                               this part of the tree
 * @param {Vnode[] | null} vnodes - as above, but for the current `render()` call.
 * @param {Function[]} hooks - an accumulator of post-render hooks (oncreate/onupdate)
 * @param {Element | null} nextSibling - the next DOM node if we're dealing with a
 *                                       fragment that is not the last item in its
 *                                       parent
 * @param {'svg' | 'math' | String | null} ns) - the current XML namespace, if any
 * @returns void
 */
// This function diffs and patches lists of vnodes, both keyed and unkeyed.
//
// We will:
//
// 1. describe its general structure
// 2. focus on the diff algorithm optimizations
// 3. discuss DOM node operations.

// ## Overview:
//
// The updateNodes() function:
// - deals with trivial cases
// - determines whether the lists are keyed or unkeyed based on the first non-null node
//   of each list.
// - diffs them and patches the DOM if needed (that's the brunt of the code)
// - manages the leftovers: after diffing, are there:
//   - old nodes left to remove?
// 	 - new nodes to insert?
// 	 deal with them!
//
// The lists are only iterated over once, with an exception for the nodes in `old` that
// are visited in the fourth part of the diff and in the `removeNodes` loop.

// ## Diffing
//
// Reading https://github.com/localvoid/ivi/blob/ddc09d06abaef45248e6133f7040d00d3c6be853/packages/ivi/src/vdom/implementation.ts#L617-L837
// may be good for context on longest increasing subsequence-based logic for moving nodes.
//
// In order to diff keyed lists, one has to
//
// 1) match nodes in both lists, per key, and update them accordingly
// 2) create the nodes present in the new list, but absent in the old one
// 3) remove the nodes present in the old list, but absent in the new one
// 4) figure out what nodes in 1) to move in order to minimize the DOM operations.
//
// To achieve 1) one can create a dictionary of keys => index (for the old list), then iterate
// over the new list and for each new vnode, find the corresponding vnode in the old list using
// the map.
// 2) is achieved in the same step: if a new node has no corresponding entry in the map, it is new
// and must be created.
// For the removals, we actually remove the nodes that have been updated from the old list.
// The nodes that remain in that list after 1) and 2) have been performed can be safely removed.
// The fourth step is a bit more complex and relies on the longest increasing subsequence (LIS)
// algorithm.
//
// the longest increasing subsequence is the list of nodes that can remain in place. Imagine going
// from `1,2,3,4,5` to `4,5,1,2,3` where the numbers are not necessarily the keys, but the indices
// corresponding to the keyed nodes in the old list (keyed nodes `e,d,c,b,a` => `b,a,e,d,c` would
//  match the above lists, for example).
//
// In there are two increasing subsequences: `4,5` and `1,2,3`, the latter being the longest. We
// can update those nodes without moving them, and only call `insertNode` on `4` and `5`.
//
// @localvoid adapted the algo to also support node deletions and insertions (the `lis` is actually
// the longest increasing subsequence *of old nodes still present in the new list*).
//
// It is a general algorithm that is fireproof in all circumstances, but it requires the allocation
// and the construction of a `key => oldIndex` map, and three arrays (one with `newIndex => oldIndex`,
// the `LIS` and a temporary one to create the LIS).
//
// So we cheat where we can: if the tails of the lists are identical, they are guaranteed to be part of
// the LIS and can be updated without moving them.
//
// If two nodes are swapped, they are guaranteed not to be part of the LIS, and must be moved (with
// the exception of the last node if the list is fully reversed).
//
// ## Finding the next sibling.
//
// `updateNode()` and `createNode()` expect a nextSibling parameter to perform DOM operations.
// When the list is being traversed top-down, at any index, the DOM nodes up to the previous
// vnode reflect the content of the new list, whereas the rest of the DOM nodes reflect the old
// list. The next sibling must be looked for in the old list using `getNextSibling(... oldStart + 1 ...)`.
//
// In the other scenarios (swaps, upwards traversal, map-based diff),
// the new vnodes list is traversed upwards. The DOM nodes at the bottom of the list reflect the
// bottom part of the new vnodes list, and we can use the `v.dom`  value of the previous node
// as the next sibling (cached in the `nextSibling` variable).


// ## DOM node moves
//
// In most scenarios `updateNode()` and `createNode()` perform the DOM operations. However,
// this is not the case if the node moved (second and fourth part of the diff algo). We move
// the old DOM nodes before updateNode runs because it enables us to use the cached `nextSibling`
// variable rather than fetching it using `getNextSibling()`.

function updateNodes(parent, old, vnodes, hooks, nextSibling, ns, pathDepth) {
	if (old === vnodes || old == null && vnodes == null) return
	else if (old == null || old.length === 0) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
	else if (vnodes == null || vnodes.length === 0) removeNodes(parent, old, 0, old.length, pathDepth, false)
	else {
		var isOldKeyed = old[0] != null && old[0].tag === "="
		var isKeyed = vnodes[0] != null && vnodes[0].tag === "="
		var start = 0, oldStart = 0
		if (!isOldKeyed) while (oldStart < old.length && old[oldStart] == null) oldStart++
		if (!isKeyed) while (start < vnodes.length && vnodes[start] == null) start++
		if (isOldKeyed !== isKeyed) {
			removeNodes(parent, old, oldStart, old.length, pathDepth, false)
			createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
		} else if (!isKeyed) {
			// Don't index past the end of either list (causes deopts).
			var commonLength = old.length < vnodes.length ? old.length : vnodes.length
			// Rewind if necessary to the first non-null index on either side.
			// We could alternatively either explicitly create or remove nodes when `start !== oldStart`
			// but that would be optimizing for sparse lists which are more rare than dense ones.
			start = start < oldStart ? start : oldStart
			for (; start < commonLength; start++) {
				o = old[start]
				v = vnodes[start]
				if (o === v || o == null && v == null) continue
				else if (o == null) createNode(parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling))
				else if (v == null) removeNode(parent, o, pathDepth, false)
				else updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns, pathDepth)
			}
			if (old.length > commonLength) removeNodes(parent, old, start, old.length, pathDepth, false)
			if (vnodes.length > commonLength) createNodes(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
		} else {
			// keyed diff
			var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling

			// bottom-up
			while (oldEnd >= oldStart && end >= start) {
				oe = old[oldEnd]
				ve = vnodes[end]
				if (oe.state !== ve.state) break
				if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns, pathDepth)
				if (ve.dom != null) nextSibling = ve.dom
				oldEnd--, end--
			}
			// top-down
			while (oldEnd >= oldStart && end >= start) {
				o = old[oldStart]
				v = vnodes[start]
				if (o.state !== v.state) break
				oldStart++, start++
				if (o !== v) updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns, pathDepth)
			}
			// swaps and list reversals
			while (oldEnd >= oldStart && end >= start) {
				if (start === end) break
				if (o.state !== ve.state || oe.state !== v.state) break
				topSibling = getNextSibling(old, oldStart, nextSibling)
				moveDOM(parent, oe, topSibling)
				if (oe !== v) updateNode(parent, oe, v, hooks, topSibling, ns, pathDepth)
				if (++start <= --end) moveDOM(parent, o, nextSibling)
				if (o !== ve) updateNode(parent, o, ve, hooks, nextSibling, ns, pathDepth)
				if (ve.dom != null) nextSibling = ve.dom
				oldStart++; oldEnd--
				oe = old[oldEnd]
				ve = vnodes[end]
				o = old[oldStart]
				v = vnodes[start]
			}
			// bottom up once again
			while (oldEnd >= oldStart && end >= start) {
				if (oe.state !== ve.state) break
				if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns, pathDepth)
				if (ve.dom != null) nextSibling = ve.dom
				oldEnd--, end--
				oe = old[oldEnd]
				ve = vnodes[end]
			}
			if (start > end) removeNodes(parent, old, oldStart, oldEnd + 1, pathDepth, false)
			else if (oldStart > oldEnd) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
			else {
				// inspired by ivi https://github.com/ivijs/ivi/ by Boris Kaul
				var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li=0, i=0, pos = 2147483647, matched = 0, map, lisIndices
				for (i = 0; i < vnodesLength; i++) oldIndices[i] = -1
				for (i = end; i >= start; i--) {
					if (map == null) map = getKeyMap(old, oldStart, oldEnd + 1)
					ve = vnodes[i]
					var oldIndex = map[ve.state]
					if (oldIndex != null) {
						pos = (oldIndex < pos) ? oldIndex : -1 // becomes -1 if nodes were re-ordered
						oldIndices[i-start] = oldIndex
						oe = old[oldIndex]
						old[oldIndex] = null
						if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns, pathDepth)
						if (ve.dom != null) nextSibling = ve.dom
						matched++
					}
				}
				nextSibling = originalNextSibling
				if (matched !== oldEnd - oldStart + 1) removeNodes(parent, old, oldStart, oldEnd + 1, pathDepth, false)
				if (matched === 0) createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
				else {
					if (pos === -1) {
						// the indices of the indices of the items that are part of the
						// longest increasing subsequence in the oldIndices list
						lisIndices = makeLisIndices(oldIndices)
						li = lisIndices.length - 1
						for (i = end; i >= start; i--) {
							v = vnodes[i]
							if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
							else {
								if (lisIndices[li] === i - start) li--
								else moveDOM(parent, v, nextSibling)
							}
							if (v.dom != null) nextSibling = vnodes[i].dom
						}
					} else {
						for (i = end; i >= start; i--) {
							v = vnodes[i]
							if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
							if (v.dom != null) nextSibling = vnodes[i].dom
						}
					}
				}
			}
		}
	}
}
function updateNode(parent, old, vnode, hooks, nextSibling, ns, pathDepth) {
	var oldTag = old.tag, tag = vnode.tag
	if (oldTag === tag) {
		vnode.state = old.state
		vnode.instance = old.instance
		if (shouldNotUpdate(vnode, old)) return
		vnodePath[pathDepth++] = parent
		vnodePath[pathDepth++] = vnode
		if (typeof oldTag === "string") {
			if (vnode.attrs != null) {
				updateLifecycle(vnode.attrs, vnode, hooks)
			}
			switch (oldTag) {
				case "#": updateText(old, vnode); break
				case "=":
				case "[": updateFragment(parent, old, vnode, hooks, nextSibling, ns, pathDepth); break
				default: updateElement(old, vnode, hooks, ns, pathDepth)
			}
		}
		else updateComponent(parent, old, vnode, hooks, nextSibling, ns, pathDepth)
	}
	else {
		removeNode(parent, old, pathDepth, false)
		createNode(parent, vnode, hooks, ns, nextSibling)
	}
}
function updateText(old, vnode) {
	if (old.children.toString() !== vnode.children.toString()) {
		old.dom.nodeValue = vnode.children
	}
	vnode.dom = old.dom
}
function updateFragment(parent, old, vnode, hooks, nextSibling, ns, pathDepth) {
	updateNodes(parent, old.children, vnode.children, hooks, nextSibling, ns, pathDepth)
	vnode.dom = null
	if (vnode.children != null) {
		for (var child of vnode.children) {
			if (child != null && child.dom != null) {
				if (vnode.dom == null) vnode.dom = child.dom
			}
		}
	}
}
function updateElement(old, vnode, hooks, ns, pathDepth) {
	var element = vnode.dom = old.dom
	ns = getNameSpace(vnode) || ns

	updateAttrs(vnode, old.attrs, vnode.attrs, ns)
	if (!maybeSetContentEditable(vnode)) {
		updateNodes(element, old.children, vnode.children, hooks, null, ns, pathDepth)
	}
}
function updateComponent(parent, old, vnode, hooks, nextSibling, ns, pathDepth) {
	vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
	if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
	updateLifecycle(vnode.state, vnode, hooks)
	if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks)
	if (vnode.instance != null) {
		if (old.instance == null) createNode(parent, vnode.instance, hooks, ns, nextSibling)
		else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, ns, pathDepth)
		vnode.dom = vnode.instance.dom
	}
	else if (old.instance != null) {
		removeNode(parent, old.instance, pathDepth, false)
		vnode.dom = undefined
	}
	else {
		vnode.dom = old.dom
	}
}
function getKeyMap(vnodes, start, end) {
	var map = Object.create(null)
	for (; start < end; start++) {
		var vnode = vnodes[start]
		if (vnode != null) {
			map[vnode.state] = start
		}
	}
	return map
}
// Lifted from ivi https://github.com/ivijs/ivi/
// takes a list of unique numbers (-1 is special and can
// occur multiple times) and returns an array with the indices
// of the items that are part of the longest increasing
// subsequence
var lisTemp = []
function makeLisIndices(a) {
	var result = [0]
	var u = 0, v = 0, i = 0
	var il = lisTemp.length = a.length
	for (var i = 0; i < il; i++) lisTemp[i] = a[i]
	for (var i = 0; i < il; ++i) {
		if (a[i] === -1) continue
		var j = result[result.length - 1]
		if (a[j] < a[i]) {
			lisTemp[i] = j
			result.push(i)
			continue
		}
		u = 0
		v = result.length - 1
		while (u < v) {
			// Fast integer average without overflow.
			// eslint-disable-next-line no-bitwise
			var c = (u >>> 1) + (v >>> 1) + (u & v & 1)
			if (a[result[c]] < a[i]) {
				u = c + 1
			}
			else {
				v = c
			}
		}
		if (a[i] < a[result[u]]) {
			if (u > 0) lisTemp[i] = result[u - 1]
			result[u] = i
		}
	}
	u = result.length
	v = result[u - 1]
	while (u-- > 0) {
		result[u] = v
		v = lisTemp[v]
	}
	lisTemp.length = 0
	return result
}

function getNextSibling(vnodes, i, nextSibling) {
	for (; i < vnodes.length; i++) {
		if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
	}
	return nextSibling
}

// This handles fragments with zombie children (removed from vdom, but persisted in DOM through onbeforeremove)
function moveDOM(parent, vnode, nextSibling) {
	if (typeof vnode.tag === "function") {
		return moveDOM(parent, vnode.instance, nextSibling)
	} else if (vnode.tag === "[" || vnode.tag === "=") {
		if (Array.isArray(vnode.children)) {
			for (var child of vnode.children) {
				nextSibling = moveDOM(parent, child, nextSibling)
			}
		}
		return nextSibling
	} else {
		insertDOM(parent, vnode.dom, nextSibling)
		return vnode.dom
	}
}

function insertDOM(parent, dom, nextSibling) {
	if (nextSibling != null) parent.insertBefore(dom, nextSibling)
	else parent.appendChild(dom)
}

function maybeSetContentEditable(vnode) {
	if (vnode.attrs == null || (
		vnode.attrs.contenteditable == null && // attribute
		vnode.attrs.contentEditable == null // property
	)) return false
	var children = vnode.children
	if (children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted.")
	return true
}

//remove
function invokeBeforeRemove(vnode, host) {
	try {
		if (typeof host.onbeforeremove === "function") {
			var result = callHook.call(host.onbeforeremove, vnode)
			if (result != null && typeof result.then === "function") return Promise.resolve(result)
		}
	} catch (e) {
		// Errors during removal aren't fatal. Just log them.
		console.error(e)
	}
}
function tryProcessRemoval(parent, vnode) {
	// eslint-disable-next-line no-bitwise
	var refCount = blockedRemovalRefCount.get(vnode) | 0
	if (refCount > 1) {
		blockedRemovalRefCount.set(vnode, refCount - 1)
		return false
	}

	if (typeof vnode.tag !== "function" && vnode.tag !== "[" && vnode.tag !== "=") {
		parent.removeChild(vnode.dom)
	}

	try {
		if (typeof vnode.tag !== "string" && typeof vnode.state.onremove === "function") {
			callHook.call(vnode.state.onremove, vnode)
		}
	} catch (e) {
		console.error(e)
	}

	try {
		if (vnode.attrs && typeof vnode.attrs.onremove === "function") {
			callHook.call(vnode.attrs.onremove, vnode)
		}
	} catch (e) {
		console.error(e)
	}

	return true
}
function removeNodeAsyncRecurse(parent, vnode) {
	while (vnode != null) {
		// Delay the actual subtree removal if there's still pending `onbeforeremove` hooks on
		// this node or a child node.
		if (!tryProcessRemoval(parent, vnode)) return false
		if (typeof vnode.tag !== "function") {
			if (vnode.tag === "#") break
			if (vnode.tag !== "[" && vnode.tag !== "=") parent = vnode.dom
			// Using bitwise ops and `Array.prototype.reduce` to reduce code size. It's not
			// called nearly enough to merit further optimization.
			// eslint-disable-next-line no-bitwise
			return vnode.children.reduce((fail, child) => fail & removeNodeAsyncRecurse(parent, child), 1)
		}
		vnode = vnode.instance
	}

	return true
}
function removeNodes(parent, vnodes, start, end, pathDepth, isDelayed) {
	// Using bitwise ops to reduce code size.
	var fail = 0
	// eslint-disable-next-line no-bitwise
	for (var i = start; i < end; i++) fail |= !removeNode(parent, vnodes[i], pathDepth, isDelayed)
	return !fail
}
function removeNode(parent, vnode, pathDepth, isDelayed) {
	if (vnode != null) {
		delayed: {
			var attrsResult, stateResult

			// Block removes, but do call nested `onbeforeremove`.
			if (typeof vnode.tag !== "string") attrsResult = invokeBeforeRemove(vnode, vnode.state)
			if (vnode.attrs != null) stateResult = invokeBeforeRemove(vnode, vnode.attrs)

			vnodePath[pathDepth++] = parent
			vnodePath[pathDepth++] = vnode

			if (attrsResult || stateResult) {
				var path = vnodePath.slice(0, pathDepth)
				var settle = () => {

					// Remove the innermost node recursively and try to remove the parents
					// non-recursively.
					// If it's still delayed, skip. If this node is delayed, all its ancestors are
					// also necessarily delayed, and so they should be skipped.
					var i = path.length - 2
					if (removeNodeAsyncRecurse(path[i], path[i + 1])) {
						while ((i -= 2) >= 0 && removalRequested.has(path[i + 1])) {
							tryProcessRemoval(path[i], path[i + 1])
						}
					}
				}
				var increment = 0

				if (attrsResult) {
					attrsResult.catch(console.error)
					attrsResult.then(settle, settle)
					increment++
				}

				if (stateResult) {
					stateResult.catch(console.error)
					stateResult.then(settle, settle)
					increment++
				}

				isDelayed = true

				for (var i = 1; i < pathDepth; i += 2) {
					// eslint-disable-next-line no-bitwise
					blockedRemovalRefCount.set(vnodePath[i], (blockedRemovalRefCount.get(vnodePath[i]) | 0) + increment)
				}
			}

			if (typeof vnode.tag === "function") {
				if (vnode.instance != null && !removeNode(parent, vnode.instance, pathDepth, isDelayed)) break delayed
			} else if (vnode.tag !== "#") {
				if (!removeNodes(
					vnode.tag !== "[" && vnode.tag !== "=" ? vnode.dom : parent,
					vnode.children, 0, vnode.children.length, pathDepth, isDelayed
				)) break delayed
			}

			// Don't call removal hooks if removal is delayed.
			// Delay the actual subtree removal if there's still pending `onbeforeremove` hooks on
			// this node or a child node.
			if (isDelayed || tryProcessRemoval(parent, vnode)) break delayed

			return false
		}

		removalRequested.add(vnode)
	}

	return true
}

//attrs
function setAttrs(vnode, attrs, ns) {
	// The DOM does things to inputs based on the value, so it needs set first.
	// See: https://github.com/MithrilJS/mithril.js/issues/2622
	if (vnode.tag === "input" && attrs.type != null) vnode.dom.type = attrs.type
	var isFileInput = attrs != null && vnode.tag === "input" && attrs.type === "file"
	for (var key in attrs) {
		setAttr(vnode, key, null, attrs[key], ns, isFileInput)
	}
}
function setAttr(vnode, key, old, value, ns, isFileInput) {
	if (value == null || isSpecialAttribute.has(key) || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || key === "type" && vnode.tag === "input") return
	if (key.startsWith("on")) updateEvent(vnode, key, value)
	else if (key.startsWith("xlink:")) vnode.dom.setAttributeNS(xlinkNs, key.slice(6), value)
	else if (key === "style") updateStyle(vnode.dom, old, value)
	else if (hasPropertyKey(vnode, key, ns)) {
		if (key === "value") {
			// Only do the coercion if we're actually going to check the value.
			/* eslint-disable no-implicit-coercion */
			switch (vnode.tag) {
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				//setting input[type=file][value] to same value causes an error to be generated if it's non-empty
				case "input":
				case "textarea":
					if (vnode.dom.value === "" + value && (isFileInput || vnode.dom === activeElement(vnode.dom))) return
					//setting input[type=file][value] to different value is an error if it's non-empty
					// Not ideal, but it at least works around the most common source of uncaught exceptions for now.
					if (isFileInput && "" + value !== "") { console.error("`value` is read-only on file inputs!"); return }
					break
				//setting select[value] or option[value] to same value while having select open blinks select dropdown in Chrome
				case "select":
				case "option":
					if (old !== null && vnode.dom.value === "" + value) return
			}
			/* eslint-enable no-implicit-coercion */
		}
		vnode.dom[key] = value
	} else if (value === false) {
		vnode.dom.removeAttribute(key)
	} else {
		vnode.dom.setAttribute(key, value === true ? "" : value)
	}
}
function removeAttr(vnode, key, old, ns) {
	if (old == null || isSpecialAttribute.has(key)) return
	if (key.startsWith("on")) updateEvent(vnode, key, undefined)
	else if (key.startsWith("xlink:")) vnode.dom.removeAttributeNS(xlinkNs, key.slice(6))
	else if (key === "style") updateStyle(vnode.dom, old, null)
	else if (
		hasPropertyKey(vnode, key, ns)
		&& key !== "class"
		&& key !== "title" // creates "null" as title
		&& !(key === "value" && (
			vnode.tag === "option"
			|| vnode.tag === "select" && vnode.dom.selectedIndex === -1 && vnode.dom === activeElement(vnode.dom)
		))
		&& !(vnode.tag === "input" && key === "type")
	) {
		vnode.dom[key] = null
	} else {
		if (old !== false) vnode.dom.removeAttribute(key)
	}
}
function setLateSelectAttrs(vnode, attrs) {
	if ("value" in attrs) {
		if(attrs.value === null) {
			if (vnode.dom.selectedIndex !== -1) vnode.dom.value = null
		} else {
			var normalized = "" + attrs.value // eslint-disable-line no-implicit-coercion
			if (vnode.dom.value !== normalized || vnode.dom.selectedIndex === -1) {
				vnode.dom.value = normalized
			}
		}
	}
	if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined)
}
function updateAttrs(vnode, old, attrs, ns) {
	if (old && old === attrs) {
		console.warn("Don't reuse attrs object, use new object for every redraw, this will throw in next major")
	}
	if (attrs != null) {
		// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
		//
		// Also, the DOM does things to inputs based on the value, so it needs set first.
		// See: https://github.com/MithrilJS/mithril.js/issues/2622
		if (vnode.tag === "input" && attrs.type != null) vnode.dom.setAttribute("type", attrs.type)
		var isFileInput = vnode.tag === "input" && attrs.type === "file"
		for (var key in attrs) {
			setAttr(vnode, key, old && old[key], attrs[key], ns, isFileInput)
		}
	}
	var val
	if (old != null) {
		for (var key in old) {
			if (((val = old[key]) != null) && (attrs == null || attrs[key] == null)) {
				removeAttr(vnode, key, val, ns)
			}
		}
	}
}
var isAlwaysFormAttribute = new Set(["value", "checked", "selected", "selectedIndex"])
var isSpecialAttribute = new Set(["key", "is", "oninit", "oncreate", "onupdate", "onremove", "onbeforeupdate", "onbeforeremove"])
// Try to avoid a few browser bugs on normal elements.
// var propertyMayBeBugged = new Set(["href", "list", "form", "width", "height", "type"])
var propertyMayBeBugged = new Set(["href", "list", "form", "width", "height"])
function isFormAttribute(vnode, attr) {
	return isAlwaysFormAttribute.has(attr) || attr === "selected" && vnode.dom === activeElement(vnode.dom) || vnode.tag === "option" && vnode.dom.parentNode === activeElement(vnode.dom)
}
function hasPropertyKey(vnode, key, ns) {
	// Filter out namespaced keys
	return ns === undefined && (
		// If it's a custom element, just keep it.
		vnode.tag.indexOf("-") > -1 || vnode.attrs != null && vnode.attrs.is ||
		!propertyMayBeBugged.has(key)
		// Defer the property check until *after* we check everything.
	) && key in vnode.dom
}

//style
var uppercaseRegex = /[A-Z]/g
function toLowerCase(capital) { return "-" + capital.toLowerCase() }
function normalizeKey(key) {
	return key[0] === "-" && key[1] === "-" ? key :
		key === "cssFloat" ? "float" :
			key.replace(uppercaseRegex, toLowerCase)
}
function updateStyle(element, old, style) {
	if (old === style) {
		// Styles are equivalent, do nothing.
	} else if (style == null) {
		// New style is missing, just clear it.
		element.style = ""
	} else if (typeof style !== "object") {
		// New style is a string, let engine deal with patching.
		element.style = style
	} else if (old == null || typeof old !== "object") {
		// `old` is missing or a string, `style` is an object.
		element.style.cssText = ""
		// Add new style properties
		for (var key in style) {
			var value = style[key]
			if (value != null) element.style.setProperty(normalizeKey(key), String(value))
		}
	} else {
		// Both old & new are (different) objects.
		// Update style properties that have changed
		for (var key in style) {
			var value = style[key]
			if (value != null && (value = String(value)) !== String(old[key])) {
				element.style.setProperty(normalizeKey(key), value)
			}
		}
		// Remove style properties that no longer exist
		for (var key in old) {
			if (old[key] != null && style[key] == null) {
				element.style.removeProperty(normalizeKey(key))
			}
		}
	}
}

// Here's an explanation of how this works:
// 1. The event names are always (by design) prefixed by `on`.
// 2. The EventListener interface accepts either a function or an object
//    with a `handleEvent` method.
// 3. The object does not inherit from `Object.prototype`, to avoid
//    any potential interference with that (e.g. setters).
// 4. The event name is remapped to the handler before calling it.
// 5. In function-based event handlers, `ev.target === this`. We replicate
//    that below.
// 6. In function-based event handlers, `return false` prevents the default
//    action and stops event propagation. We replicate that below.
function EventDict() {
	// Save this, so the current redraw is correctly tracked.
	this._ = currentRedraw
}
EventDict.prototype = Object.create(null)
EventDict.prototype.handleEvent = function (ev) {
	var handler = this["on" + ev.type]
	var result
	if (typeof handler === "function") result = handler.call(ev.currentTarget, ev)
	else if (typeof handler.handleEvent === "function") handler.handleEvent(ev)
	if (this._ && ev.redraw !== false) (0, this._)()
	if (result === false) {
		ev.preventDefault()
		ev.stopPropagation()
	}
}

//event
function updateEvent(vnode, key, value) {
	if (vnode.instance != null) {
		vnode.instance._ = currentRedraw
		if (vnode.instance[key] === value) return
		if (value != null && (typeof value === "function" || typeof value === "object")) {
			if (vnode.instance[key] == null) vnode.dom.addEventListener(key.slice(2), vnode.instance, false)
			vnode.instance[key] = value
		} else {
			if (vnode.instance[key] != null) vnode.dom.removeEventListener(key.slice(2), vnode.instance, false)
			vnode.instance[key] = undefined
		}
	} else if (value != null && (typeof value === "function" || typeof value === "object")) {
		vnode.instance = new EventDict()
		vnode.dom.addEventListener(key.slice(2), vnode.instance, false)
		vnode.instance[key] = value
	}
}

//lifecycle
function initLifecycle(source, vnode, hooks) {
	if (typeof source.oninit === "function") callHook.call(source.oninit, vnode)
	if (typeof source.oncreate === "function") hooks.push(callHook.bind(source.oncreate, vnode))
}
function updateLifecycle(source, vnode, hooks) {
	if (typeof source.onupdate === "function") hooks.push(callHook.bind(source.onupdate, vnode))
}
function shouldNotUpdate(vnode, old) {
	do {
		if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") {
			var force = callHook.call(vnode.attrs.onbeforeupdate, vnode, old)
			if (force !== undefined && !force) break
		}
		if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeupdate === "function") {
			var force = callHook.call(vnode.state.onbeforeupdate, vnode, old)
			if (force !== undefined && !force) break
		}
		return false
	} while (false); // eslint-disable-line no-constant-condition
	vnode.dom = old.dom
	vnode.instance = old.instance
	// One would think having the actual latest attributes would be ideal,
	// but it doesn't let us properly diff based on our current internal
	// representation. We have to save not only the old DOM info, but also
	// the attributes used to create it, as we diff *that*, not against the
	// DOM directly (with a few exceptions in `setAttr`). And, of course, we
	// need to save the children and text as they are conceptually not
	// unlike special "attributes" internally.
	vnode.attrs = old.attrs
	vnode.children = old.children
	return true
}

var currentDOM

module.exports = function(dom, vnodes, redraw) {
	if (!dom) throw new TypeError("DOM element being rendered to does not exist.")
	if (currentDOM != null && dom.contains(currentDOM)) {
		throw new TypeError("Node is currently being rendered to and thus is locked.")
	}
	var prevRedraw = currentRedraw
	var prevDOM = currentDOM
	var hooks = []
	var active = activeElement(dom)
	var namespace = dom.namespaceURI
	var prevPath = vnodePath

	currentDOM = dom
	currentRedraw = typeof redraw === "function" ? redraw : undefined
	vnodePath = []
	try {
		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes])
		updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace, 0)
		dom.vnodes = vnodes
		// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
		if (active != null && activeElement(dom) !== active && typeof active.focus === "function") active.focus()
		for (var i = 0; i < hooks.length; i++) hooks[i]()
	} finally {
		currentRedraw = prevRedraw
		currentDOM = prevDOM
		vnodePath = prevPath
	}
}
