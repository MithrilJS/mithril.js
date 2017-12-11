"use strict"

var Vnode = require("../render/vnode")

module.exports = function($window) {
	var $doc = $window.document
	var $emptyFragment = $doc.createDocumentFragment()

	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	}

	var onevent
	function setEventCallback(callback) {return onevent = callback}

	function getNameSpace(vnode) {
		return vnode.attrs && vnode.attrs.xmlns || nameSpace[vnode.tag]
	}

	//sanity check to discourage people from doing `vnode.state = ...`
	function checkState(vnode, original) {
		if (vnode.state !== original) throw new Error("`vnode.state` must not be modified")
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
			vnode.state = {}
			if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
			switch (tag) {
				case "#": return createText(parent, vnode, nextSibling)
				case "<": return createHTML(parent, vnode, nextSibling)
				case "[": return createFragment(parent, vnode, hooks, ns, nextSibling)
				default: return createElement(parent, vnode, hooks, ns, nextSibling)
			}
		}
		else return createComponent(parent, vnode, hooks, ns, nextSibling)
	}
	function createText(parent, vnode, nextSibling) {
		vnode.dom = $doc.createTextNode(vnode.children)
		insertNode(parent, vnode.dom, nextSibling)
		return vnode.dom
	}
	function createHTML(parent, vnode, nextSibling) {
		var match = vnode.children.match(/^\s*?<(\w+)/im) || []
		var parent1 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match[1]] || "div"
		var temp = $doc.createElement(parent1)

		temp.innerHTML = vnode.children
		vnode.dom = temp.firstChild
		vnode.domSize = temp.childNodes.length
		var fragment = $doc.createDocumentFragment()
		var child
		while (child = temp.firstChild) {
			fragment.appendChild(child)
		}
		insertNode(parent, fragment, nextSibling)
		return fragment
	}
	function createFragment(parent, vnode, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment()
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(fragment, children, 0, children.length, hooks, null, ns)
		}
		vnode.dom = fragment.firstChild
		vnode.domSize = fragment.childNodes.length
		insertNode(parent, fragment, nextSibling)
		return fragment
	}
	function createElement(parent, vnode, hooks, ns, nextSibling) {
		var tag = vnode.tag
		var attrs = vnode.attrs
		var is = attrs && attrs.is

		ns = getNameSpace(vnode) || ns

		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag)
		vnode.dom = element

		if (attrs != null) {
			setAttrs(vnode, attrs, ns)
		}

		insertNode(parent, element, nextSibling)

		if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
			setContentEditable(vnode)
		}
		else {
			if (vnode.text != null) {
				if (vnode.text !== "") element.textContent = vnode.text
				else vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
			}
			if (vnode.children != null) {
				var children = vnode.children
				createNodes(element, children, 0, children.length, hooks, null, ns)
				setLateAttrs(vnode)
			}
		}
		return element
	}
	function initComponent(vnode, hooks) {
		var sentinel
		if (typeof vnode.tag.view === "function") {
			vnode.state = Object.create(vnode.tag)
			sentinel = vnode.state.view
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true
		} else {
			vnode.state = void 0
			sentinel = vnode.tag
			if (sentinel.$$reentrantLock$$ != null) return $emptyFragment
			sentinel.$$reentrantLock$$ = true
			vnode.state = (vnode.tag.prototype != null && typeof vnode.tag.prototype.view === "function") ? new vnode.tag(vnode) : vnode.tag(vnode)
		}
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
		initLifecycle(vnode.state, vnode, hooks)
		vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
		if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
		sentinel.$$reentrantLock$$ = null
	}
	function createComponent(parent, vnode, hooks, ns, nextSibling) {
		initComponent(vnode, hooks)
		if (vnode.instance != null) {
			var element = createNode(parent, vnode.instance, hooks, ns, nextSibling)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0
			insertNode(parent, element, nextSibling)
			return element
		}
		else {
			vnode.domSize = 0
			return $emptyFragment
		}
	}

	//update
	/**
	 * @param {Element|Fragment} parent - the parent element
	 * @param {Vnode[] | null} old - the list of vnodes of the last `render()` call for
	 *                               this part of the tree
	 * @param {Vnode[] | null} vnodes - as above, but for the current `render()` call.
	 * @param {boolean} recyclingParent - was the parent vnode or one of its ancestor
	 *                                    fetched from the recycling pool?
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
	// 3. describe how the recycling pool meshes into this
	// 4. discuss DOM node operations.

	// ## Overview:
	//
	// The updateNodes() function:
	// - deals with trivial cases
	// - determines whether the lists are keyed or unkeyed
	//   (Currently we look for the first pair of non-null nodes and deem the lists unkeyed
	//   if both nodes are unkeyed. TODO (v2) We may later take advantage of the fact that
	//   mixed diff is not supported and settle on the keyedness of the first vnode we find)
	// - diffs them and patches the DOM if needed (that's the brunt of the code)
	// - manages the leftovers: after diffing, are there:
	//   - old nodes left to remove?
	// 	 - new nodes to insert?
	//   - nodes left in the recycling pool?
	// 	 deal with them!
	//
	// The lists are only iterated over once, with an exception for the nodes in `old` that
	// are visited in the fourth part of the diff and in the `removeNodes` loop.

	// ## Diffing
	//
	// There's first a simple diff for unkeyed lists of equal length that eschews the pool.
	//
	// It is followed by a small section that activates the recycling pool if present, we'll
	// ignore it for now.
	//
	// Then comes the main diff algorithm that is split in four parts (simplifying a bit).
	//
	// The first part goes through both lists top-down as long as the nodes at each level have
	// the same key. This is always true for unkeyed lists that are entirely processed by this
	// step.
	//
	// The second part deals with lists reversals, and traverses one list top-down and the other
	// bottom-up (as long as the keys match).
	//
	// The third part goes through both lists bottom up as long as the keys match.
	//
	// The first and third sections allow us to deal efficiently with situations where one or
	// more contiguous nodes were either inserted into, removed from or re-ordered in an otherwise
	// sorted list. They may reduce the number of nodes to be processed in the fourth section.
	//
	// The fourth section does keyed diff for the situations not covered by the other three. It
	// builds a {key: oldIndex} dictionary and uses it to find old nodes that match the keys of
	// new ones.
	// The nodes from the `old` array that have a match in the new `vnodes` one are marked as
	// `vnode.skip: true`.
	//
	// If there are still nodes in the new `vnodes` array that haven't been matched to old ones,
	// they are created.
	// The range of old nodes that wasn't covered by the first three sections is passed to
	// `removeNodes()`. Those nodes are removed unless marked as `.skip: true`.
	//
	// Then some pool business happens.
	//
	// It should be noted that the description of the four sections above is not perfect, because those
	// parts are actually implemented as only two loops, one for the first two parts, and one for
	// the other two. I'm not sure it wins us anything except maybe a few bytes of file size.

	// ## The pool
	//
	// `old.pool` is an optional array that holds the vnodes that have been previously removed
	// from the DOM at this level (provided they met the pool eligibility criteria).
	//
	// If the `old`, `old.pool` and `vnodes` meet some criteria described in `isRecyclable`, the
	// elements of the pool are appended to the `old` array, which enables the reconciler to find
	// them.
	//
	// While this is optimal for unkeyed diff and map-based keyed diff (the fourth diff part),
	// that strategy clashes with the second and third parts of the main diff algo, because
	// the end of the old list is now filled with the nodes of the pool.
	//
	// To determine if a vnode was brought back from the pool, we look at its position in the
	// `old` array (see the various `oFromPool` definitions). That information is important
	// in three circumstances:
	// - If the old and the new vnodes are the same object (`===`), diff is not performed unless
	//   the old node comes from the pool (since it must be recycled/re-created).
	// - The value of `oFromPool` is passed as the `recycling` parameter of `updateNode()` (whether
	//   the parent is being recycled is also factred in here)
	// - It is used in the DOM node insertion logic (see below)
	//
	// At the very end of `updateNodes()`, the nodes in the pool that haven't been picked back
	// are put in the new pool for the next render phase.
	//
	// The pool eligibility and `isRecyclable()` criteria are to be updated as part of #1675.

	// ## DOM node operations
	//
	// In most cases `updateNode()` and `createNode()` perform the DOM operations. However,
	// this is not the case if the node moved (second and fourth part of the diff algo), or
	// if the node was brough back from the pool and both the old and new nodes have the same
	// `.tag` value (when the `.tag` differ, `updateNode()` does the insertion).
	//
	// The fourth part of the diff currently inserts nodes unconditionally, leading to issues
	// like #1791 and #1999. We need to be smarter about those situations where adjascent old
	// nodes remain together in the new list in a way that isn't covered by parts one and
	// three of the diff algo.

	function updateNodes(parent, old, vnodes, recyclingParent, hooks, nextSibling, ns) {
		if (old === vnodes && !recyclingParent || old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
		else if (vnodes == null) removeNodes(old, 0, old.length, vnodes, recyclingParent)
		else {
			var start = 0, commonLength = Math.min(old.length, vnodes.length), originalOldLength = old.length, hasPool = false, isUnkeyed = false
			for(; start < commonLength; start++) {
				if (old[start] != null && vnodes[start] != null) {
					if (old[start].key == null && vnodes[start].key == null) isUnkeyed = true
					break
				}
			}
			if (isUnkeyed && originalOldLength === vnodes.length) {
				for (start = 0; start < originalOldLength; start++) {
					if (old[start] === vnodes[start] && !recyclingParent || old[start] == null && vnodes[start] == null) continue
					else if (old[start] == null) createNode(parent, vnodes[start], hooks, ns, getNextSibling(old, start + 1, originalOldLength, nextSibling))
					else if (vnodes[start] == null) removeNodes(old, start, start + 1, vnodes, recyclingParent)
					else updateNode(parent, old[start], vnodes[start], hooks, getNextSibling(old, start + 1, originalOldLength, nextSibling), recyclingParent, ns)
				}
				return
			}

			if (isRecyclable(old, vnodes)) {
				hasPool = true
				old = old.concat(old.pool)
			}

			var oldStart = start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oFromPool

			while (oldEnd >= oldStart && end >= start) {
				o = old[oldStart]
				v = vnodes[start]
				oFromPool = hasPool && oldStart >= originalOldLength
				if (o === v && !oFromPool && !recyclingParent || o == null && v == null) oldStart++, start++
				else if (o == null) {
					if (isUnkeyed || v.key == null) {
						createNode(parent, vnodes[start], hooks, ns, getNextSibling(old, ++start, originalOldLength, nextSibling))
					}
					oldStart++
				} else if (v == null) {
					if (isUnkeyed || o.key == null) {
						removeNodes(old, start, start + 1, vnodes, recyclingParent)
						oldStart++
					}
					start++
				} else if (o.key === v.key) {
					oldStart++, start++
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, originalOldLength, nextSibling), oFromPool || recyclingParent, ns)
					if (oFromPool && o.tag === v.tag) insertNode(parent, toFragment(v), nextSibling)
				} else {
					o = old[oldEnd]
					oFromPool = hasPool && oldEnd >= originalOldLength
					if (o === v && !oFromPool && !recyclingParent) oldEnd--, start++
					else if (o == null) oldEnd--
					else if (v == null) start++
					else if (o.key === v.key) {
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, originalOldLength, nextSibling), oFromPool || recyclingParent, ns)
						if (oFromPool && o.tag === v.tag || start < end) insertNode(parent, toFragment(v), getNextSibling(old, oldStart, originalOldLength, nextSibling))
						oldEnd--, start++
					}
					else break
				}
			}
			while (oldEnd >= oldStart && end >= start) {
				o = old[oldEnd]
				v = vnodes[end]
				oFromPool = hasPool && oldEnd >= originalOldLength
				if (o === v && !oFromPool && !recyclingParent) oldEnd--, end--
				else if (o == null) oldEnd--
				else if (v == null) end--
				else if (o.key === v.key) {
					updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, originalOldLength, nextSibling), oFromPool || recyclingParent, ns)
					if (oFromPool && o.tag === v.tag) insertNode(parent, toFragment(v), nextSibling)
					if (o.dom != null) nextSibling = o.dom
					oldEnd--, end--
				} else {
					if (!map) map = getKeyMap(old, oldEnd)
					if (v != null) {
						var oldIndex = map[v.key]
						if (oldIndex != null) {
							o = old[oldIndex]
							oFromPool = hasPool && oldIndex >= originalOldLength
							updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, originalOldLength, nextSibling), oFromPool || recyclingParent, ns)
							insertNode(parent, toFragment(v), nextSibling)
							o.skip = true
							if (o.dom != null) nextSibling = o.dom
						} else {
							var dom = createNode(parent, v, hooks, ns, nextSibling)
							nextSibling = dom
						}
					}
					end--
				}
				if (end < start) break
			}
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
			removeNodes(old, oldStart, Math.min(oldEnd + 1, originalOldLength), vnodes, recyclingParent)
			if (hasPool) {
				var limit = Math.max(oldStart, originalOldLength)
				for (; oldEnd >= limit; oldEnd--) {
					if (old[oldEnd].skip) old[oldEnd].skip = false
					else addToPool(old[oldEnd], vnodes)
				}
			}
		}
	}
	// when recycling, we're re-using an old DOM node, but firing the oninit/oncreate hooks
	// instead of onbeforeupdate/onupdate.
	function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode.tag
		if (oldTag === tag) {
			vnode.state = old.state
			vnode.events = old.events
			if (!recycling && shouldNotUpdate(vnode, old)) return
			if (typeof oldTag === "string") {
				if (vnode.attrs != null) {
					if (recycling) {
						vnode.state = {}
						initLifecycle(vnode.attrs, vnode, hooks)
					}
					else updateLifecycle(vnode.attrs, vnode, hooks)
				}
				switch (oldTag) {
					case "#": updateText(old, vnode); break
					case "<": updateHTML(parent, old, vnode, nextSibling); break
					case "[": updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns); break
					default: updateElement(old, vnode, recycling, hooks, ns)
				}
			}
			else updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns)
		}
		else {
			removeNode(old, null, recycling)
			createNode(parent, vnode, hooks, ns, nextSibling)
		}
	}
	function updateText(old, vnode) {
		if (old.children.toString() !== vnode.children.toString()) {
			old.dom.nodeValue = vnode.children
		}
		vnode.dom = old.dom
	}
	function updateHTML(parent, old, vnode, nextSibling) {
		if (old.children !== vnode.children) {
			toFragment(old)
			createHTML(parent, vnode, nextSibling)
		}
		else vnode.dom = old.dom, vnode.domSize = old.domSize
	}
	function updateFragment(parent, old, vnode, recycling, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode.children, recycling, hooks, nextSibling, ns)
		var domSize = 0, children = vnode.children
		vnode.dom = null
		if (children != null) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i]
				if (child != null && child.dom != null) {
					if (vnode.dom == null) vnode.dom = child.dom
					domSize += child.domSize || 1
				}
			}
			if (domSize !== 1) vnode.domSize = domSize
		}
	}
	function updateElement(old, vnode, recycling, hooks, ns) {
		var element = vnode.dom = old.dom
		ns = getNameSpace(vnode) || ns

		if (vnode.tag === "textarea") {
			if (vnode.attrs == null) vnode.attrs = {}
			if (vnode.text != null) {
				vnode.attrs.value = vnode.text //FIXME handle multiple children
				vnode.text = undefined
			}
		}
		updateAttrs(vnode, old.attrs, vnode.attrs, ns)
		if (vnode.attrs != null && vnode.attrs.contenteditable != null) {
			setContentEditable(vnode)
		}
		else if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [Vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
			if (vnode.text != null) vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
			updateNodes(element, old.children, vnode.children, recycling, hooks, null, ns)
		}
	}
	function updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		if (recycling) {
			initComponent(vnode, hooks)
		} else {
			vnode.instance = Vnode.normalize(callHook.call(vnode.state.view, vnode))
			if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as argument")
			if (vnode.attrs != null) updateLifecycle(vnode.attrs, vnode, hooks)
			updateLifecycle(vnode.state, vnode, hooks)
		}
		if (vnode.instance != null) {
			if (old.instance == null) createNode(parent, vnode.instance, hooks, ns, nextSibling)
			else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
		}
		else if (old.instance != null) {
			removeNode(old.instance, null, recycling)
			vnode.dom = undefined
			vnode.domSize = 0
		}
		else {
			vnode.dom = old.dom
			vnode.domSize = old.domSize
		}
	}
	function isRecyclable(old, vnodes) {
		if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
			var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0
			var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0
			var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0
			if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
				return true
			}
		}
		return false
	}
	function getKeyMap(vnodes, end) {
		var map = {}, i = 0
		for (var i = 0; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				var key = vnode.key
				if (key != null) map[key] = i
			}
		}
		return map
	}
	function toFragment(vnode) {
		var count = vnode.domSize
		if (count != null || vnode.dom == null) {
			var fragment = $doc.createDocumentFragment()
			if (count > 0) {
				var dom = vnode.dom
				while (--count) fragment.appendChild(dom.nextSibling)
				fragment.insertBefore(dom, fragment.firstChild)
			}
			return fragment
		}
		else return vnode.dom
	}
	// the vnodes array may hold items that come from the pool (after `limit`) they should
	// be ignored
	function getNextSibling(vnodes, i, limit, nextSibling) {
		for (; i < limit; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}

	function insertNode(parent, dom, nextSibling) {
		if (nextSibling) parent.insertBefore(dom, nextSibling)
		else parent.appendChild(dom)
	}

	function setContentEditable(vnode) {
		var children = vnode.children
		if (children != null && children.length === 1 && children[0].tag === "<") {
			var content = children[0].children
			if (vnode.dom.innerHTML !== content) vnode.dom.innerHTML = content
		}
		else if (vnode.text != null || children != null && children.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
	}

	//remove
	function removeNodes(vnodes, start, end, context, recycling) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				if (vnode.skip) vnode.skip = false
				else removeNode(vnode, context, recycling)
			}
		}
	}
	// when a node is removed from a parent that's brought back from the pool, its hooks should
	// not fire.
	function removeNode(vnode, context, recycling) {
		var expected = 1, called = 0
		if (!recycling) {
			var original = vnode.state
			if (vnode.attrs && typeof vnode.attrs.onbeforeremove === "function") {
				var result = callHook.call(vnode.attrs.onbeforeremove, vnode)
				if (result != null && typeof result.then === "function") {
					expected++
					result.then(continuation, continuation)
				}
			}
			if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeremove === "function") {
				var result = callHook.call(vnode.state.onbeforeremove, vnode)
				if (result != null && typeof result.then === "function") {
					expected++
					result.then(continuation, continuation)
				}
			}
		}
		continuation()
		function continuation() {
			if (++called === expected) {
				if (!recycling) {
					checkState(vnode, original)
					onremove(vnode)
				}
				if (vnode.dom) {
					var count = vnode.domSize || 1
					if (count > 1) {
						var dom = vnode.dom
						while (--count) {
							removeNodeFromDOM(dom.nextSibling)
						}
					}
					removeNodeFromDOM(vnode.dom)
					addToPool(vnode, context)
				}
			}
		}
	}
	function removeNodeFromDOM(node) {
		var parent = node.parentNode
		if (parent != null) parent.removeChild(node)
	}
	function addToPool(vnode, context) {
		if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
			if (!context.pool) context.pool = [vnode]
			else context.pool.push(vnode)
		}
	}
	function onremove(vnode) {
		if (vnode.attrs && typeof vnode.attrs.onremove === "function") callHook.call(vnode.attrs.onremove, vnode)
		if (typeof vnode.tag !== "string") {
			if (typeof vnode.state.onremove === "function") callHook.call(vnode.state.onremove, vnode)
			if (vnode.instance != null) onremove(vnode.instance)
		} else {
			var children = vnode.children
			if (Array.isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i]
					if (child != null) onremove(child)
				}
			}
		}
	}

	//attrs
	function setAttrs(vnode, attrs, ns) {
		for (var key in attrs) {
			setAttr(vnode, key, null, attrs[key], ns)
		}
	}
	function setAttr(vnode, key, old, value, ns) {
		if (key === "key" || key === "is" || isLifecycleMethod(key)) return
		if (key[0] === "o" && key[1] === "n") return updateEvent(vnode, key, value)
		if ((old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || value === undefined) return
		var element = vnode.dom
		if (key.slice(0, 6) === "xlink:") element.setAttributeNS("http://www.w3.org/1999/xlink", key, value)
		else if (key === "style") updateStyle(element, old, value)
		else if (key in element && !isAttribute(key) && ns === undefined && !isCustomElement(vnode)) {
			if (key === "value") {
				var normalized = "" + value // eslint-disable-line no-implicit-coercion
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				if ((vnode.tag === "input" || vnode.tag === "textarea") && vnode.dom.value === normalized && vnode.dom === $doc.activeElement) return
				//setting select[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode.tag === "select") {
					if (value === null) {
						if (vnode.dom.selectedIndex === -1 && vnode.dom === $doc.activeElement) return
					} else {
						if (old !== null && vnode.dom.value === normalized && vnode.dom === $doc.activeElement) return
					}
				}
				//setting option[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode.tag === "option" && old != null && vnode.dom.value === normalized) return
			}
			// If you assign an input type that is not supported by IE 11 with an assignment expression, an error will occur.
			if (vnode.tag === "input" && key === "type") {
				element.setAttribute(key, value)
				return
			}
			element[key] = value
		}
		else {
			if (typeof value === "boolean") {
				if (value) element.setAttribute(key, "")
				else element.removeAttribute(key)
			}
			else element.setAttribute(key === "className" ? "class" : key, value)
		}
	}
	function setLateAttrs(vnode) {
		var attrs = vnode.attrs
		if (vnode.tag === "select" && attrs != null) {
			if ("value" in attrs) setAttr(vnode, "value", null, attrs.value, undefined)
			if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined)
		}
	}
	function updateAttrs(vnode, old, attrs, ns) {
		if (attrs != null) {
			for (var key in attrs) {
				setAttr(vnode, key, old && old[key], attrs[key], ns)
			}
		}
		if (old != null) {
			for (var key in old) {
				if (attrs == null || !(key in attrs)) {
					if (key === "className") key = "class"
					if (key[0] === "o" && key[1] === "n" && !isLifecycleMethod(key)) updateEvent(vnode, key, undefined)
					else if (key !== "key") vnode.dom.removeAttribute(key)
				}
			}
		}
	}
	function isFormAttribute(vnode, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === $doc.activeElement || vnode.tag === "option" && vnode.dom.parentNode === $doc.activeElement
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
	}
	function isCustomElement(vnode){
		return vnode.attrs.is || vnode.tag.indexOf("-") > -1
	}
	function hasIntegrationMethods(source) {
		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
	}

	//style
	function updateStyle(element, old, style) {
		if (old != null && style != null && typeof old === "object" && typeof style === "object" && style !== old) {
			// Both old & new are (different) objects.
			// Update style properties that have changed
			for (var key in style) {
				if (style[key] !== old[key]) element.style[key] = style[key]
			}
			// Remove style properties that no longer exist
			for (var key in old) {
				if (!(key in style)) element.style[key] = ""
			}
			return
		}
		if (old === style) element.style.cssText = "", old = null
		if (style == null) element.style.cssText = ""
		else if (typeof style === "string") element.style.cssText = style
		else {
			if (typeof old === "string") element.style.cssText = ""
			for (var key in style) {
				element.style[key] = style[key]
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
	function EventDict() {}
	EventDict.prototype = Object.create(null)
	EventDict.prototype.handleEvent = function (ev) {
		var handler = this["on" + ev.type]
		if (typeof handler === "function") handler.call(ev.target, ev)
		else if (typeof handler.handleEvent === "function") handler.handleEvent(ev)
		if (typeof onevent === "function") onevent.call(ev.target, ev)
	}

	//event
	function updateEvent(vnode, key, value) {
		if (vnode.events != null) {
			if (vnode.events[key] === value) return
			if (value != null && (typeof value === "function" || typeof value === "object")) {
				if (vnode.events[key] == null) vnode.dom.addEventListener(key.slice(2), vnode.events, false)
				vnode.events[key] = value
			} else {
				if (vnode.events[key] != null) vnode.dom.removeEventListener(key.slice(2), vnode.events, false)
				vnode.events[key] = undefined
			}
		} else if (value != null && (typeof value === "function" || typeof value === "object")) {
			vnode.events = new EventDict()
			vnode.dom.addEventListener(key.slice(2), vnode.events, false)
			vnode.events[key] = value
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
		var forceVnodeUpdate, forceComponentUpdate
		if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") {
			forceVnodeUpdate = callHook.call(vnode.attrs.onbeforeupdate, vnode, old)
		}
		if (typeof vnode.tag !== "string" && typeof vnode.state.onbeforeupdate === "function") {
			forceComponentUpdate = callHook.call(vnode.state.onbeforeupdate, vnode, old)
		}
		if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
			vnode.dom = old.dom
			vnode.domSize = old.domSize
			vnode.instance = old.instance
			return true
		}
		return false
	}

	function render(dom, vnodes) {
		if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
		var hooks = []
		var active = $doc.activeElement
		var namespace = dom.namespaceURI

		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""

		if (!Array.isArray(vnodes)) vnodes = [vnodes]
		updateNodes(dom, dom.vnodes, Vnode.normalizeChildren(vnodes), false, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace)
		dom.vnodes = vnodes
		// document.activeElement can return null in IE https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement
		if (active != null && $doc.activeElement !== active) active.focus()
		for (var i = 0; i < hooks.length; i++) hooks[i]()
	}

	return {render: render, setEventCallback: setEventCallback}
}
