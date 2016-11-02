new function() {

function Vnode(tag, key, attrs0, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs0, children: children, text: text, dom: dom, domSize: undefined, state: {}, events: undefined, instance: undefined, skip: false}
}
Vnode.normalize = function(node) {
	if (node instanceof Array) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node != null && typeof node !== "object") return Vnode("#", undefined, undefined, node, undefined, undefined)
	return node
}
Vnode.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Vnode.normalize(children[i])
	}
	return children
}
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}
function hyperscript(selector) {
	if (selector == null || typeof selector !== "string" && selector.view == null) {
		throw Error("The selector must be either a string or a component.");
	}
	if (typeof selector === "string" && selectorCache[selector] === undefined) {
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
			return Vnode(tag || "div", attrs.key, hasAttrs ? attrs : undefined, childList, text, undefined)
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
	if (typeof selector === "string") return selectorCache[selector](attrs || {}, Vnode.normalizeChildren(children))
	return Vnode(selector, attrs && attrs.key, attrs || {}, Vnode.normalizeChildren(children), undefined, undefined)
}
hyperscript.trust = function(html) {
	if (html == null) html = ""
	return Vnode("<", undefined, undefined, html, undefined, undefined)
}
hyperscript.fragment = function(attrs1, children) {
	return Vnode("[", attrs1.key, attrs1, Vnode.normalizeChildren(children), undefined, undefined)
}
var m = hyperscript
var _7 = function(log) {
	var guid = 0, noop = function() {}, HALT = {}
	function createStream() {
		function stream() {
			if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0], undefined)
			return stream._state.value
		}
		initStream(stream)
		if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0], undefined)
		return stream
	}
	function initStream(stream) {
		stream.constructor = createStream
		stream._state = {id: guid++, value: undefined, error: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], errorStream: undefined, endStream: undefined}
		stream["fantasy-land/map"] = map, stream["fantasy-land/ap"] = ap, stream["fantasy-land/of"] = createStream
		stream.valueOf = valueOf, stream.toJSON = toJSON, stream.toString = valueOf
		stream.run = run, stream.catch = doCatch
		Object.defineProperties(stream, {
			error: {get: function() {
				if (!stream._state.errorStream) {
					var errorStream = function() {
						if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, undefined, arguments[0])
						return stream._state.error
					}
					initStream(errorStream)
					initDependency(errorStream, [stream], noop, noop)
					stream._state.errorStream = errorStream
				}
				return stream._state.errorStream
			}},
			end: {get: function() {
				if (!stream._state.endStream) {
					var endStream = createStream()
					endStream["fantasy-land/map"](function(value) {
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
			if (!resolve(stream, updateValues, true)) return
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
			else resolve(stream, updateState, false)
		}
	}
	function resolve(stream, update, shouldRecover) {
		try {
			var value = shouldRecover ? stream._state.recover() : stream._state.derive()
			if (value === HALT) return false
			update(stream, value, undefined)
		}
		catch (e) {
			update(stream, undefined, e.__error != null ? e.__error : e)
			if (e.__error == null) reportUncaughtError(stream, e)
		}
		return true
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
				if (Object.keys(stream._state.deps).length === 0) log(e)
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
		if (streams.length > streams.filter(valid).length) throw new Error("Ensure that each item passed to m.prop.combine/m.prop.merge is a stream")
		return initDependency(createStream(), streams, function() {
			var failed = streams.filter(errored)
			if (failed.length > 0) throw {__error: failed[0]._state.error}
			return fn.apply(this, streams.concat([streams.filter(changed)]))
		}, undefined)
	}
	function absorb(stream, value) {
		if (value != null && value.constructor === createStream) {
			var absorbable = value
			var update = function() {
				updateState(stream, absorbable._state.value, absorbable._state.error)
				for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false)
			}
			absorbable["fantasy-land/map"](update).catch(function(e) {
				update()
				throw {__error: e}
			})
			
			if (absorbable._state.state === 0) return HALT
			if (absorbable._state.error) throw {__error: absorbable._state.error}
			value = absorbable._state.value
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
	function ap(stream) {return combine(function(s1, s2) {return s1()(s2())}, [stream, this])}
	function valueOf() {return this._state.value}
	function toJSON() {return this._state.value != null && typeof this._state.value.toJSON === "function" ? this._state.value.toJSON() : this._state.value}
	function valid(stream) {return stream._state }
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
			return streams.map(function(s) {return s()})
		}, streams)
	}
	createStream["fantasy-land/of"] = createStream
	createStream.merge = merge
	createStream.combine = combine
	createStream.reject = reject
	createStream.HALT = HALT
	return createStream
}
var Stream = _7(console.log.bind(console))
var buildQueryString = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return ""
	var args = []
	for (var key0 in object) {
		destructure(key0, object[key0])
	}
	return args.join("&")
	function destructure(key0, value1) {
		if (value1 instanceof Array) {
			for (var i = 0; i < value1.length; i++) {
				destructure(key0 + "[" + i + "]", value1[i])
			}
		}
		else if (Object.prototype.toString.call(value1) === "[object Object]") {
			for (var i in value1) {
				destructure(key0 + "[" + i + "]", value1[i])
			}
		}
		else args.push(encodeURIComponent(key0) + (value1 != null && value1 !== "" ? "=" + encodeURIComponent(value1) : ""))
	}
}
var _9 = function($window, Stream0) {
	var callbackCount = 0
	var oncompletion
	function setCompletionCallback(callback) {oncompletion = callback}
	
	function request(args) {
		var stream0 = Stream0()
		if (args.initialValue !== undefined) stream0(args.initialValue)
		
		var useBody = typeof args.useBody === "boolean" ? args.useBody : args.method !== "GET" && args.method !== "TRACE"
		
		if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value0) {return value0} : JSON.stringify
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
					var response = (args.extract !== extract) ? args.extract(xhr, args) : args.deserialize(args.extract(xhr, args))
					if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
						stream0(cast(args.type, response))
					}
					else {
						var error = new Error(xhr.responseText)
						for (var key in response) error[key] = response[key]
						stream0.error(error)
					}
				}
				catch (e) {
					stream0.error(e)
				}
				if (typeof oncompletion === "function") oncompletion()
			}
		}
		
		if (useBody) xhr.send(args.data)
		else xhr.send()
		
		return stream0
	}
	function jsonp(args) {
		var stream0 = Stream0()
		if (args.initialValue !== undefined) stream0(args.initialValue)
		
		var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
		var script = $window.document.createElement("script")
		$window[callbackName] = function(data) {
			script.parentNode.removeChild(script)
			stream0(cast(args.type, data))
			if (typeof oncompletion === "function") oncompletion()
			delete $window[callbackName]
		}
		script.onerror = function() {
			script.parentNode.removeChild(script)
			stream0.error(new Error("JSONP request failed"))
			if (typeof oncompletion === "function") oncompletion()
			delete $window[callbackName]
		}
		if (args.data == null) args.data = {}
		args.url = interpolate(args.url, args.data)
		args.data[args.callbackKey || "callback"] = callbackName
		script.src = assemble(args.url, args.data)
		$window.document.documentElement.appendChild(script)
		return stream0
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
	
	function cast(type0, data) {
		if (typeof type0 === "function") {
			if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					data[i] = new type0(data[i])
				}
			}
			else return new type0(data)
		}
		return data
	}
	
	return {request: request, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
}
var requestService = _9(window, Stream)
var _12 = function() {
	var callbacks = []
	function unsubscribe(callback) {
		var index0 = callbacks.indexOf(callback)
		if (index0 > -1) callbacks.splice(index0, 1)
	}
    function publish() {
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i].apply(this, arguments)
        }
    }
	return {subscribe: callbacks.push.bind(callbacks), unsubscribe: unsubscribe, publish: publish}
}
var redrawService = _12()
requestService.setCompletionCallback(redrawService.publish)
var _14 = function($window) {
	var $doc = $window.document
	var $emptyFragment = $doc.createDocumentFragment()
	var onevent
	function setEventCallback(callback) {return onevent = callback}
	//create
	function createNodes(parent0, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				insertNode(parent0, createNode(vnode, hooks, ns), nextSibling)
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
		var match1 = vnode.children.match(/^\s*?<(\w+)/im) || []
		var parent0 = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match1[1]] || "div"
		var temp = $doc.createElement(parent0)
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
		var attrs2 = vnode.attrs
		var is = attrs2 && attrs2.is
		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag)
		vnode.dom = element
		if (attrs2 != null) {
			setAttrs(vnode, attrs2, ns)
		}
		if (vnode.text != null) {
			if (vnode.text !== "") element.textContent = vnode.text
			else vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
		}
		if (vnode.children != null) {
			var children = vnode.children
			createNodes(element, children, 0, children.length, hooks, null, ns)
			setLateAttrs(vnode)
		}
		return element
	}
	function createComponent(vnode, hooks, ns) {
		// For object literals since `Vnode()` always sets the `state0` field.
		if (!vnode.state) vnode.state = {}
		assign(vnode.state, vnode.tag)
		var view = vnode.tag.view
		if (view.reentrantLock != null) return $emptyFragment
		view.reentrantLock = true
		initLifecycle(vnode.tag, vnode, hooks)
		vnode.instance = Vnode.normalize(view.call(vnode.state, vnode))
		view.reentrantLock = null
		if (vnode.instance != null) {
			if (vnode.instance === vnode) throw Error("A view cannot return the vnode it received as arguments")
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
	//update0
	function updateNodes(parent0, old, vnodes, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return
		else if (old == null) createNodes(parent0, vnodes, 0, vnodes.length, hooks, nextSibling, undefined)
		else if (vnodes == null) removeNodes(parent0, old, 0, old.length, vnodes)
		else {
			var recycling = isRecyclable(old, vnodes)
			if (recycling) old = old.concat(old.pool)
			if (old.length === vnodes.length && vnodes[0] != null && vnodes[0].key == null) {
				for (var i = 0; i < old.length; i++) {
					if (old[i] === vnodes[i] || old[i] == null && vnodes[i] == null) continue
					else if (old[i] == null) insertNode(parent0, createNode(vnodes[i], hooks, ns), getNextSibling(old, i + 1, nextSibling))
					else if (vnodes[i] == null) removeNodes(parent0, old, i, i + 1, vnodes)
					else updateNode(parent0, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns)
					if (recycling && old[i].tag === vnodes[i].tag) insertNode(parent0, toFragment(old[i]), getNextSibling(old, i + 1, nextSibling))
				}
			}
			else {
				var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map0
				while (oldEnd >= oldStart && end >= start) {
					var o = old[oldStart], v = vnodes[start]
					if (o === v && !recycling) oldStart++, start++
					else if (o != null && v != null && o.key === v.key) {
						oldStart++, start++
						updateNode(parent0, o, v, hooks, getNextSibling(old, oldStart, nextSibling), recycling, ns)
						if (recycling && o.tag === v.tag) insertNode(parent0, toFragment(o), nextSibling)
					}
					else {
						var o = old[oldEnd]
						if (o === v && !recycling) oldEnd--, start++
						else if (o != null && v != null && o.key === v.key) {
							updateNode(parent0, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
							if (recycling || start < end) insertNode(parent0, toFragment(o), getNextSibling(old, oldStart, nextSibling))
							oldEnd--, start++
						}
						else break
					}
				}
				while (oldEnd >= oldStart && end >= start) {
					var o = old[oldEnd], v = vnodes[end]
					if (o === v && !recycling) oldEnd--, end--
					else if (o != null && v != null && o.key === v.key) {
						updateNode(parent0, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
						if (recycling && o.tag === v.tag) insertNode(parent0, toFragment(o), nextSibling)
						if (o.dom != null) nextSibling = o.dom
						oldEnd--, end--
					}
					else {
						if (!map0) map0 = getKeyMap(old, oldEnd)
						if (v != null) {
							var oldIndex = map0[v.key]
							if (oldIndex != null) {
								var movable = old[oldIndex]
								updateNode(parent0, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
								insertNode(parent0, toFragment(movable), nextSibling)
								old[oldIndex].skip = true
								if (movable.dom != null) nextSibling = movable.dom
							}
							else {
								var dom = createNode(v, hooks, undefined)
								insertNode(parent0, dom, nextSibling)
								nextSibling = dom
							}
						}
						end--
					}
					if (end < start) break
				}
				createNodes(parent0, vnodes, start, end + 1, hooks, nextSibling, ns)
				removeNodes(parent0, old, oldStart, oldEnd + 1, vnodes)
			}
		}
	}
	function updateNode(parent0, old, vnode, hooks, nextSibling, recycling, ns) {
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
					case "<": updateHTML(parent0, old, vnode, nextSibling); break
					case "[": updateFragment(parent0, old, vnode, hooks, nextSibling, ns); break
					default: updateElement(old, vnode, hooks, ns)
				}
			}
			else updateComponent(parent0, old, vnode, hooks, nextSibling, recycling, ns)
		}
		else {
			removeNode(parent0, old, null)
			insertNode(parent0, createNode(vnode, hooks, undefined), nextSibling)
		}
	}
	function updateText(old, vnode) {
		if (old.children.toString() !== vnode.children.toString()) {
			old.dom.nodeValue = vnode.children
		}
		vnode.dom = old.dom
	}
	function updateHTML(parent0, old, vnode, nextSibling) {
		if (old.children !== vnode.children) {
			toFragment(old)
			insertNode(parent0, createHTML(vnode), nextSibling)
		}
		else vnode.dom = old.dom, vnode.domSize = old.domSize
	}
	function updateFragment(parent0, old, vnode, hooks, nextSibling, ns) {
		updateNodes(parent0, old.children, vnode.children, hooks, nextSibling, ns)
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
			if (vnode.text != null) {
				vnode.attrs.value = vnode.text //FIXME handle multiple children
				vnode.text = undefined
			}
		}
		updateAttrs(vnode, old.attrs, vnode.attrs, ns)
		if (old.text != null && vnode.text != null && vnode.text !== "") {
			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
		}
		else {
			if (old.text != null) old.children = [Vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
			if (vnode.text != null) vnode.children = [Vnode("#", undefined, undefined, vnode.text, undefined, undefined)]
			updateNodes(element, old.children, vnode.children, hooks, null, ns)
		}
	}
	function updateComponent(parent0, old, vnode, hooks, nextSibling, recycling, ns) {
		vnode.instance = Vnode.normalize(vnode.tag.view.call(vnode.state, vnode))
		updateLifecycle(vnode.tag, vnode, hooks, recycling)
		if (vnode.instance != null) {
			if (old.instance == null) insertNode(parent0, createNode(vnode.instance, hooks, ns), nextSibling)
			else updateNode(parent0, old.instance, vnode.instance, hooks, nextSibling, recycling, ns)
			vnode.dom = vnode.instance.dom
			vnode.domSize = vnode.instance.domSize
		}
		else if (old.instance != null) {
			removeNode(parent0, old.instance, null)
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
		var map0 = {}, i = 0
		for (var i = 0; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				var key1 = vnode.key
				if (key1 != null) map0[key1] = i
			}
		}
		return map0
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
	function insertNode(parent0, dom, nextSibling) {
		if (nextSibling && nextSibling.parentNode) parent0.insertBefore(dom, nextSibling)
		else parent0.appendChild(dom)
	}
	//remove
	function removeNodes(parent0, vnodes, start, end, context) {
		for (var i = start; i < end; i++) {
			var vnode = vnodes[i]
			if (vnode != null) {
				if (vnode.skip) vnode.skip = false
				else removeNode(parent0, vnode, context)
			}
		}
	}
	function once(f) {
		var called = false
		return function() {
			if (!called) {
				called = true
				f()
			}
		}
	}
	function removeNode(parent0, vnode, context) {
		var expected = 1, called = 0
		if (vnode.attrs && vnode.attrs.onbeforeremove) {
			expected++
			vnode.attrs.onbeforeremove.call(vnode.state, vnode, once(continuation))
		}
		if (typeof vnode.tag !== "string" && vnode.tag.onbeforeremove) {
			expected++
			vnode.tag.onbeforeremove.call(vnode.state, vnode, once(continuation))
		}
		continuation()
		function continuation() {
			if (++called === expected) {
				onremove(vnode)
				if (vnode.dom) {
					var count = vnode.domSize || 1
					if (count > 1) {
						var dom = vnode.dom
						while (--count) {
							parent0.removeChild(dom.nextSibling)
						}
					}
					if (vnode.dom.parentNode != null) parent0.removeChild(vnode.dom)
					if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
						if (!context.pool) context.pool = [vnode]
						else context.pool.push(vnode)
					}
				}
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
	//attrs2
	function setAttrs(vnode, attrs2, ns) {
		for (var key1 in attrs2) {
			setAttr(vnode, key1, null, attrs2[key1], ns)
		}
	}
	function setAttr(vnode, key1, old, value2, ns) {
		var element = vnode.dom
		if (key1 === "key" || (old === value2 && !isFormAttribute(vnode, key1)) && typeof value2 !== "object" || typeof value2 === "undefined" || isLifecycleMethod(key1)) return
		var nsLastIndex = key1.indexOf(":")
		if (nsLastIndex > -1 && key1.substr(0, nsLastIndex) === "xlink") {
			element.setAttributeNS("http://www.w3.org/1999/xlink", key1.slice(nsLastIndex + 1), value2)
		}
		else if (key1[0] === "o" && key1[1] === "n" && typeof value2 === "function") updateEvent(vnode, key1, value2)
		else if (key1 === "style") updateStyle(element, old, value2)
		else if (key1 in element && !isAttribute(key1) && ns === undefined) {
			//setting input[value2] to same value2 by typing on focused element moves cursor to end in Chrome
			if (vnode.tag === "input" && key1 === "value" && vnode.dom.value === value2 && vnode.dom === $doc.activeElement) return
			element[key1] = value2
		}
		else {
			if (typeof value2 === "boolean") {
				if (value2) element.setAttribute(key1, "")
				else element.removeAttribute(key1)
			}
			else element.setAttribute(key1 === "className" ? "class" : key1, value2)
		}
	}
	function setLateAttrs(vnode) {
		var attrs2 = vnode.attrs
		if (vnode.tag === "select" && attrs2 != null) {
			if ("value" in attrs2) setAttr(vnode, "value", null, attrs2.value, undefined)
			if ("selectedIndex" in attrs2) setAttr(vnode, "selectedIndex", null, attrs2.selectedIndex, undefined)
		}
	}
	function updateAttrs(vnode, old, attrs2, ns) {
		if (attrs2 != null) {
			for (var key1 in attrs2) {
				setAttr(vnode, key1, old && old[key1], attrs2[key1], ns)
			}
		}
		if (old != null) {
			for (var key1 in old) {
				if (attrs2 == null || !(key1 in attrs2)) {
					if (key1 === "className") key1 = "class"
					if (key1[0] === "o" && key1[1] === "n" && !isLifecycleMethod(key1)) updateEvent(vnode, key1, undefined)
					else if (key1 !== "key") vnode.dom.removeAttribute(key1)
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
		return attr === "href" || attr === "list" || attr === "form" || attr === "width" || attr === "height"// || attr === "type"
	}
	function hasIntegrationMethods(source) {
		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
	}
	//style
	function updateStyle(element, old, style) {
		if (old === style) element.style.cssText = "", old = null
		if (style == null) element.style.cssText = ""
		else if (typeof style === "string") element.style.cssText = style
		else {
			if (typeof old === "string") element.style.cssText = ""
			for (var key1 in style) {
				element.style[key1] = style[key1]
			}
			if (old != null && typeof old !== "string") {
				for (var key1 in old) {
					if (!(key1 in style)) element.style[key1] = ""
				}
			}
		}
	}
	//event
	function updateEvent(vnode, key1, value2) {
		var element = vnode.dom
		var callback = function(e) {
			var result = value2.call(element, e)
			if (typeof onevent === "function") onevent.call(element, e)
			return result
		}
		if (key1 in element) element[key1] = callback
		else {
			var eventName = key1.slice(2)
			if (vnode.events === undefined) vnode.events = {}
			if (vnode.events[key1] != null) element.removeEventListener(eventName, vnode.events[key1], false)
			if (typeof value2 === "function") {
				vnode.events[key1] = callback
				element.addEventListener(eventName, vnode.events[key1], false)
			}
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
	function assign(target, source) {
		Object.keys(source).forEach(function(k){target[k] = source[k]})
	}
	function render(dom, vnodes) {
		if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
		var hooks = []
		var active0 = $doc.activeElement
		// First time rendering into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		if (!(vnodes instanceof Array)) vnodes = [vnodes]
		updateNodes(dom, dom.vnodes, Vnode.normalizeChildren(vnodes), hooks, null, undefined)
		dom.vnodes = vnodes
		for (var i = 0; i < hooks.length; i++) hooks[i]()
		if ($doc.activeElement !== active0) active0.focus()
	}
	return {render: render, setEventCallback: setEventCallback}
}
var renderService = _14(window)
var throttle = function(callback1) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var time = 16
	var last = 0, pending = null
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
	return function(synchronous) {
		var now = Date.now()
		if (synchronous === true || last === 0 || now - last >= time) {
			last = now
			callback1()
		}
		else if (pending === null) {
			pending = timeout(function() {
				pending = null
				callback1()
				last = Date.now()
			}, time - (now - last))
		}
	}
}
var autoredraw = function(root, renderer, pubsub, callback0) {
	var run1 = throttle(callback0)
	if (renderer != null) {
		renderer.setEventCallback(function(e) {
			if (e.redraw !== false) pubsub.publish()
		})
	}
	if (pubsub != null) {
		if (root.redraw) pubsub.unsubscribe(root.redraw)
		pubsub.subscribe(run1)
	}
	return root.redraw = run1
}
var _18 = function(renderer, pubsub) {
	return function(root, component) {
		if (component === null) {
			renderer.render(root, [])
			pubsub.unsubscribe(root.redraw)
			delete root.redraw
			return
		}
		
		if (component.view == null) throw new Error("m.mount(element, component) expects a component, not a vnode")
		var run0 = autoredraw(root, renderer, pubsub, function() {
			renderer.render(root, Vnode(component, undefined, undefined, undefined, undefined, undefined))
		})
		run0()
	}
}
m.mount = _18(renderService, redrawService)
var mount = m.mount
var parseQueryString = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1)
	var entries = string.split("&"), data0 = {}, counters = {}
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=")
		var key3 = decodeURIComponent(entry[0])
		var value4 = entry.length === 2 ? decodeURIComponent(entry[1]) : ""
		if (value4 === "true") value4 = true
		else if (value4 === "false") value4 = false
		var levels = key3.split(/\]\[?|\[/)
		var cursor = data0
		if (key3.indexOf("[") > -1) levels.pop()
		for (var j = 0; j < levels.length; j++) {
			var level = levels[j], nextLevel = levels[j + 1]
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10))
			var isValue = j === levels.length - 1
			if (level === "") {
				var key3 = levels.slice(0, j).join()
				if (counters[key3] == null) counters[key3] = 0
				level = counters[key3]++
			}
			if (cursor[level] == null) {
				cursor[level] = isValue ? value4 : isNumber ? [] : {}
			}
			cursor = cursor[level]
		}
	}
	return data0
}
var coreRouter = function($window) {
	var supportsPushState = typeof $window.history.pushState === "function"
	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout
	var prefix1 = "#!"
	function setPrefix(value3) {prefix1 = value3}
	function normalize(fragment0) {
		var data = $window.location[fragment0].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		if (fragment0 === "pathname" && data[0] !== "/") data = "/" + data
		return data
	}
	var asyncId
	function debounceAsync(f) {
		return function() {
			if (asyncId != null) return
			asyncId = callAsync(function() {
				asyncId = null
				f()
			})
		}
	}
	function parsePath(path, queryData, hashData) {
		var queryIndex = path.indexOf("?")
		var hashIndex = path.indexOf("#")
		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
		if (queryIndex > -1) {
			var queryEnd = hashIndex > -1 ? hashIndex : path.length
			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
			for (var key2 in queryParams) queryData[key2] = queryParams[key2]
		}
		if (hashIndex > -1) {
			var hashParams = parseQueryString(path.slice(hashIndex + 1))
			for (var key2 in hashParams) hashData[key2] = hashParams[key2]
		}
		return path.slice(0, pathEnd)
	}
	function getPath() {
		var type2 = prefix1.charAt(0)
		switch (type2) {
			case "#": return normalize("hash").slice(prefix1.length)
			case "?": return normalize("search").slice(prefix1.length) + normalize("hash")
			default: return normalize("pathname").slice(prefix1.length) + normalize("search") + normalize("hash")
		}
	}
	function setPath(path, data, options) {
		var queryData = {}, hashData = {}
		path = parsePath(path, queryData, hashData)
		if (data != null) {
			for (var key2 in data) queryData[key2] = data[key2]
			path = path.replace(/:([^\/]+)/g, function(match2, token) {
				delete queryData[token]
				return data[token]
			})
		}
		var query = buildQueryString(queryData)
		if (query) path += "?" + query
		var hash = buildQueryString(hashData)
		if (hash) path += "#" + hash
		if (supportsPushState) {
			if (options && options.replace) $window.history.replaceState(null, null, prefix1 + path)
			else $window.history.pushState(null, null, prefix1 + path)
			$window.onpopstate()
		}
		else $window.location.href = prefix1 + path
	}
	function defineRoutes(routes, resolve1, reject0) {
		if (supportsPushState) $window.onpopstate = debounceAsync(resolveRoute)
		else if (prefix1.charAt(0) === "#") $window.onhashchange = resolveRoute
		resolveRoute()
		
		function resolveRoute() {
			var path = getPath()
			var params = {}
			var pathname = parsePath(path, params, params)
			
			for (var route0 in routes) {
				var matcher = new RegExp("^" + route0.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")
				if (matcher.test(pathname)) {
					pathname.replace(matcher, function() {
						var keys = route0.match(/:[^\/]+/g) || []
						var values = [].slice.call(arguments, 1, -2)
						for (var i = 0; i < keys.length; i++) {
							params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
						}
						resolve1(routes[route0], params, path, route0)
					})
					return
				}
			}
			reject0(path, params)
		}
		return resolveRoute
	}
	function link(vnode2) {
		vnode2.dom.setAttribute("href", prefix1 + vnode2.attrs.href)
		vnode2.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault()
			e.redraw = false
			var href = this.getAttribute("href")
			if (href.indexOf(prefix1) === 0) href = href.slice(prefix1.length)
			setPath(href, undefined, undefined)
		}
	}
	return {setPrefix: setPrefix, getPath: getPath, setPath: setPath, defineRoutes: defineRoutes, link: link}
}
var _24 = function($window, mount0) {
	var router = coreRouter($window)
	var currentResolve, currentComponent, currentRender, currentArgs, currentPath
	var RouteComponent = {view: function() {
		return [currentRender(Vnode(currentComponent, null, currentArgs, undefined, undefined, undefined))]
	}}
	function defaultRender(vnode1) {
		return vnode1
	}
	var route = function(root, defaultRoute, routes) {
		currentComponent = "div"
		currentRender = defaultRender
		currentArgs = null
		mount0(root, RouteComponent)
		router.defineRoutes(routes, function(payload, args0, path) {
			var isResolver = typeof payload.view !== "function"
			var render1 = defaultRender
			var resolve0 = currentResolve = function (component) {
				if (resolve0 !== currentResolve) return
				currentResolve = null
				currentComponent = component != null ? component : isResolver ? "div" : payload
				currentRender = render1
				currentArgs = args0
				currentPath = path
				root.redraw(true)
			}
			var onmatch = function() {
				resolve0()
			}
			if (isResolver) {
				if (typeof payload.render === "function") render1 = payload.render.bind(payload)
				if (typeof payload.onmatch === "function") onmatch = payload.onmatch
			}
		
			onmatch.call(payload, resolve0, args0, path)
		}, function() {
			router.setPath(defaultRoute, null, {replace: true})
		})
	}
	route.link = router.link
	route.prefix = router.setPrefix
	route.set = router.setPath
	route.get = function() {return currentPath}
	return route
}
m.route = _24(window, mount)
m.withAttr = function(attrName, callback2, context) {
	return function(e) {
		return callback2.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
	}
}
m.prop = Stream
m.render = renderService.render
m.redraw = redrawService.publish
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = parseQueryString
m.buildQueryString = buildQueryString
m.version = "1.0.0-rc.2"
if (typeof module !== "undefined") module["exports"] = m
else window.m = m
}