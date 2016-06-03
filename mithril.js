"use strict"
if (typeof Promise === "undefined") {
	var Promise = function(executor) {
		if (!(this instanceof Promise)) throw new Error("Promise must be called with `new`")
		if (typeof executor !== "function") throw new TypeError("executor must be a function")
		
		var self = this, resolvers = [], rejectors = [], resolveCurrent = handler(resolvers, true), rejectCurrent = handler(rejectors, false)
		var instance = self._instance = {resolvers: resolvers, rejectors: rejectors}
		var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout
		function handler(list, shouldAbsorb) {
			return function execute(value) {
				var then
				try {
					if (shouldAbsorb && value != null && (typeof value === "object" || typeof value === "function") && typeof (then = value.then) === "function") {
						if (value === self) throw new TypeError("Promise can't be resolved w/ itself")
						executeOnce(then.bind(value))
					}
					else {
						callAsync(function() {
							if (!shouldAbsorb && list.length === 0) console.error("Possible unhandled promise rejection:", value)
							for (var i = 0; i < list.length; i++) list[i](value)
							resolvers.length = 0, rejectors.length = 0
							instance.state = shouldAbsorb
							instance.retry = function() {execute(value)}
						}, 0)
					}
				}
				catch (e) {
					rejectCurrent(e)
				}
			}
		}
		function executeOnce(then) {
			var runs = 0
			function run(fn) {
				return function(value) {
					if (runs++ > 0) return
					fn(value)
				}
			}
			var onerror = run(rejectCurrent)
			try {then(run(resolveCurrent), onerror)} catch (e) {onerror(e)}
		}
		
		executeOnce(executor)
	}
	Promise.prototype.then = function(onFulfilled, onRejection) {
		var self = this, instance = self._instance
		function handle(callback, list, next, state) {
			list.push(function(value) {
				if (typeof callback !== "function") next(value)
				else try {resolveNext(callback(value))} catch (e) {if (rejectNext) rejectNext(e)}
			})
			if (typeof instance.retry === "function" && state === instance.state) instance.retry()
		}
		var resolveNext, rejectNext
		var promise = new Promise(function(resolve, reject) {resolveNext = resolve, rejectNext = reject})
		handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false)
		return promise
	}
	Promise.prototype.catch = function(onRejection) {
		return this.then(null, onRejection)
	}
	Promise.resolve = function(value) {
		if (value instanceof Promise) return value
		return new Promise(function(resolve, reject) {resolve(value)})
	}
	Promise.reject = function(value) {
		return new Promise(function(resolve, reject) {reject(value)})
	}
	Promise.all = function(list) {
		return new Promise(function(resolve, reject) {
			var total = list.length, count = 0, values = []
			if (list.length === 0) resolve([])
			else for (var i = 0; i < list.length; i++) {
				new function(i) {
					function consume(value) {
						count++
						values[i] = value
						if (count === total) resolve(values)
					}
					if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
						list[i].then(consume, reject)
					}
					else consume(list[i])
				}(i)
			}
		})
	}
	Promise.race = function(list) {
		return new Promise(function(resolve, reject) {
			for (var i = 0; i < list.length; i++) {
				list[i].then(resolve, reject)
			}
		})
	}
}
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
			setAttrs(vnode, attrs)
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
			vnode.domSize = vnode.instance.domSize
			return element
		}
		else return $emptyFragment
	}
	//update
	function updateNodes(parent, old, vnodes, hooks, nextSibling) {
		if (old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling)
		else if (vnodes == null) removeNodes(parent, old, 0, old.length, vnodes)
		else {
			var recycling = isRecyclable(old, vnodes)
			if (recycling) old = old.concat(old.pool)
			
			var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map
			while (oldEnd >= oldStart && end >= start) {
				var o = old[oldStart], v = vnodes[start]
				if (o === v) oldStart++, start++
				else if (o != null && v != null && o.key === v.key) {
					oldStart++, start++
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), recycling)
					if (recycling) insertNode(parent, toFragment(o), nextSibling)
				}
				else {
					var o = old[oldEnd]
					if (o === v) oldEnd--, start++
					else if (o != null && v != null && o.key === v.key) {
						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling)
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
					updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling)
					if (recycling) insertNode(parent, toFragment(o), nextSibling)
					nextSibling = o.dom
					oldEnd--, end--
				}
				else {
					if (!map) map = getKeyMap(old, oldEnd)
					if (v != null) {
						var oldIndex = map[v.key]
						if (oldIndex != null) {
							var movable = old[oldIndex]
							updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling)
							insertNode(parent, toFragment(movable), nextSibling)
							old[oldIndex].skip = true
							nextSibling = movable.dom
						}
						else {
							var dom = createNode(v, hooks)
							insertNode(parent, dom, nextSibling)
							nextSibling = dom
						}
					}
					end--
				}
				if (end < start) break
			}
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling)
			removeNodes(parent, old, oldStart, oldEnd + 1, vnodes)
		}
	}
	function updateNode(parent, old, vnode, hooks, nextSibling, recycling) {
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
					case "[": updateFragment(parent, old, vnode, hooks, nextSibling); break
					default: updateElement(old, vnode, hooks)
				}
			}
			else updateComponent(parent, old, vnode, hooks, nextSibling, recycling)
		}
		else {
			removeNode(parent, old, null, false)
			insertNode(parent, createNode(vnode, hooks), nextSibling)
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
	function updateFragment(parent, old, vnode, hooks, nextSibling) {
		updateNodes(parent, old.children, vnode.children, hooks, nextSibling)
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
	function updateElement(old, vnode, hooks) {
		var element = vnode.dom = old.dom
		if (vnode.tag === "textarea") {
			if (vnode.attrs == null) vnode.attrs = {}
			if (vnode.text != null) vnode.attrs.value = vnode.text //FIXME handle multiple children
		}
		updateAttrs(vnode, old.attrs, vnode.attrs)
		if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [Node("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
			if (vnode.text != null) vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
			updateNodes(element, old.children, vnode.children, hooks, null)
		}
	}
	function updateComponent(parent, old, vnode, hooks, nextSibling, recycling) {
		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
		updateLifecycle(vnode.tag, vnode, hooks, recycling)
		if (vnode.instance != null) {
			updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
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
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null) return vnodes[i].dom
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
	function setAttrs(vnode, attrs) {
		for (var key in attrs) {
			setAttr(vnode, key, null, attrs[key])
		}
	}
	function setAttr(vnode, key, old, value) {
		var element = vnode.dom
		if (key === "key" || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key)) return
		var nsLastIndex = key.indexOf(":")
		if (nsLastIndex > -1 && key.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(nsLastIndex + 1), value)
		}
		else if (key[0] === "o" && key[1] === "n" && typeof value === "function") updateEvent(vnode, key, value)
		else if (key === "style") updateStyle(element, old, value)
		else if (key in element && !isAttribute(key) && vnode.ns === undefined) {
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
			if ("value" in attrs) setAttr(vnode, "value", null, attrs.value)
			if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex)
		}
	}
	function updateAttrs(vnode, old, attrs) {
		if (attrs != null) {
			for (var key in attrs) {
				setAttr(vnode, key, old && old[key], attrs[key])
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
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "shouldUpdate"
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
		if (source.oninit != null) source.oninit.call(vnode.state, vnode)
		if (source.oncreate != null) hooks.push(source.oncreate.bind(vnode.state, vnode))
	}
	function updateLifecycle(source, vnode, hooks, recycling) {
		if (recycling) initLifecycle(source, vnode, hooks)
		else if (source.onupdate != null) hooks.push(source.onupdate.bind(vnode.state, vnode))
	}
	function shouldUpdate(vnode, old) {
		var forceVnodeUpdate, forceComponentUpdate
		if (vnode.attrs != null && typeof vnode.attrs.shouldUpdate === "function") forceVnodeUpdate = vnode.attrs.shouldUpdate.call(vnode.state, vnode, old)
		if (typeof vnode.tag !== "string" && typeof vnode.tag.shouldUpdate === "function") forceComponentUpdate = vnode.tag.shouldUpdate.call(vnode.state, vnode, old)
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
	function render(dom, vnodes) {
		var hooks = []
		var active = $doc.activeElement
		if (dom.vnodes == null) dom.vnodes = []
		
		if (!(vnodes instanceof Array)) vnodes = [vnodes]
		updateNodes(dom, dom.vnodes, Node.normalizeChildren(vnodes), hooks, null)
		for (var i = 0; i < hooks.length; i++) hooks[i]()
		dom.vnodes = vnodes
		if ($doc.activeElement !== active) active.focus()
	}
	return {render: render, setEventCallback: setEventCallback}
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
var requestService = function($window, Promise1) {
	var callbackCount = 0
	function xhr(args) {
		return new Promise1(function(resolve, reject) {
			var useBody = args.useBody != null ? args.useBody : args.method !== "GET" && args.method !== "TRACE"
			
			if (typeof args.serialize !== "function") args.serialize = JSON.stringify
			if (typeof args.deserialize !== "function") args.deserialize = deserialize
			if (typeof args.extract !== "function") args.extract = extract
			
			args.url = interpolate(args.url, args.data)
			if (useBody) args.data = args.serialize(args.data)
			else args.url = assemble(args.url, args.data)
			
			var xhr = new $window.XMLHttpRequest()
			xhr.open(args.method, args.url, args.async || true, args.user, args.password)
			
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
							
							resolve(response)
						}
						else reject(new Error(xhr.responseText))
					}
					catch (e) {
						reject(e)
					}
				}
			}
			
			if (useBody) xhr.send(args.data)
			else xhr.send()
		})
	}
	function jsonp(args) {
		return new Promise1(function(resolve, reject) {
			var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
			var script = $window.document.createElement("script")
			$window[callbackName] = function(data) {
				script.parentNode.removeChild(script)
				resolve(data)
				delete $window[callbackName]
			}
			script.onerror = function() {
				script.parentNode.removeChild(script)
				reject(new Error("JSONP request failed"))
				delete $window[callbackName]
			}
			if (args.data == null) args.data = {}
			args.url = interpolate(args.url, args.data)
			args.data[args.callbackKey || "callback"] = callbackName
			script.src = assemble(args.url, args.data)
			$window.document.documentElement.appendChild(script)
		})
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
	
	return {xhr: xhr, jsonp: jsonp}
}(window, Promise)
m.request = requestService.xhr
m.jsonp = requestService.jsonp
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
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel))
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
		}
		return resolveRoute
	}
	
	function link(vnode) {
		vnode.dom.setAttribute("href", prefix + vnode.attrs.href)
		vnode.dom.onclick = function(e) {
			e.preventDefault()
			setPath(vnode.attrs.href)
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
				pending = 0
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
			if (e.redraw !== false) run()
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
		var replay = router.defineRoutes(routes, function(component, args) {
			renderer.render(root, {tag: component, attrs: args})
		}, function() {
			router.setPath(defaultRoute)
		})
		autoredraw(root, renderer, pubsub, replay)
	}
	route.link = router.link
	route.prefix = router.setPrefix
	route.setPath = router.setPath
	route.getPath = router.getPath
	
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
m.prop = function(store) {
	return function() {
		if (arguments.length > 0) store = arguments[0]
		return store
	}
}
m.withAttr = function(attrName, callback, context) {
	return function(e) {
		return callback.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
	}
}
m.render = renderService.render
m.redraw = redrawService.publish
module.exports = m
