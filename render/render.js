"use strict"

var Node = require("../render/node")

function copy(data) {
	if (data instanceof Array) {
		var output = []
		for (var i = 0; i < data.length; i++) output[i] = copy(data[i])
		return output
	}
	else if (typeof data === "object") {
		var output = {}
		for (var i in data) output[i] = copy(data[i])
		return output
	}
	return data
}

//lifecycle
function initLifecycle(source, vnode, hooks) {
	if (typeof source.oninit === "function") source.oninit.call(vnode.state, vnode)
	if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode.state, vnode))
}

function updateLifecycle(source, vnode, hooks, recycling) {
	if (recycling) initLifecycle(source, vnode, hooks)
	else if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode.state, vnode))
}

function shouldUpdate(vnode, old) {
	var forceVnodeUpdate, forceComponentUpdate
	if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode.attrs.onbeforeupdate.call(vnode.state, vnode, old)
	if (typeof vnode.tag !== "string" && typeof vnode.tag.onbeforeupdate === "function") forceComponentUpdate = vnode.tag.onbeforeupdate.call(vnode.state, vnode, old)
	if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
		vnode.dom = old.dom
		vnode.domSize = old.domSize
		vnode.instance = old.instance
		return true
	}
	return false
}

//update utils
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

function insertNode(parent, dom, nextSibling) {
	if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling)
	else parent.appendChild(dom)
}

//attr tests

function getElementParent(type) {
	switch (type) {
	case "col":
		return "colgroup"

	case "caption":
	case "colgroup":
	case "thead":
	case "tbody":
	case "tfoot":
		return "table"

	case "th":
	case "td":
		return "tr"

	case "tr":
		return "tbody"

	default: return "div"
	}
}

function isFormAttribute(vnode, attr, $doc) {
	return attr === "value" ||
		attr === "checked" ||
		attr === "selectedIndex" ||
		attr === "selected" && vnode.dom === $doc.activeElement
}

function isLifecycleMethod(attr) {
	return attr === "oninit" ||
		attr === "oncreate" ||
		attr === "onupdate" ||
		attr === "onremove" ||
		attr === "onbeforeremove" ||
		attr === "onbeforeupdate"
}

function isAttribute(attr) {
	return attr === "href" ||
		attr === "list" ||
		attr === "form" // ||
		// attr === "type" ||
		// attr === "width" ||
		// attr === "height"
}

function hasIntegrationMethods(source) {
	return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
}

//style
function updateStyle(element, old, style) {
	if (old === style) element.style = "", old = null
	if (style == null) element.style = ""
	else if (typeof style === "string") element.style = style
	else {
		if (typeof old === "string") element.style = ""
		for (var key in style) {
			element.style[key] = style[key]
		}
		if (old != null && typeof old !== "string") {
			for (var key in old) {
				if (!(key in style)) element.style[key] = ""
			}
		}
	}
}

function nodeMeta(hooks, ns) {
	return {hooks: hooks, ns: ns}
}

function updateData(parent, old, vnodes, nextSibling, data) {
	return {parent: parent, old: old, vnodes: vnodes, nextSibling: nextSibling, data: data}
}

function patchState(update, recycling) {
	return {
		recycling: recycling,
		oldStart: 0,
		start: 0,
		oldEnd: update.old.length - 1,
		end: update.vnodes.length - 1,
	}
}

function getNextSibling(update, i) {
	for (; i < update.old.length; i++) {
		if (update.old[i] != null) return update.old[i].dom
	}
	return update.nextSibling
}

function hasPatchableNext(state) {
	return state.oldEnd >= state.oldStart && state.end >= state.start
}

function patchAttempt(update, left, right) {
	var o = update.old[left], v = update.vnodes[right]

	return {
		old: o,
		vnode: v,
		equal: o === v,
		sameKey: o != null && v != null && o.key === v.key,
	}
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

module.exports = function($window) {
	var $doc = $window.document
	var $emptyFragment = $doc.createDocumentFragment()

	//create
	function createNodes(parent, vnodes, data, nextSibling) {
		for (var i = 0; i < vnodes.length; i++) {
			if (vnodes[i] != null) {
				insertNode(parent, createNode(vnodes[i], data), nextSibling)
			}
		}
	}

	function createNode(vnode, data) {
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, data.hooks)
		if (typeof vnode.tag !== "string") return createComponent(vnode, data)
		switch (vnode.tag) {
			case "#": return createText(vnode)
			case "<": return createHTML(vnode)
			case "[": return createFragment(vnode, data)
			default: return createElement(vnode, data)
		}
	}

	function createText(vnode) {
		return vnode.dom = $doc.createTextNode(vnode.children)
	}

	function createHTML(vnode) {
		var match = vnode.children.match(/^\s*?<(\w+)/im)
		var parent = getElementParent(match != null ? match[1] : "")
		var temp = $doc.createElement(parent)

		temp.innerHTML = vnode.children
		vnode.dom = temp.firstChild
		vnode.domSize = temp.childNodes.length
		var fragment = $doc.createDocumentFragment()
		var child
		while (child = temp.firstChild) {
			fragment.appendChild(child)
		}
		return fragment
	}

	function createFragment(vnode, data) {
		var fragment = $doc.createDocumentFragment()
		if (vnode.children != null) {
			createNodes(fragment, vnode.children, data, null)
		}
		vnode.dom = fragment.firstChild
		vnode.domSize = fragment.childNodes.length
		return fragment
	}

	function createElement(vnode, data) {
		switch (vnode.tag) {
			case "svg": data.ns = "http://www.w3.org/2000/svg"; break
			case "math": data.ns = "http://www.w3.org/1998/Math/MathML"; break
		}

		var attrs = vnode.attrs
		var is = attrs && attrs.is

		var element = data.ns ?
			is ? $doc.createElementNS(data.ns, vnode.tag, is) : $doc.createElementNS(data.ns, vnode.tag) :
			is ? $doc.createElement(vnode.tag, is) : $doc.createElement(vnode.tag)
		vnode.dom = element

		if (attrs != null) {
			setAttrs(vnode, attrs, data.ns)
		}

		if (vnode.text != null) {
			if (vnode.text !== "") element.textContent = vnode.text
			else vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
		}

		if (vnode.children != null) {
			createNodes(element, vnode.children, data, null)
			setLateAttrs(vnode)
		}
		return element
	}

	function createComponent(vnode, data) {
		vnode.state = copy(vnode.tag)

		initLifecycle(vnode.tag, vnode, data.hooks)
		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
		if (vnode.instance != null) {
			var element = createNode(vnode.instance, data)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
			return element
		}
		else return $emptyFragment
	}

	//update
	function updateNodes(parent, old, vnodes, nextSibling, data) {
		if (old == null && vnodes == null) return

		var meta = nodeMeta(data.hooks, undefined)
		if (old == null) {
			createNodes(parent, vnodes, meta, nextSibling)
			return
		}

		var update = updateData(parent, old, vnodes, nextSibling, data)
		if (vnodes == null) removeNodes(update, 0, old.length)
		else patchNodes(update, nextSibling, meta)
	}

	function patchMaybeMove(update, recycling, attempt, index) {
		updateNode(update.parent, attempt.old, attempt.vnode, getNextSibling(update, index), recycling, update.data)
		if (recycling) insertNode(update.parent, toFragment(attempt.old), update.nextSibling)
	}

	function patchMove(update, state, old, recycling, attempt, nextSibling) {
		updateNode(update.parent, old, attempt.vnode, getNextSibling(update, state.oldEnd + 1), recycling, update.data)
		insertNode(update.parent, toFragment(old), nextSibling)
	}

	function patchIfInOrder(update, state, recycling) {
		var attempt = patchAttempt(update, state.oldStart, state.start)
		if (attempt.equal) state.oldStart++, state.start++
		else if (attempt.sameKey) {
			state.oldStart++, state.start++
			patchMaybeMove(update, recycling, attempt, state.oldStart)
		}
		else {
			attempt = patchAttempt(update, state.oldEnd, state.start)
			if (attempt.equal) state.oldEnd--, state.start++
			else if (attempt.sameKey) {
				patchMove(update, state, attempt.old, recycling, attempt, getNextSibling(update, state.oldStart))
				state.oldEnd--, state.start++
			}
			else return false
		}

		return true
	}

	function patchRemaining(update, state, recycling, meta) {
		var attempt = patchAttempt(update, state.oldEnd, state.end)
		if (attempt.equal) state.oldEnd--, state.end--
		else if (attempt.sameKey) {
			patchMaybeMove(update, recycling, attempt, state.oldEnd + 1)
			update.nextSibling = attempt.old.dom
			state.oldEnd--, state.end--
		}
		else {
			var map = getKeyMap(update.old, state.oldEnd)

			if (attempt.vnode != null) {
				var oldIndex = map[attempt.vnode.key]
				if (oldIndex != null) {
					var movable = update.old[oldIndex]
					patchMove(update, state, movable, recycling, attempt, update.nextSibling)
					update.old[oldIndex].skip = true
					update.nextSibling = movable.dom
				}
				else {
					var dom = createNode(attempt.vnode, meta)
					insertNode(update.parent, dom, update.nextSibling)
					update.nextSibling = dom
				}
			}
			state.end--
		}
	}

	function patchNodes(update, nextSibling, meta) {
		var recycling = isRecyclable(update.old, update.vnodes)
		if (recycling) {
			for (var i = 0; i < update.old.pool.length; i++) update.old.push(update.old.pool[i])
		}

		var state = patchState(update, recycling)

		while (hasPatchableNext(state) && patchIfInOrder(update, state, recycling)) {
			// patchIfInOrder() does everything
		}

		while (hasPatchableNext(state)) {
			patchRemaining(update, state, recycling, meta)
		}

		// Insert remaining nodes
		for (var i = state.start; i <= state.end; i++) {
			if (update.vnodes[i] != null) {
				insertNode(update.parent, createNode(update.vnodes[i], meta), update.nextSibling)
			}
		}

		removeNodes(update, state.oldStart, state.oldEnd + 1)
	}

	function updateNode(parent, old, vnode, nextSibling, recycling, data) {
		var oldTag = old.tag, tag = vnode.tag
		if (oldTag === tag) {
			vnode.state = old.state
			vnode.events = old.events
			if (shouldUpdate(vnode, old)) return
			if (vnode.attrs != null) {
				updateLifecycle(vnode.attrs, vnode, data.hooks, recycling)
			}
			if (typeof oldTag === "string") {
				switch (oldTag) {
					case "#": updateText(old, vnode); break
					case "<": updateHTML(parent, old, vnode, nextSibling); break
					case "[": updateFragment(parent, old, vnode, nextSibling, data); break
					default: updateElement(old, vnode, data)
				}
			}
			else updateComponent(parent, old, vnode, nextSibling, recycling, data)
		}
		else {
			removeNode(parent, old, null, false)
			insertNode(parent, createNode(vnode, nodeMeta(data.hooks, undefined)), nextSibling)
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
			insertNode(parent, createHTML(vnode), nextSibling)
		}
		else vnode.dom = old.dom
	}

	function updateFragment(parent, old, vnode, nextSibling, data) {
		updateNodes(parent, old.children, vnode.children, nextSibling, data)
		var domSize = 0, children = vnode.children
		vnode.dom = null
		if (children != null) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i]
				if (child != null) {
					if (vnode.dom == null) vnode.dom = child.dom
					domSize += child.domSize || 1
				}
			}
			if (domSize !== 1) vnode.domSize = domSize
		}
	}
	function updateElement(old, vnode, data) {
		var element = vnode.dom = old.dom
		switch (vnode.tag) {
			case "svg": data.ns = "http://www.w3.org/2000/svg"; break
			case "math": data.ns = "http://www.w3.org/1998/Math/MathML"; break
		}
		if (vnode.tag === "textarea") {
			if (vnode.attrs == null) vnode.attrs = {}
			if (vnode.text != null) vnode.attrs.value = vnode.text //FIXME handle multiple children
		}
		updateAttrs(vnode, old.attrs, vnode.attrs, data.ns)
		if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [Node("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
			if (vnode.text != null) vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
			updateNodes(element, old.children, vnode.children, null, data)
		}
	}

	function updateComponent(parent, old, vnode, nextSibling, recycling, data) {
		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
		updateLifecycle(vnode.tag, vnode, data.hooks, recycling)
		if (vnode.instance != null) {
			updateNode(parent, old.instance, vnode.instance, nextSibling, recycling, data)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
		}
	}

	function toFragment(vnode) {
		var count = vnode.domSize
		if (count != null) {
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

	//remove
	function removeNodes(update, start, end) {
		for (var i = start; i < end; i++) {
			var vnode = update.old[i]
			if (vnode != null) {
				if (vnode.skip) vnode.skip = undefined
				else removeNode(update.parent, vnode, update.vnodes, false)
			}
		}
	}

	function removeNode(parent, vnode, context, deferred) {
		if (deferred === false) {
			var expected = 0, called = 0
			var callback = function() {
				if (++called === expected) removeNode(parent, vnode, context, true)
			}
			if (vnode.attrs && vnode.attrs.onbeforeremove) {
				expected++
				vnode.attrs.onbeforeremove.call(vnode, vnode, callback)
			}
			if (typeof vnode.tag !== "string" && vnode.tag.onbeforeremove) {
				expected++
				vnode.tag.onbeforeremove.call(vnode, vnode, callback)
			}
			if (expected > 0) return
		}

		onremove(vnode)
		if (vnode.dom) {
			var count = vnode.domSize || 1
			if (count > 1) {
				var dom = vnode.dom
				while (--count) {
					parent.removeChild(dom.nextSibling)
				}
			}
			if (vnode.dom.parentNode != null) parent.removeChild(vnode.dom)
			if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && !(typeof vnode.tag !== "string" && hasIntegrationMethods(vnode.tag))) { //TODO test custom elements
				if (!context.pool) context.pool = [vnode]
				else context.pool.push(vnode)
			}
		}
	}

	function onremove(vnode) {
		if (vnode.attrs && vnode.attrs.onremove) vnode.attrs.onremove.call(vnode.state, vnode)
		if (typeof vnode.tag !== "string" && vnode.tag.onremove) vnode.tag.onremove.call(vnode.state, vnode)

		var children = vnode.children
		if (children instanceof Array) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i]
				if (child != null) onremove(child)
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
		var element = vnode.dom
		if (key === "key" || (old === value && !isFormAttribute(vnode, key, $doc)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key)) return
		var nsLastIndex = key.indexOf(":")
		if (nsLastIndex > -1 && key.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(nsLastIndex + 1), value)
		}
		else if (key[0] === "o" && key[1] === "n" && typeof value === "function") updateEvent(vnode, key, value)
		else if (key === "style") updateStyle(element, old, value)
		else if (key in element && !isAttribute(key) && ns === undefined) {
			//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
			if (vnode.tag === "input" && key === "value" && vnode.dom.value === value && vnode.dom === $doc.activeElement) return
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
					if (key !== "key") vnode.dom.removeAttribute(key)
				}
			}
		}
	}

	var onevent

	//event
	function updateEvent(vnode, key, value) {
		var element = vnode.dom
		var callback = function(e) {
			var result = value.call(element, e)
			if (typeof onevent === "function") onevent.call(element, e)
			return result
		}
		if (key in element) element[key] = callback
		else {
			var eventName = key.slice(2)
			if (vnode.events === undefined) vnode.events = {}
			if (vnode.events[key] != null) element.removeEventListener(eventName, vnode.events[key], false)
			vnode.events[key] = callback
			element.addEventListener(eventName, vnode.events[key], false)
		}
	}

	return {
		render: function (dom, vnodes) {
			var hooks = []
			var active = $doc.activeElement
			if (dom.vnodes == null) dom.vnodes = []

			if (!(vnodes instanceof Array)) vnodes = [vnodes]
			updateNodes(dom, dom.vnodes, Node.normalizeChildren(vnodes), null, nodeMeta(hooks, undefined))
			for (var i = 0; i < hooks.length; i++) hooks[i]()
			dom.vnodes = vnodes
			if ($doc.activeElement !== active) active.focus()
		},

		setEventCallback: function (callback) {
			return onevent = callback
		},
	}
}
