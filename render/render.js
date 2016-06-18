"use strict"

var Node = require("../render/node")

var lifecycle = {
	oninit: function(source, vnode, hooks) {
		if (typeof source === "function") source = vnode.state
		if (typeof source.oninit === "function") source.oninit.call(vnode.state, vnode)
		if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode.state, vnode))
	},

	onremove: function(vnode) {
		if (typeof vnode.tag === "function" && vnode.state.onremove) vnode.state.onremove(vnode)
		else if (typeof vnode.tag !== "string" && vnode.tag.onremove) vnode.tag.onremove.call(vnode.state, vnode)
	},

	onupdate: function(source, vnode, hooks, recycling) {
		if (typeof source === "function") source = vnode.state
		if (recycling) lifecycle.oninit(source, vnode, hooks)
		else if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode.state, vnode))
	},

	onbeforeremove: function(source, vnode, ref, callback) {
		if (typeof source === "function") {
			if (vnode.state.onbeforeremove) {
				ref.expected++
				vnode.state.onbeforeremove(vnode, callback)
			}
		}
		else if (typeof source !== "string" && source.onbeforeremove) {
			ref.expected++
			source.onbeforeremove.call(vnode, vnode, callback)
		}
	},

	shouldUpdate: function(vnode, old) {
		if (typeof vnode.tag === "function") {
			if (typeof vnode.state.onbeforeupdate === "function") {
				return vnode.state.onbeforeupdate(vnode, old)
			}
		}
		else if (typeof vnode.tag !== "string" && typeof vnode.tag.onbeforeupdate === "function") {
			return vnode.tag.onbeforeupdate.call(vnode.state, vnode, old)
		}

		return undefined
	},

	view: function(vnode) {
		if (typeof vnode.tag === "function") {
			return vnode.state.view(vnode)
		}
		else {
			return vnode.tag.view.call(vnode.state, vnode)
		}
	},
}

module.exports = function($window) {
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
		if (vnode.attrs != null) lifecycle.oninit(vnode.attrs, vnode, hooks)
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
		if (typeof vnode.tag !== "function") {
			vnode.state = {}
			vnode.state = copy(vnode.tag)
		} else {
			vnode.state = new vnode.tag(vnode)
		}

		lifecycle.oninit(vnode.tag, vnode, hooks)
		vnode.instance = Node.normalize(lifecycle.view(vnode))
		if (vnode.instance != null) {
			var element = createNode(vnode.instance, hooks, ns)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
			return element
		}
		else return $emptyFragment
	}

	//update
	function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
		if (old == null && vnodes == null) return
		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, undefined)
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
					updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), recycling, ns)
					if (recycling) insertNode(parent, toFragment(o), nextSibling)
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
							updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
							insertNode(parent, toFragment(movable), nextSibling)
							old[oldIndex].skip = true
							nextSibling = movable.dom
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
			createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, undefined)
			removeNodes(parent, old, oldStart, oldEnd + 1, vnodes)
		}
	}
	function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
		var oldTag = old.tag, tag = vnode.tag
		if (oldTag === tag) {
			vnode.state = old.state
			vnode.events = old.events
			if (shouldUpdate(vnode, old)) return
			if (vnode.attrs != null) {
				lifecycle.onupdate(vnode.attrs, vnode, hooks, recycling)
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
				if (child != null) {
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
		vnode.instance = Node.normalize(lifecycle.view(vnode))
		lifecycle.onupdate(vnode.tag, vnode, hooks, recycling)
		if (vnode.instance != null) {
			updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns)
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
			var ref = {expected: 0, called: 0}
			var callback = function() {
				if (++ref.called === ref.expected) removeNode(parent, vnode, context, true)
			}
			if (vnode.attrs) lifecycle.onbeforeremove(vnode.attrs, vnode, ref, callback)
			lifecycle.onbeforeremove(vnode.tag, vnode, ref, callback)
			if (ref.expected > 0) return
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
		lifecycle.onremove(vnode)

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
	function shouldUpdate(vnode, old) {
		var forceVnodeUpdate, forceComponentUpdate
		if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode.attrs.onbeforeupdate.call(vnode.state, vnode, old)
		var forceComponentUpdate = lifecycle.shouldUpdate(vnode, old)
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
		updateNodes(dom, dom.vnodes, Node.normalizeChildren(vnodes), hooks, null, undefined)
		for (var i = 0; i < hooks.length; i++) hooks[i]()
		dom.vnodes = vnodes
		if ($doc.activeElement !== active) active.focus()
	}

	return {render: render, setEventCallback: setEventCallback}
}
