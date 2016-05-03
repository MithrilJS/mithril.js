"use strict"

var normalizeChildren = require("../render/normalizeChildren")

module.exports = function($window, onevent) {
	var $doc = $window.document

	//create
	function createNodes(parent, vnodes, start, end, hooks, nextSibling) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				insertNode(parent, createNode(vnode, hooks), nextSibling)
			}
		}
	}
	function createNode(vnode, hooks) {
		var tag = vnode.tag
		if (vnode.attrs && vnode.attrs.oncreate) {
			hooks.push(vnode.attrs.oncreate.bind(vnode, vnode))
		}
		switch (tag) {
			case "#": return createText(vnode)
			case "<": return createHTML(vnode)
			case "[": return createFragment(vnode, hooks)
			default: return createElement(vnode, hooks)
		}
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
	function createFragment(vnode, hooks) {
		var fragment = $doc.createDocumentFragment()
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(fragment, children, 0, children.length, hooks, null)
		}
		vnode.dom = fragment.firstChild
		vnode.domSize = fragment.childNodes.length
		return fragment
	}
	function createElement(vnode, hooks) {
		var tag = vnode.tag
		var ns = vnode.ns
		
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
			else vnode.children = [{tag: "#", children: vnode.text}]
		}
		
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(element, children, 0, children.length, hooks, null)
			if (tag === "select" && "value" in attrs) {
				setAttrs(vnode, { value: attrs.value })
			}
		}
		return element
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
					if (recycling) insertNode(parent, toFragment(v), nextSibling)
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
					if (recycling) insertNode(parent, toFragment(v), nextSibling)
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
			if (recycling) {
				if (vnode.attrs && vnode.attrs.oncreate) hooks.push(vnode.attrs.oncreate.bind(vnode, vnode))
			}
			else if (vnode.attrs && vnode.attrs.onupdate) hooks.push(vnode.attrs.onupdate.bind(vnode, vnode))
			switch (oldTag) {
				case "#": updateText(old, vnode); break
				case "<": updateHTML(parent, old, vnode, nextSibling); break
				case "[": updateFragment(parent, old, vnode, hooks, nextSibling); break
				default: updateElement(old, vnode, hooks)
			}
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
			if (domSize != 1) vnode.domSize = domSize
		}
	}
	function updateElement(old, vnode, hooks) {
		var element = vnode.dom = old.dom
		updateAttrs(vnode, old.attrs, vnode.attrs)
		if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [{tag: "#", children: old.text, dom: old.dom.firstChild}]
			if (vnode.text != null) vnode.children = [{tag: "#", children: vnode.text}]
			updateNodes(element, old.children, vnode.children, hooks, null)
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
		if (vnode.attrs && vnode.attrs.onbeforeremove && deferred === false) {
			vnode.attrs.onbeforeremove.call(vnode, vnode, function() {removeNode(parent, vnode, context, true)})
			return
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
			if (context != null && vnode.domSize == null) { //TODO test custom elements
				if (!context.pool) context.pool = [vnode]
				else context.pool.push(vnode)
			}
		}
	}
	function onremove(vnode) {
		if (vnode.attrs && vnode.attrs.onremove) vnode.attrs.onremove.call(vnode, vnode)
			
		var children = vnode.children
		if (children) {
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
		//TODO test input undo history
		var element = vnode.dom
		if (key === "key" || old === value || typeof value === "undefined" || isLifecycleMethod(key)) return
		var nsLastIndex = key.indexOf(":")
		if (nsLastIndex > -1 && key.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(nsLastIndex + 1), value)
		}
		else if (key[0] === "o" && key[1] === "n" && typeof value === "function") {
			element[key] = function(e) {
				var result = value.call(element, e)
				if (typeof onevent === "function") onevent.call(element, e)
				return result
			}
		}
		else if (key === "style") updateStyle(element, old, value)
		else if (key in element && !isAttribute(key) && vnode.ns === undefined) element[key] = value
		else {
			if (typeof value === "boolean") {
				if (value) element.setAttribute(key, "")
				else element.removeAttribute(key)
			}
			else element.setAttribute(key, value)
		}
	}
	function updateAttrs(vnode, old, attrs) {
		if (attrs != null) {
			for (var key in attrs) {
				setAttr(vnode, key, old[key], attrs[key])
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
	function isLifecycleMethod(attr) {
		return attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove"
	}
	function isAttribute(attr) {
		return attr === "href" || attr === "list" || attr === "form"// || attr === "type" || attr === "width" || attr === "height"
	}
	
	//style
	function updateStyle(element, old, style) {
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

	function render(dom, vnodes) {
		//if (dom.lastRedraw + 16 > performance.now() && vnodes.length > 0) return
		//dom.lastRedraw = performance.now()
		var hooks = []
		var active = $doc.activeElement
		if (!dom.vnodes) dom.vnodes = []
		
		if (!(vnodes instanceof Array)) vnodes = [vnodes]
		updateNodes(dom, dom.vnodes, normalizeChildren(vnodes), hooks, null)
		for (var i = 0; i < hooks.length; i++) hooks[i]()
		dom.vnodes = vnodes
		if ($doc.activeElement !== active) active.focus()
	}
	
	return {render: render}
}
