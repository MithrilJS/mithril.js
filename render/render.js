"use strict"

var hyperscript = require("./hyperscript")

var xlinkNs = "http://www.w3.org/1999/xlink"
var nameSpace = {
	svg: "http://www.w3.org/2000/svg",
	math: "http://www.w3.org/1998/Math/MathML"
}

var currentRedraw

function getDocument(dom) {
	return dom.ownerDocument;
}

function getNameSpace(vnode) {
	return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
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
function createNodes(rawParent, parent, vnodes, start, end, hooks, nextSibling, ns) {
	for (var i = start; i < end; i++) {
		var vnode = vnodes[i]
		if (vnode != null) {
			createNode(rawParent, parent, vnode, hooks, ns, nextSibling)
		}
	}
}
function createNode(rawParent, parent, vnode, hooks, ns, nextSibling) {
	var tag = vnode.tag
	if (typeof tag === "string") {
		switch (tag) {
			case "!": throw new Error("No node present to retain with `m.retain()`")
			case ">": createLayout(rawParent, vnode, hooks); break
			case "#": createText(parent, vnode, nextSibling); break
			case "=":
			case "[": createFragment(rawParent, parent, vnode, hooks, ns, nextSibling); break
			default: createElement(parent, vnode, hooks, ns, nextSibling)
		}
	}
	else createComponent(rawParent, parent, vnode, hooks, ns, nextSibling)
}
function createLayout(rawParent, vnode, hooks) {
	hooks.push(vnode.state.bind(null, rawParent, (vnode.dom = new AbortController()).signal, true))
}
function createText(parent, vnode, nextSibling) {
	vnode.dom = getDocument(parent).createTextNode(vnode.children)
	insertDOM(parent, vnode.dom, nextSibling)
}
function createFragment(rawParent, parent, vnode, hooks, ns, nextSibling) {
	var fragment = getDocument(parent).createDocumentFragment()
	if (vnode.children != null) {
		var children = vnode.children
		createNodes(rawParent, fragment, children, 0, children.length, hooks, null, ns)
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
			createNodes(element, element, children, 0, children.length, hooks, null, ns)
			if (vnode.tag === "select" && attrs != null) setLateSelectAttrs(vnode, attrs)
		}
	}
}
function createComponent(rawParent, parent, vnode, hooks, ns, nextSibling) {
	var tree = (vnode.state = vnode.tag)(vnode.attrs)
	if (typeof tree === "function") tree = (vnode.state = tree)(vnode.attrs)
	if (tree === vnode) throw Error("A view cannot return the vnode it received as argument")
	vnode.instance = hyperscript.normalize(tree)
	if (vnode.instance != null) {
		createNode(rawParent, parent, vnode.instance, hooks, ns, nextSibling)
	}
}

//update
/**
 * @param {Element|Fragment} parent - the parent element
 * @param {Vnode[] | null} old - the list of vnodes of the last `render()` call for
 *                               this part of the tree
 * @param {Vnode[] | null} vnodes - as above, but for the current `render()` call.
 * @param {Function[]} hooks - an accumulator of post-render layout hooks
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

function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
	if (old === vnodes || old == null && vnodes == null) return
	else if (old == null || old.length === 0) createNodes(parent, parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
	else if (vnodes == null || vnodes.length === 0) removeNodes(parent, old, 0, old.length)
	else {
		var isOldKeyed = old[0] != null && old[0].tag === "="
		var isKeyed = vnodes[0] != null && vnodes[0].tag === "="
		var start = 0, oldStart = 0
		if (!isOldKeyed) while (oldStart < old.length && old[oldStart] == null) oldStart++
		if (!isKeyed) while (start < vnodes.length && vnodes[start] == null) start++
		if (isOldKeyed !== isKeyed) {
			removeNodes(parent, old, oldStart, old.length)
			createNodes(parent, parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
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
				else if (o == null) createNode(parent, parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling))
				else if (v == null) removeNode(parent, o)
				else updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns)
			}
			if (old.length > commonLength) removeNodes(parent, old, start, old.length)
			if (vnodes.length > commonLength) createNodes(parent, parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
		} else {
			// keyed diff
			var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling

			// bottom-up
			while (oldEnd >= oldStart && end >= start) {
				oe = old[oldEnd]
				ve = vnodes[end]
				if (oe.state !== ve.state) break
				if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
				if (ve.dom != null) nextSibling = ve.dom
				oldEnd--, end--
			}
			// top-down
			while (oldEnd >= oldStart && end >= start) {
				o = old[oldStart]
				v = vnodes[start]
				if (o.state !== v.state) break
				oldStart++, start++
				if (o !== v) updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns)
			}
			// swaps and list reversals
			while (oldEnd >= oldStart && end >= start) {
				if (start === end) break
				if (o.state !== ve.state || oe.state !== v.state) break
				topSibling = getNextSibling(old, oldStart, nextSibling)
				moveDOM(parent, oe, topSibling)
				if (oe !== v) updateNode(parent, oe, v, hooks, topSibling, ns)
				if (++start <= --end) moveDOM(parent, o, nextSibling)
				if (o !== ve) updateNode(parent, o, ve, hooks, nextSibling, ns)
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
				if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
				if (ve.dom != null) nextSibling = ve.dom
				oldEnd--, end--
				oe = old[oldEnd]
				ve = vnodes[end]
			}
			if (start > end) removeNodes(parent, old, oldStart, oldEnd + 1)
			else if (oldStart > oldEnd) createNodes(parent, parent, vnodes, start, end + 1, hooks, nextSibling, ns)
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
						if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
						if (ve.dom != null) nextSibling = ve.dom
						matched++
					}
				}
				nextSibling = originalNextSibling
				if (matched !== oldEnd - oldStart + 1) removeNodes(parent, old, oldStart, oldEnd + 1)
				if (matched === 0) createNodes(parent, parent, vnodes, start, end + 1, hooks, nextSibling, ns)
				else {
					if (pos === -1) {
						// the indices of the indices of the items that are part of the
						// longest increasing subsequence in the oldIndices list
						lisIndices = makeLisIndices(oldIndices)
						li = lisIndices.length - 1
						for (i = end; i >= start; i--) {
							v = vnodes[i]
							if (oldIndices[i-start] === -1) createNode(parent, parent, v, hooks, ns, nextSibling)
							else {
								if (lisIndices[li] === i - start) li--
								else moveDOM(parent, v, nextSibling)
							}
							if (v.dom != null) nextSibling = vnodes[i].dom
						}
					} else {
						for (i = end; i >= start; i--) {
							v = vnodes[i]
							if (oldIndices[i-start] === -1) createNode(parent, parent, v, hooks, ns, nextSibling)
							if (v.dom != null) nextSibling = vnodes[i].dom
						}
					}
				}
			}
		}
	}
}
function updateNode(parent, old, vnode, hooks, nextSibling, ns) {
	var oldTag = old.tag, tag = vnode.tag
	if (tag === "!") {
		// If it's a retain node, transmute it into the node it's retaining. Makes it much easier
		// to implement and work with.
		//
		// Note: this key list *must* be complete.
		vnode.tag = oldTag
		vnode.state = old.state
		vnode.attrs = old.attrs
		vnode.children = old.children
		vnode.dom = old.dom
		vnode.instance = old.instance
	} else if (oldTag === tag && (tag !== "=" || vnode.state === old.state)) {
		if (typeof oldTag === "string") {
			switch (oldTag) {
				case ">": updateLayout(parent, old, vnode, hooks); break
				case "#": updateText(old, vnode); break
				case "=":
				case "[": updateFragment(parent, old, vnode, hooks, nextSibling, ns); break
				default: updateElement(old, vnode, hooks, ns)
			}
		}
		else updateComponent(parent, old, vnode, hooks, nextSibling, ns)
	}
	else {
		removeNode(parent, old)
		createNode(parent, parent, vnode, hooks, ns, nextSibling)
	}
}
function updateLayout(parent, old, vnode, hooks) {
	hooks.push(vnode.state.bind(null, parent, (vnode.dom = old.dom).signal, false))
}
function updateText(old, vnode) {
	if (old.children.toString() !== vnode.children.toString()) {
		old.dom.nodeValue = vnode.children
	}
	vnode.dom = old.dom
}
function updateFragment(parent, old, vnode, hooks, nextSibling, ns) {
	updateNodes(parent, old.children, vnode.children, hooks, nextSibling, ns)
	vnode.dom = null
	if (vnode.children != null) {
		for (var child of vnode.children) {
			if (child != null && child.dom != null) {
				if (vnode.dom == null) vnode.dom = child.dom
			}
		}
	}
}
function updateElement(old, vnode, hooks, ns) {
	vnode.state = old.state
	var element = vnode.dom = old.dom
	ns = getNameSpace(vnode) || ns

	updateAttrs(vnode, old.attrs, vnode.attrs, ns)
	if (!maybeSetContentEditable(vnode)) {
		updateNodes(element, old.children, vnode.children, hooks, null, ns)
	}
}
function updateComponent(parent, old, vnode, hooks, nextSibling, ns) {
	vnode.instance = hyperscript.normalize((vnode.state = old.state)(vnode.attrs, old.attrs))
	if (vnode.instance != null) {
		if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
		if (old.instance == null) createNode(parent, parent, vnode.instance, hooks, ns, nextSibling)
		else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, ns)
	}
	else if (old.instance != null) {
		removeNode(parent, old.instance, false)
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

// This moves only the nodes tracked by Mithril
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
function removeNodes(parent, vnodes, start, end) {
	for (var i = start; i < end; i++) removeNode(parent, vnodes[i])
}
function removeNode(parent, vnode) {
	if (vnode != null) {
		if (typeof vnode.tag === "function") {
			if (vnode.instance != null) removeNode(parent, vnode.instance)
		} else if (vnode.tag === ">") {
			try {
				vnode.dom.abort()
			} catch (e) {
				console.error(e)
			}
		} else {
			var isNode = vnode.tag !== "[" && vnode.tag !== "="

			if (vnode.tag !== "#") {
				removeNodes(
					isNode ? vnode.dom : parent,
					vnode.children, 0, vnode.children.length
				)
			}

			if (isNode) parent.removeChild(vnode.dom)
		}
	}
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
	if (value == null || key === "is" || key === "children" || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || key === "type" && vnode.tag === "input") return
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
	if (old == null || key === "is" || key === "children") return
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
// Try to avoid a few browser bugs on normal elements.
// var propertyMayBeBugged = /^(?:href|list|form|width|height|type)$/
var propertyMayBeBugged = /^(?:href|list|form|width|height)$/
function isFormAttribute(vnode, attr) {
	return attr === "value" || attr === "checked" || attr === "selectedIndex" ||
		attr === "selected" && vnode.dom === activeElement(vnode.dom) ||
		vnode.tag === "option" && vnode.dom.parentNode === activeElement(vnode.dom)
}
function hasPropertyKey(vnode, key, ns) {
	// Filter out namespaced keys
	return ns === undefined && (
		// If it's a custom element, just keep it.
		vnode.tag.indexOf("-") > -1 || vnode.attrs != null && vnode.attrs.is ||
		!propertyMayBeBugged.test(key)
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
// 2. The EventListener interface accepts either a function or an object with a `handleEvent` method.
// 3. The object inherits from `Map`, to avoid hitting global setters.
// 4. The event name is remapped to the handler before calling it.
// 5. In function-based event handlers, `ev.currentTarget === this`. We replicate that below.
// 6. In function-based event handlers, `return false` prevents the default action and stops event
//    propagation. Instead of that, we hijack it to control implicit redrawing, and let users
//    return a promise that resolves to it.
class EventDict extends Map {
	constructor() {
		super()
		// Save this, so the current redraw is correctly tracked.
		this._ = currentRedraw
	}
	handleEvent(ev) {
		var handler = this.get(`on${ev.type}`)
		if (typeof handler === "function") {
			var result = handler.call(ev.currentTarget, ev)
			if (result !== false) {
				if (result && typeof result.then === "function") {
					Promise.resolve(result).then((value) => {
						if (value !== false) (0, this._)()
					})
				} else {
					(0, this._)()
				}
			}
		}
	}
}

//event
function updateEvent(vnode, key, value) {
	if (vnode.state != null) {
		vnode.state._ = currentRedraw
		var prev = vnode.state.get(key)
		if (prev === value) return
		if (value != null && (typeof value === "function" || typeof value === "object")) {
			if (prev == null) vnode.dom.addEventListener(key.slice(2), vnode.state, false)
			vnode.state.set(key, value)
		} else {
			if (prev != null) vnode.dom.removeEventListener(key.slice(2), vnode.state, false)
			vnode.state.delete(key)
		}
	} else if (value != null && (typeof value === "function" || typeof value === "object")) {
		vnode.state = new EventDict()
		vnode.dom.addEventListener(key.slice(2), vnode.state, false)
		vnode.state.set(key, value)
	}
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

	currentDOM = dom
	currentRedraw = typeof redraw === "function" ? redraw : undefined
	try {
		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		vnodes = hyperscript.normalizeChildren(Array.isArray(vnodes) ? vnodes.slice() : [vnodes])
		updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace, 0)
		dom.vnodes = vnodes
		// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
		if (active != null && activeElement(dom) !== active && typeof active.focus === "function") active.focus()
		for (var i = 0; i < hooks.length; i++) hooks[i]()
	} finally {
		currentRedraw = prevRedraw
		currentDOM = prevDOM
	}
}
