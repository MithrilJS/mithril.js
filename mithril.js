"use strict"
var guid = 0, noop = function() {}, HALT = {}
function createStream() {
	function stream() {
		if (arguments.length > 0) updateStream(stream, arguments[0], undefined)
		return stream._state.value
	}
	initStream(stream, arguments)
	if (arguments.length > 0) updateStream(stream, arguments[0], undefined)
	return stream
}
function initStream(stream, args) {
	stream.constructor = createStream
	stream._state = {id: guid++, value: undefined, error: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], errorStream: undefined, endStream: undefined}
	stream.map = map, stream.ap = ap, stream.of = createStream
	stream.valueOf = valueOf, stream.toJSON = toJSON, stream.toString = valueOf
	stream.run = run, stream.catch = doCatch
	Object.defineProperties(stream, {
		error: {get: function() {
			if (!stream._state.errorStream) {
				var errorStream = function() {
					if (arguments.length > 0) updateStream(stream, undefined, arguments[0])
					return stream._state.error
				}
				initStream(errorStream, [])
				initDependency(errorStream, [stream], noop, noop)
				stream._state.errorStream = errorStream
			}
			return stream._state.errorStream
		}},
		end: {get: function() {
			if (!stream._state.endStream) {
				var endStream = createStream()
				endStream.map(function(value) {
					if (value === true) unregisterStream(stream), unregisterStream(endStream)
					return value
				})
				stream._state.endStream = endStream
			}
			return stream._state.endStream
		}}
	})
}
function updateStream(stream, value, error) {
	updateState(stream, value, error)
	for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false)
	finalize(stream)
}
function updateState(stream, value, error) {
	error = unwrapError(value, error)
	if (error !== undefined && typeof stream._state.recover === "function") {
		try {
			var recovered = stream._state.recover()
			if (recovered === HALT) return
			updateValues(stream, recovered, undefined)
		}
		catch (e) {
			updateValues(stream, undefined, e)
			reportUncaughtError(stream, e)
		}
	}
	else updateValues(stream, value, error)
	stream._state.changed = true
	if (stream._state.state !== 2) stream._state.state = 1
}
function updateValues(stream, value, error) {
	stream._state.value = value
	stream._state.error = error
}
function updateDependency(stream, mustSync) {
	var state = stream._state, parents = state.parents
	if (parents.length > 0 && parents.filter(active).length === parents.length && (mustSync || parents.filter(changed).length > 0)) {
		var failed = parents.filter(errored)
		if (failed.length > 0) updateState(stream, undefined, failed[0]._state.error)
		else {
			try {
				var value = state.derive()
				if (value === HALT) return
				updateState(stream, value, undefined)
			}
			catch (e) {
				updateState(stream, undefined, e)
				reportUncaughtError(stream, e)
			}
		}
	}
}
function unwrapError(value, error) {
	if (value != null && value.constructor === createStream) {
		if (value._state.error !== undefined) error = value._state.error
		else error = unwrapError(value._state.value, value._state.error)
	}
	return error
}
function finalize(stream) {
	stream._state.changed = false
	for (var id in stream._state.deps) stream._state.deps[id]._state.changed = false
}
function reportUncaughtError(stream, e) {
	if (Object.keys(stream._state.deps).length === 0) {
		setTimeout(function() {
			if (Object.keys(stream._state.deps).length === 0) console.error(e)
		}, 0)
	}
}
function run(fn) {
	var self = createStream(), stream = this
	return initDependency(self, [stream], function() {
		return absorb(self, fn(stream()))
	}, undefined)
}
function doCatch(fn) {
	var self = createStream(), stream = this
	var derive = function() {return stream._state.value}
	var recover = function() {return absorb(self, fn(stream._state.error))}
	return initDependency(self, [stream], derive, recover)
}
function combine(fn, streams) {
	return initDependency(createStream(), streams, function() {
		var failed = streams.filter(errored)
		if (failed.length > 0) throw failed[0]._state.error
		return fn.apply(this, streams.concat([streams.filter(changed)]))
	}, undefined)
}
function absorb(stream, value) {
	if (value != null && value.constructor === createStream) {
		value.error.map(stream.error)
		value.map(stream)
		if (value._state.state === 0) return HALT
		if (value._state.error) throw value._state.error
		value = value._state.value
	}
	return value
}
function initDependency(dep, streams, derive, recover) {
	var state = dep._state
	state.derive = derive
	state.recover = recover
	state.parents = streams.filter(notEnded)
	registerDependency(dep, state.parents)
	updateDependency(dep, true)
	return dep
}
function registerDependency(stream, parents) {
	for (var i = 0; i < parents.length; i++) {
		parents[i]._state.deps[stream._state.id] = stream
		registerDependency(stream, parents[i]._state.parents)
	}
}
function unregisterStream(stream) {
	for (var i = 0; i < stream._state.parents.length; i++) {
		var parent = stream._state.parents[i]
		delete parent._state.deps[stream._state.id]
	}
	for (var id in stream._state.deps) {
		var dependent = stream._state.deps[id]
		var index = dependent._state.parents.indexOf(stream)
		if (index > -1) dependent._state.parents.splice(index, 1)
	}
	stream._state.state = 2 //ended
	stream._state.deps = {}
}
function map(fn) {return combine(function(stream) {return fn(stream())}, [this])}
function ap(stream) {return combine(function(s1, s2) {return s1()(s2())}, [this, stream])}
function valueOf() {return this._state.value}
function toJSON() {return JSON.stringify(this._state.value)}
function active(stream) {return stream._state.state === 1}
function changed(stream) {return stream._state.changed}
function notEnded(stream) {return stream._state.state !== 2}
function errored(stream) {return stream._state.error}
function reject(e) {
	var stream = createStream()
	stream.error(e)
	return stream
}
function merge(streams) {
	return combine(function () {
		return streams.map(function (s) {return s()})
	}, streams)
}
var Stream = {stream: createStream, merge: merge, combine: combine, reject: reject, HALT: HALT}
function Node(tag, key, attrs, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: {}, events: undefined, instance: undefined}
}
Node.normalize = function(node) {
	if (node instanceof Array) return Node("[", undefined, undefined, Node.normalizeChildren(node), undefined, undefined)
	else if (node != null && typeof node !== "object") return Node("#", undefined, undefined, node, undefined, undefined)
	return node
}
Node.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Node.normalize(children[i])
	}
	return children
}
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}
function hyperscript(selector) {
	if (typeof selector === "string") {
		if (selectorCache[selector] === undefined) {
			var match, tag, classes = [], attributes = {}
			while (match = selectorParser.exec(selector)) {
				var type = match[1], value = match[2]
				if (type === "" && value !== "") tag = value
				else if (type === "#") attributes.id = value
				else if (type === ".") classes.push(value)
				else if (match[3][0] === "[") {
					var attrValue = match[6]
					if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
					attributes[match[4]] = attrValue || true
				}
			}
			if (classes.length > 0) attributes.className = classes.join(" ")
			selectorCache[selector] = function(attrs, children) {
				var hasAttrs = false, childList, text
				var className = attrs.className || attrs.class
				for (var key in attributes) attrs[key] = attributes[key]
				if (className !== undefined) {
					if (attrs.class !== undefined) {
						attrs.class = undefined
						attrs.className = className
					}
					if (attributes.className !== undefined) attrs.className = attributes.className + " " + className
				}
				for (var key in attrs) {
					if (key !== "key") {
						hasAttrs = true
						break
					}
				}
				if (children instanceof Array && children.length == 1 && children[0] != null && children[0].tag === "#") text = children[0].children
				else childList = children
				return Node(tag || "div", attrs.key, hasAttrs ? attrs : undefined, childList, text, undefined)
			}
		}
	}
	var attrs, children, childrenIndex
	if (arguments[1] == null || typeof arguments[1] === "object" && arguments[1].tag === undefined && !(arguments[1] instanceof Array)) {
		attrs = arguments[1]
		childrenIndex = 2
	}
	else childrenIndex = 1
	if (arguments.length === childrenIndex + 1) {
		children = arguments[childrenIndex] instanceof Array ? arguments[childrenIndex] : [arguments[childrenIndex]]
	}
	else {
		children = []
		for (var i = childrenIndex; i < arguments.length; i++) children.push(arguments[i])
	}
	if (typeof selector === "string") return selectorCache[selector](attrs || {}, Node.normalizeChildren(children))
	return Node(selector, attrs && attrs.key, attrs || {}, Node.normalizeChildren(children), undefined, undefined)
}
var m = hyperscript
var renderService = function($window) {
	var $doc = $window.document
	var $emptyFragment = $doc.createDocumentFragment()
	var onevent
	function setEventCallback(callback) {return onevent = callback}
	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				insertNode(parent, createNode(vnode, hooks, ns), nextSibling)
			}
		}
	}
	function createNode(vnode, hooks, ns) {
		var tag = vnode.tag
		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
		if (typeof tag === "string") {
			switch (tag) {
				case "#": return createText(vnode)
				case "<": return createHTML(vnode)
				case "[": return createFragment(vnode, hooks, ns)
				default: return createElement(vnode, hooks, ns)
			}
		}
		else return createComponent(vnode, hooks, ns)
	}
	function createText(vnode) {
		return vnode.dom = $doc.createTextNode(vnode.children)
	}
	function createHTML(vnode) {
		var match = vnode.children.match(/^\s*?<(\w+)/im) || []
		var parent = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match[1]] || "div"
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
	function createFragment(vnode, hooks, ns) {
		var fragment = $doc.createDocumentFragment()
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(fragment, children, 0, children.length, hooks, null, ns)
		}
		vnode.dom = fragment.firstChild
		vnode.domSize = fragment.childNodes.length
		return fragment
	}
	function createElement(vnode, hooks, ns) {
		var tag = vnode.tag
		switch (vnode.tag) {
			case "svg": ns = "http://www.w3.org/2000/svg"; break
			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
		}
		var attrs = vnode.attrs
		var is = attrs && attrs.is
		var element = ns ?
			is ? $doc.createElementNS(ns, tag, is) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, is) : $doc.createElement(tag)
		vnode.dom = element
		if (attrs != null) {
			setAttrs(vnode, attrs, ns)
		}
		if (vnode.text != null) {
			if (vnode.text !== "") element.textContent = vnode.text
			else vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
		}
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(element, children, 0, children.length, hooks, null, ns)
			setLateAttrs(vnode)
		}
		return element
	}
	function createComponent(vnode, hooks, ns) {
		vnode.state = copy(vnode.tag)
		initLifecycle(vnode.tag, vnode, hooks)
		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
		if (vnode.instance != null) {
			var element = createNode(vnode.instance, hooks, ns)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0
			return element
		}
		else {
			vnode.domSize = 0
			return $emptyFragment
		}
	}
	//update
	function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
		if (old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, undefined)
		else if (vnodes == null) removeNodes(parent, old, 0, old.length, vnodes)
		else {
			var recycling = isRecyclable(old, vnodes)
			if (recycling) old = old.concat(old.pool)
			if (old.length === vnodes.length && vnodes[0] != null && vnodes[0].key == null) {
				for (var i = 0; i < old.length; i++) {
					if (old[i] == null && vnodes[i] == null) continue
					else if (old[i] == null) insertNode(parent, createNode(vnodes[i], hooks, ns), getNextSibling(old, i + 1, nextSibling))
					else if (vnodes[i] == null) removeNodes(parent, old, i, i + 1, vnodes)
					else updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns)
					if (recycling && old[i].tag === vnodes[i].tag) insertNode(parent, toFragment(old[i]), getNextSibling(old, i + 1, nextSibling))
				}
			}
			else {
				var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map
				while (oldEnd >= oldStart && end >= start) {
					var o = old[oldStart], v = vnodes[start]
					if (o === v) oldStart++, start++
					else if (o != null && v != null && o.key === v.key) {
						oldStart++, start++
						updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), recycling, ns)
						if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling)
					}
					else {
						var o = old[oldEnd]
						if (o === v) oldEnd--, start++
						else if (o != null && v != null && o.key === v.key) {
							updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
							insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling))
							oldEnd--, start++
						}
						else break
					}
				}
				while (oldEnd >= oldStart && end >= start) {
					var o = old[oldEnd], v = vnodes[end]
					if (o === v) oldEnd--, end--
					else if (o != null && v != null && o.key === v.key) {
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
						if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling)
						if (o.dom != null) nextSibling = o.dom
						oldEnd--, end--
					}
					else {
						if (!map) map = getKeyMap(old, oldEnd)
						if (v != null) {
							var oldIndex = map[v.key]
							if (oldIndex != null) {
								var movable = old[oldIndex]
								updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
								insertNode(parent, toFragment(movable), nextSibling)
								old[oldIndex].skip = true
								if (movable.dom != null) nextSibling = movable.dom
							}
							else {
								var dom = createNode(v, hooks, undefined)
								insertNode(parent, dom, nextSibling)
								nextSibling = dom
							}
						}
						end--
					}
					if (end < start) break
				}
				createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
				removeNodes(parent, old, oldStart, oldEnd + 1, vnodes)
			}
		}
	}
	function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode.tag
		if (oldTag === tag) {
			vnode.state = old.state
			vnode.events = old.events
			if (shouldUpdate(vnode, old)) return
			if (vnode.attrs != null) {
				updateLifecycle(vnode.attrs, vnode, hooks, recycling)
			}
			if (typeof oldTag === "string") {
				switch (oldTag) {
					case "#": updateText(old, vnode); break
					case "<": updateHTML(parent, old, vnode, nextSibling); break
					case "[": updateFragment(parent, old, vnode, hooks, nextSibling, ns); break
					default: updateElement(old, vnode, hooks, ns)
				}
			}
			else updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns)
		}
		else {
			removeNode(parent, old, null, false)
			insertNode(parent, createNode(vnode, hooks, undefined), nextSibling)
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
	function updateFragment(parent, old, vnode, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode.children, hooks, nextSibling, ns)
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
	function updateElement(old, vnode, hooks, ns) {
		var element = vnode.dom = old.dom
		switch (vnode.tag) {
			case "svg": ns = "http://www.w3.org/2000/svg"; break
			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
		}
		if (vnode.tag === "textarea") {
			if (vnode.attrs == null) vnode.attrs = {}
			if (vnode.text != null) vnode.attrs.value = vnode.text //FIXME handle multiple children
		}
		updateAttrs(vnode, old.attrs, vnode.attrs, ns)
		if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [Node("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
			if (vnode.text != null) vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
			updateNodes(element, old.children, vnode.children, hooks, null, ns)
		}
	}
	function updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
		updateLifecycle(vnode.tag, vnode, hooks, recycling)
		if (vnode.instance != null) {
			if (old.instance == null) insertNode(parent, createNode(vnode.instance, hooks, ns), nextSibling)
			else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
		}
		else if (old.instance != null) {
			removeNode(parent, old.instance, null, false)
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
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}
	function insertNode(parent, dom, nextSibling) {
		if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling)
		else parent.appendChild(dom)
	}
	//remove
	function removeNodes(parent, vnodes, start, end, context) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				if (vnode.skip) vnode.skip = undefined
				else removeNode(parent, vnode, context, false)
			}
		}
	}
	function removeNode(parent, vnode, context, deferred) {
		if (deferred === false) {
			var expected = 0, called = 0
			var callback = function() {
				if (++called === expected) removeNode(parent, vnode, context, true)
			}
			var removables = [vnode]
			while (removables[0]) {
				var removable = removables.shift()
				if (removable.attrs && removable.attrs.onbeforeremove) {
					expected++
					removable.attrs.onbeforeremove.call(removable.state, removable, callback)
				}
				if (removable.tag && typeof removable.tag !== "string" && removable.tag.onbeforeremove) {
					expected++
					removable.tag.onbeforeremove.call(removable.state, removable, callback)
				}
				if (removable.children && removable.children.length) {
					for (var i = 0; i < removable.children.length; i++) {
						removables.push(removable.children[i])
					}
				}
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
			if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
				if (!context.pool) context.pool = [vnode]
				else context.pool.push(vnode)
			}
		}
	}
	function onremove(vnode) {
		if (vnode.attrs && vnode.attrs.onremove) vnode.attrs.onremove.call(vnode.state, vnode)
		if (typeof vnode.tag !== "string" && vnode.tag.onremove) vnode.tag.onremove.call(vnode.state, vnode)
		if (vnode.instance != null) onremove(vnode.instance)
		else {
			var children = vnode.children
			if (children instanceof Array) {
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
		var element = vnode.dom
		if (key === "key" || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key)) return
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
	function isFormAttribute(vnode, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === $doc.activeElement
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form"// || attr === "type" || attr === "width" || attr === "height"
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
	function copy(data) {
		if (data instanceof Array) {
			var output = []
			for (var i = 0; i < data.length; i++) output[i] = data[i]
			return output
		}
		else if (typeof data === "object") {
			var output = {}
			for (var i in data) output[i] = data[i]
			return output
		}
		return data
	}
	function render(dom, vnodes) {
		var hooks = []
		var active = $doc.activeElement
		if (dom.vnodes == null) dom.vnodes = []
		if (!(vnodes instanceof Array)) vnodes = [vnodes]
		updateNodes(dom, dom.vnodes, Node.normalizeChildren(vnodes), hooks, null, undefined)
		dom.vnodes = vnodes
		for (var i = 0; i < hooks.length; i++) hooks[i]()
		if ($doc.activeElement !== active) active.focus()
	}
	return {render: render, setEventCallback: setEventCallback}
}(window)
var buildQueryString = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return ""
	var args = []
	for (var key in object) {
		destructure(key, object[key])
	}
	return args.join("&")
	function destructure(key, value) {
		if (value instanceof Array) {
			for (var i = 0; i < value.length; i++) {
				destructure(key + "[" + i + "]", value[i])
			}
		}
		else if (Object.prototype.toString.call(value) === "[object Object]") {
			for (var i in value) {
				destructure(key + "[" + i + "]", value[i])
			}
		}
		else args.push(encodeURIComponent(key) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""))
	}
}
var requestService = function($window) {
	var callbackCount = 0
	var oncompletion
	function setCompletionCallback(callback) {oncompletion = callback}
	
	function xhr(args) {
		var stream = Stream.stream()
		if (args.initialValue !== undefined) stream(args.initialValue)
		
		var useBody = typeof args.useBody === "boolean" ? args.useBody : args.method !== "GET" && args.method !== "TRACE"
		
		if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value) {return value} : JSON.stringify
		if (typeof args.deserialize !== "function") args.deserialize = deserialize
		if (typeof args.extract !== "function") args.extract = extract
		
		args.url = interpolate(args.url, args.data)
		if (useBody) args.data = args.serialize(args.data)
		else args.url = assemble(args.url, args.data)
		
		var xhr = new $window.XMLHttpRequest()
		xhr.open(args.method, args.url, typeof args.async === "boolean" ? args.async : true, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined)
		
		if (args.serialize === JSON.stringify && useBody) {
			xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
		}
		if (args.deserialize === deserialize) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}
		
		if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				try {
					var response = args.deserialize(args.extract(xhr, args))
					if (xhr.status >= 200 && xhr.status < 300) {
						if (typeof args.type === "function") {
							if (response instanceof Array) {
								for (var i = 0; i < response.length; i++) {
									response[i] = new args.type(response[i])
								}
							}
							else response = new args.type(response)
						}
						
						stream(response)
					}
					else {
						var error = new Error(xhr.responseText)
						for (var key in response) error[key] = response[key]
						stream.error(error)
					}
				}
				catch (e) {
					stream.error(e)
				}
				if (typeof oncompletion === "function") oncompletion()
			}
		}
		
		if (useBody) xhr.send(args.data)
		else xhr.send()
		
		return stream
	}
	function jsonp(args) {
		var stream = Stream.stream()
		
		var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
		var script = $window.document.createElement("script")
		$window[callbackName] = function(data) {
			script.parentNode.removeChild(script)
			stream(data)
			if (typeof oncompletion === "function") oncompletion()
			delete $window[callbackName]
		}
		script.onerror = function() {
			script.parentNode.removeChild(script)
			stream.error(new Error("JSONP request failed"))
			if (typeof oncompletion === "function") oncompletion()
			delete $window[callbackName]
		}
		if (args.data == null) args.data = {}
		args.url = interpolate(args.url, args.data)
		args.data[args.callbackKey || "callback"] = callbackName
		script.src = assemble(args.url, args.data)
		$window.document.documentElement.appendChild(script)
		return stream
	}
	function interpolate(url, data) {
		if (data == null) return url
		var tokens = url.match(/:[^\/]+/gi) || []
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1)
			if (data[key] != null) {
				url = url.replace(tokens[i], data[key])
				delete data[key]
			}
		}
		return url
	}
	function assemble(url, data) {
		var querystring = buildQueryString(data)
		if (querystring !== "") {
			var prefix = url.indexOf("?") < 0 ? "?" : "&"
			url += prefix + querystring
		}
		return url
	}
	function deserialize(data) {
		try {return data !== "" ? JSON.parse(data) : null}
		catch (e) {throw new Error(data)}
	}
	function extract(xhr) {return xhr.responseText}
	
	return {xhr: xhr, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
}(window)
var redrawService = function() {
	var callbacks = []
	function unsubscribe(callback) {
		var index = callbacks.indexOf(callback)
		if (index > -1) callbacks.splice(index, 1)
	}
    function publish() {
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i].apply(this, arguments)
        }
    }
	return {subscribe: callbacks.push.bind(callbacks), unsubscribe: unsubscribe, publish: publish}
}()
requestService.setCompletionCallback(redrawService.publish)
var parseQueryString = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1)
	var entries = string.split("&"), data = {}, counters = {}
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=")
		var key = decodeURIComponent(entry[0])
		var value = entry.length === 2 ? decodeURIComponent(entry[1]) : ""
		//TODO refactor out
		var number = Number(value)
		if (value !== "" && !isNaN(number) || value === "NaN") value = number
		else if (value === "true") value = true
		else if (value === "false") value = false
		else {
			var date = new Date(value)
			if (!isNaN(date.getTime())) value = date
		}
		var levels = key.split(/\]\[?|\[/)
		var cursor = data
		if (key.indexOf("[") > -1) levels.pop()
		for (var j = 0; j < levels.length; j++) {
			var level = levels[j], nextLevel = levels[j + 1]
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10))
			var isValue = j === levels.length - 1
			if (level === "") {
				var key = levels.slice(0, j).join()
				if (counters[key] == null) counters[key] = 0
				level = counters[key]++
			}
			if (cursor[level] == null) {
				cursor[level] = isValue ? value : isNumber ? [] : {}
			}
			cursor = cursor[level]
		}
	}
	return data
}
var coreRouter = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function" && $window.location.protocol !== "file:"
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout
	var prefix = "#!"
	function setPrefix(value) {prefix = value}
	function normalize(fragment) {
		var data = $window.location[fragment].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		if (fragment === "pathname" && data[0] !== "/") data = "/" + data
		return data
	}
	function parsePath(path, queryData, hashData) {
		var queryIndex = path.indexOf("?")
		var hashIndex = path.indexOf("#")
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
			for (var key in queryParams) queryData[key] = queryParams[key]
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1))
			for (var key in hashParams) hashData[key] = hashParams[key]
		}
		return path.slice(0, pathEnd)
	}
	function getPath() {
		var type = prefix.charAt(0)
		switch (type) {
			case "#": return normalize("hash").slice(prefix.length)
			case "?": return normalize("search").slice(prefix.length) + normalize("hash")
			default: return normalize("pathname").slice(prefix.length) + normalize("search") + normalize("hash")
		}
	}
	function setPath(path, data, options) {
		var queryData = {}, hashData = {}
		path = parsePath(path, queryData, hashData)
		if (data != null) {
			for (var key in data) queryData[key] = data[key]
			path = path.replace(/:([^\/]+)/g, function(match, token) {
				delete queryData[token]
				return data[token]
			})
		}
		var query = buildQueryString(queryData)
		if (query) path += "?" + query
		var hash = buildQueryString(hashData)
		if (hash) path += "#" + hash
		if (supportsPushState) {
			if (options && options.replace) $window.history.replaceState(null, null, prefix + path)
			else $window.history.pushState(null, null, prefix + path)
			$window.onpopstate()
		}
		else $window.location.href = prefix + path
	}
	function defineRoutes(routes, resolve, reject) {
		if (supportsPushState) $window.onpopstate = resolveRoute
		else if (prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
		resolveRoute()
		
		function resolveRoute() {
			var path = getPath()
			var params = {}
			var pathname = parsePath(path, params, params)
			callAsync(function() {
				for (var route in routes) {
					var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")
					if (matcher.test(pathname)) {
						pathname.replace(matcher, function() {
							var keys = route.match(/:[^\/]+/g) || []
							var values = [].slice.call(arguments, 1, -2)
							for (var i = 0; i < keys.length; i++) {
								params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
							}
							resolve(routes[route], params, path, route)
						})
						return
					}
				}
				reject(path, params)
			})
		}
		return resolveRoute
	}
	function link(vnode) {
		vnode.dom.setAttribute("href", prefix + vnode.attrs.href)
		vnode.dom.onclick = function(e) {
			e.preventDefault()
			e.redraw = false
			setPath(vnode.attrs.href, undefined, undefined)
		}
	}
	return {setPrefix: setPrefix, getPath: getPath, setPath: setPath, defineRoutes: defineRoutes, link: link}
}
var throttle = function(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var time = 16
	var last = 0, pending = null
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
	return function(synchronous) {
		var now = new Date().getTime()
		if (synchronous === true || last === 0 || now - last >= time) {
			last = now
			callback()
		}
		else if (pending === null) {
			pending = timeout(function() {
				pending = null
				callback()
				last = new Date().getTime()
			}, time - (now - last))
		}
	}
}
var autoredraw = function(root, renderer, pubsub, callback) {
	var run = throttle(callback)
	if (renderer != null) {
		renderer.setEventCallback(function(e) {
			if (e.redraw !== false) pubsub.publish()
		})
	}
	if (pubsub != null) {
		if (root.redraw) pubsub.unsubscribe(root.redraw)
		pubsub.subscribe(run)
	}
	return root.redraw = run
}
m.route = function($window, renderer, pubsub) {
	var router = coreRouter($window)
	var route = function(root, defaultRoute, routes) {
		var current = {route: null, component: null}
		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
			if (typeof payload.view !== "function") {
				if (typeof payload.render !== "function") payload.render = function(vnode) {return vnode}
				var render = function(component) {
					current.route = route, current.component = component
					renderer.render(root, payload.render(Node(component, null, args, undefined, undefined, undefined)))
				}
				if (typeof payload.resolve !== "function") payload.resolve = function() {render(current.component)}
				if (route !== current.route) payload.resolve(render, args, path, route)
				else render(current.component)
			}
			else {
				renderer.render(root, Node(payload, null, args, undefined, undefined, undefined))
			}
		}, function() {
			router.setPath(defaultRoute, null, {replace: true})
		})
		autoredraw(root, renderer, pubsub, replay)
	}
	route.link = router.link
	route.prefix = router.setPrefix
	route.set = router.setPath
	route.get = router.getPath
	
	return route
}(window, renderService, redrawService)
m.mount = function(renderer, pubsub) {
	return function(root, component) {
		var run = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, {tag: component})
		})
		run()
	}
}(renderService, redrawService)
m.trust = function(html) {
	return Node("<", undefined, undefined, html, undefined, undefined)
}
m.withAttr = function(attrName, callback, context) {
	return function(e) {
		return callback.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
	}
}
m.prop = Stream.stream
m.prop.combine = Stream.combine
m.prop.reject = Stream.reject
m.prop.merge = Stream.merge
m.prop.HALT = Stream.HALT
m.render = renderService.render
m.redraw = redrawService.publish
m.request = requestService.xhr
m.jsonp = requestService.jsonp
m.version = "1.0.0"
module.exports = m
