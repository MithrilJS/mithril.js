Mithril = m = new function app(window, undefined) {
	var type = {}.toString
	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/

	function m() {
		var args = arguments
		var hasAttrs = args[1] !== undefined && type.call(args[1]) == "[object Object]" && !("tag" in args[1]) && !("subtree" in args[1])
		var attrs = hasAttrs ? args[1] : {}
		var classAttrName = "class" in attrs ? "class" : "className"
		var cell = {tag: "div", attrs: {}}
		var match, classes = []
		while (match = parser.exec(args[0])) {
			if (match[1] == "") cell.tag = match[2]
			else if (match[1] == "#") cell.attrs.id = match[2]
			else if (match[1] == ".") classes.push(match[2])
			else if (match[3][0] == "[") {
				var pair = attrParser.exec(match[3])
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true)
			}
		}
		if (classes.length > 0) cell.attrs[classAttrName] = classes.join(" ")

		cell.children = hasAttrs ? args[2] : args[1]

		for (var attrName in attrs) {
			if (attrName == classAttrName) cell.attrs[attrName] = (cell.attrs[attrName] || "") + " " + attrs[attrName]
			else cell.attrs[attrName] = attrs[attrName]
		}
		return cell
	}
	function build(parentElement, parentTag, parentCache, parentIndex, data, cached, shouldReattach, index, editable, namespace, configs) {
		//`build` is a recursive function that manages creation/diffing/removal of DOM elements based on comparison between `data` and `cached`

		//`parentElement` is a DOM element used for W3C DOM API calls
		//`parentTag` is only used for handling a corner case for textarea values
		//`parentCache` is used to remove nodes in some multi-node cases
		//`parentIndex` and `index` are used to figure out the offset of nodes. They're artifacts from before arrays started being flattened and are likely refactorable
		//`data` and `cached` are, respectively, the new and old nodes being diffed
		//`shouldReattach` is a flag indicating whether a parent node was recreated (if so, and if this node is reused, then this node must reattach itself to the new parent)
		//`editable` is a flag that indicates whether an ancestor is contenteditable
		//`namespace` indicates the closest HTML namespace as it cascades down from an ancestor
		//`configs` is a list of config functions to run after the topmost `build` call finishes running

		//there's logic that relies on the assumption that null and undefined data are equivalent to empty strings
		//- this prevents lifecycle surprises from procedural helpers that mix implicit and explicit return statements
		//- it simplifies diffing code
		if (data === undefined || data === null) data = ""
		if (data.subtree === "retain") return cached

		var cachedType = type.call(cached), dataType = type.call(data)
		if (cached === undefined || cached === null || cachedType != dataType) {
			if (cached !== null && cached !== undefined) {
				if (parentCache && parentCache.nodes) {
					var offset = index - parentIndex
					var end = offset + (dataType == "[object Array]" ? data : cached.nodes).length
					clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end))
				}
				else if (cached.nodes) clear(cached.nodes, cached)
			}
			cached = new data.constructor
			cached.nodes = []
		}

		if (dataType == "[object Array]") {
			data = flatten(data)
			var nodes = [], intact = cached.length === data.length, subArrayCount = 0

			//key algorithm: sort elements without recreating them if keys are present
			//1) create a map of all existing keys, and mark all for deletion
			//2) add new keys to map and mark them for addition
			//3) if key exists in new list, change action from deletion to a move
			//4) for each key, handle its corresponding action as marked in previous steps
			//5) copy unkeyed items into their respective gaps
			var DELETION = 1, INSERTION = 2 , MOVE = 3
			var existing = {}, unkeyed = [], shouldMaintainIdentities = false
			for (var i = 0; i < cached.length; i++) {
				if (cached[i] && cached[i].attrs && cached[i].attrs.key !== undefined) {
					shouldMaintainIdentities = true
					existing[cached[i].attrs.key] = {action: DELETION, index: i}
				}
			}
			if (shouldMaintainIdentities) {
				for (var i = 0; i < data.length; i++) {
					if (data[i] && data[i].attrs) {
						if (data[i].attrs.key !== undefined) {
							var key = data[i].attrs.key
							if (!existing[key]) existing[key] = {action: INSERTION, index: i}
							else existing[key] = {action: MOVE, index: i, from: existing[key].index, element: parentElement.childNodes[existing[key].index]}
						}
						else unkeyed.push({index: i, element: parentElement.childNodes[i]})
					}
				}
				var actions = Object.keys(existing).map(function(key) {return existing[key]})
				var changes = actions.sort(function(a, b) {return a.action - b.action || a.index - b.index})
				var newCached = cached.slice()

				for (var i = 0, change; change = changes[i]; i++) {
					if (change.action == DELETION) {
						clear(cached[change.index].nodes, cached[change.index])
						newCached.splice(change.index, 1)
					}
					if (change.action == INSERTION) {
						var dummy = window.document.createElement("div")
						dummy.key = data[change.index].attrs.key
						parentElement.insertBefore(dummy, parentElement.childNodes[change.index])
						newCached.splice(change.index, 0, {attrs: {key: data[change.index].attrs.key}, nodes: [dummy]})
					}

					if (change.action == MOVE) {
						if (parentElement.childNodes[change.index] !== change.element && change.element !== null) {
							parentElement.insertBefore(change.element, parentElement.childNodes[change.index])
						}
						newCached[change.index] = cached[change.from]
					}
				}
				for (var i = 0; i < unkeyed.length; i++) {
					var change = unkeyed[i]
					parentElement.insertBefore(change.element, parentElement.childNodes[change.index])
					newCached[change.index] = cached[change.index]
				}
				cached = newCached
				cached.nodes = []
				for (var i = 0, child; child = parentElement.childNodes[i]; i++) cached.nodes.push(child)
			}
			//end key algorithm

			for (var i = 0, cacheCount = 0; i < data.length; i++) {
				var item = build(parentElement, parentTag, cached, index, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace, configs)
				if (item === undefined) continue
				if (!item.nodes.intact) intact = false
				var isArray = type.call(item) == "[object Array]"
				subArrayCount += isArray ? item.length : 1
				cached[cacheCount++] = item
			}
			if (!intact) {
				for (var i = 0; i < data.length; i++) {
					if (cached[i] !== undefined) nodes = nodes.concat(cached[i].nodes)
				}
				for (var i = 0, node; node = cached.nodes[i]; i++) {
					if (node.parentNode !== null && nodes.indexOf(node) < 0) node.parentNode.removeChild(node)
				}
				for (var i = cached.nodes.length, node; node = nodes[i]; i++) {
					if (node.parentNode === null) parentElement.appendChild(node)
				}
				if (data.length < cached.length) cached.length = data.length
				cached.nodes = nodes
			}

		}
		else if (data !== undefined && dataType == "[object Object]") {
			//if an element is different enough from the one in cache, recreate it
			if (data.tag != cached.tag || Object.keys(data.attrs).join() != Object.keys(cached.attrs).join() || data.attrs.id != cached.attrs.id) {
				clear(cached.nodes)
				if (cached.configContext && typeof cached.configContext.onunload == "function") cached.configContext.onunload()
			}
			if (typeof data.tag != "string") return

			var node, isNew = cached.nodes.length === 0
			if (data.attrs.xmlns) namespace = data.attrs.xmlns
			else if (data.tag === "svg") namespace = "http://www.w3.org/2000/svg"
			else if (data.tag === "math") namespace = "http://www.w3.org/1998/Math/MathML"
			if (isNew) {
				node = namespace === undefined ? window.document.createElement(data.tag) : window.document.createElementNS(namespace, data.tag)
				cached = {
					tag: data.tag,
					//process children before attrs so that select.value works correctly
					children: data.children !== undefined ? build(node, data.tag, undefined, undefined, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace, configs) : [],
					attrs: setAttributes(node, data.tag, data.attrs, {}, namespace),
					nodes: [node]
				}
				parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			else {
				node = cached.nodes[0]
				setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
				cached.children = data.children !== undefined ? build(node, data.tag, undefined, undefined, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace, configs) : []
				cached.nodes.intact = true
				if (shouldReattach === true && node !== null) parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			//schedule configs to be called. They are called after `build` finishes running
			if (typeof data.attrs["config"] === "function") {
				configs.push(data.attrs["config"].bind(window, node, !isNew, cached.configContext = cached.configContext || {}, cached))
			}
		}
		else if (typeof dataType != "function") {
			//handle text nodes
			var nodes
			if (cached.nodes.length === 0) {
				if (data.$trusted) {
					nodes = injectHTML(parentElement, index, data)
				}
				else {
					nodes = [window.document.createTextNode(data)]
					parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
				}
				cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data
				cached.nodes = nodes
			}
			else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
				nodes = cached.nodes
				if (!editable || editable !== window.document.activeElement) {
					if (data.$trusted) {
						clear(nodes, cached)
						nodes = injectHTML(parentElement, index, data)
					}
					else {
						//corner case: replacing the nodeValue of a text node that is a child of a textarea/contenteditable doesn't work
						if (parentTag === "textarea") parentElement.value = data
						else if (editable) editable.innerHTML = data
						else {
							if (nodes[0].nodeType == 1 || nodes.length > 1) { //was a trusted string
								clear(cached.nodes, cached)
								nodes = [window.document.createTextNode(data)]
							}
							parentElement.insertBefore(nodes[0], parentElement.childNodes[index] || null)
							nodes[0].nodeValue = data
						}
					}
				}
				cached = new data.constructor(data)
				cached.nodes = nodes
			}
			else cached.nodes.intact = true
		}

		return cached
	}
	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		var groups = {}
		for (var attrName in dataAttrs) {
			var dataAttr = dataAttrs[attrName]
			var cachedAttr = cachedAttrs[attrName]
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr) || node === window.document.activeElement) {
				cachedAttrs[attrName] = dataAttr
				if (attrName === "config") continue
				else if (typeof dataAttr == "function" && attrName.indexOf("on") == 0) {
					node[attrName] = autoredraw(dataAttr, node)
				}
				else if (attrName === "style" && typeof dataAttr == "object") {
					for (var rule in dataAttr) {
						if (cachedAttr === undefined || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule]
					}
					for (var rule in cachedAttr) {
						if (!(rule in dataAttr)) node.style[rule] = ""
					}
				}
				else if (namespace !== undefined) {
					if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr)
					else if (attrName === "className") node.setAttribute("class", dataAttr)
					else node.setAttribute(attrName, dataAttr)
				}
				else if (attrName === "value" && tag === "input") {
					if (node.value !== dataAttr) node.value = dataAttr
				}
				else if (attrName in node && !(attrName == "list" || attrName == "style")) {
					node[attrName] = dataAttr
				}
				else node.setAttribute(attrName, dataAttr)
			}
		}
		return cachedAttrs
	}
	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				nodes[i].parentNode.removeChild(nodes[i])
				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}
		if (nodes.length != 0) nodes.length = 0
	}
	function unload(cached) {
		if (cached.configContext && typeof cached.configContext.onunload == "function") cached.configContext.onunload()
		if (cached.children) {
			if (type.call(cached.children) == "[object Array]") for (var i = 0; i < cached.children.length; i++) unload(cached.children[i])
			else if (cached.children.tag) unload(cached.children)
		}
	}
	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index]
		if (nextSibling) {
			var isElement = nextSibling.nodeType != 1
			var placeholder = window.document.createElement("span")
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parentElement.removeChild(placeholder)
			}
			else nextSibling.insertAdjacentHTML("beforebegin", data)
		}
		else parentElement.insertAdjacentHTML("beforeend", data)
		var nodes = []
		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index])
			index++
		}
		return nodes
	}
	function flatten(data) {
		var flattened = []
		for (var i = 0; i < data.length; i++) {
			var item = data[i]
			if (type.call(item) == "[object Array]") flattened.push.apply(flattened, flatten(item))
			else flattened.push(item)
		}
		return flattened
	}
	function autoredraw(callback, object, group) {
		return function(e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {return callback.call(object, e)}
			finally {
				if (!lastRedrawId) lastRedrawId = -1;
				m.endComputation()
			}
		}
	}

	var html
	var documentNode = {
		insertAdjacentHTML: function(_, data) {
			window.document.write(data)
			window.document.close()
		},
		appendChild: function(node) {
			if (html === undefined) html = window.document.createElement("html")
			if (node.nodeName == "HTML") html = node
			else html.appendChild(node)
			if (window.document.documentElement && window.document.documentElement !== html) {
				window.document.replaceChild(html, window.document.documentElement)
			}
			else window.document.appendChild(html)
		},
		insertBefore: function(node) {
			this.appendChild(node)
		},
		childNodes: []
	}
	var nodeCache = [], cellCache = {}
	m.render = function(root, cell, forceRecreation) {
		var configs = []
		if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.")
		var id = getCellCacheKey(root)
		var node = root == window.document || root == window.document.documentElement ? documentNode : root
		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)
		cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs)
		for (var i = 0; i < configs.length; i++) configs[i]()
	}
	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function(value) {
		value = new String(value)
		value.$trusted = true
		return value
	}

	function _prop(store) {
		var prop = function() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function() {
			return store
		}

		return prop
	}

	m.prop = function (store) {
		if ((typeof store === 'object' || typeof store === 'function') &&
				typeof store.then === 'function') {
			var prop = _prop()
			newPromisedProp(prop, store).then(prop)

			return prop
		}

		return _prop(store)
	}

	var roots = [], modules = [], controllers = [], lastRedrawId = 0, computePostRedrawHook = null, prevented = false
	m.module = function(root, module) {
		var index = roots.indexOf(root)
		if (index < 0) index = roots.length
		var isPrevented = false
		if (controllers[index] && typeof controllers[index].onunload == "function") {
			var event = {
				preventDefault: function() {isPrevented = true}
			}
			controllers[index].onunload(event)
		}
		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			modules[index] = module
			controllers[index] = new module.controller
			m.endComputation()
		}
	}
	m.redraw = function() {
		var cancel = window.cancelAnimationFrame || window.clearTimeout
		var defer = window.requestAnimationFrame || window.setTimeout
		if (lastRedrawId) {
			cancel(lastRedrawId)
			lastRedrawId = defer(redraw, 0)
		}
		else {
			redraw()
			lastRedrawId = defer(function() {lastRedrawId = null}, 0)
		}
	}
	m.redraw.strategy = m.prop()
	function redraw() {
		var mode = m.redraw.strategy()
		for (var i = 0; i < roots.length; i++) {
			if (controllers[i] && mode != "none") m.render(roots[i], modules[i].view(controllers[i]), mode == "all")
		}
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}
		lastRedrawId = null
		m.redraw.strategy("diff")
	}

	var pendingRequests = 0
	m.startComputation = function() {pendingRequests++}
	m.endComputation = function() {
		pendingRequests = Math.max(pendingRequests - 1, 0)
		if (pendingRequests == 0) m.redraw()
	}

	m.withAttr = function(prop, withAttrCallback) {
		return function(e) {
			e = e || event
			var currentTarget = e.currentTarget || this
			withAttrCallback(prop in currentTarget ? currentTarget[prop] : currentTarget.getAttribute(prop))
		}
	}

	//routing
	var modes = {pathname: "", hash: "#", search: "?"}
	var redirect = function() {}, routeParams = {}, currentRoute
	m.route = function() {
		if (arguments.length === 0) return currentRoute
		else if (arguments.length === 3 && typeof arguments[1] == "string") {
			var root = arguments[0], defaultRoute = arguments[1], router = arguments[2]
			redirect = function(source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, router, path)) {
					m.route(defaultRoute, true)
				}
			}
			var listener = m.route.mode == "hash" ? "onhashchange" : "onpopstate"
			window[listener] = function() {
				if (currentRoute != normalizeRoute(window.location[m.route.mode])) {
					redirect(window.location[m.route.mode])
				}
			}
			computePostRedrawHook = setScroll
			window[listener]()
		}
		else if (arguments[0].addEventListener) {
			var element = arguments[0]
			var isInitialized = arguments[1]
			if (element.href.indexOf(modes[m.route.mode]) < 0) {
				element.href = window.location.pathname + modes[m.route.mode] + element.pathname
			}
			if (!isInitialized) {
				element.removeEventListener("click", routeUnobtrusive)
				element.addEventListener("click", routeUnobtrusive)
			}
		}
		else if (typeof arguments[0] == "string") {
			currentRoute = arguments[0]
			var querystring = typeof arguments[1] == "object" ? buildQueryString(arguments[1]) : null
			if (querystring) currentRoute += (currentRoute.indexOf("?") === -1 ? "?" : "&") + querystring

			var shouldReplaceHistoryEntry = (arguments.length == 3 ? arguments[2] : arguments[1]) === true

			if (window.history.pushState) {
				computePostRedrawHook = function() {
					window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, window.document.title, modes[m.route.mode] + currentRoute)
					setScroll()
				}
				redirect(modes[m.route.mode] + currentRoute)
			}
			else window.location[m.route.mode] = currentRoute
		}
	}
	m.route.param = function(key) {return routeParams[key]}
	m.route.mode = "search"
	function normalizeRoute(route) {return route.slice(modes[m.route.mode].length)}
	function routeByValue(root, router, path) {
		routeParams = {}

		var queryStart = path.indexOf("?")
		if (queryStart !== -1) {
			routeParams = parseQueryString(path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		}

		for (var route in router) {
			if (route == path) {
				m.module(root, router[route])
				return true
			}

			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

			if (matcher.test(path)) {
				path.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g) || []
					var values = [].slice.call(arguments, 1, -2)
					for (var i = 0; i < keys.length; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeSpace(values[i])
					m.module(root, router[route])
				})
				return true
			}
		}
	}
	function routeUnobtrusive(e) {
		e = e || event
		if (e.ctrlKey || e.metaKey || e.which == 2) return
		e.preventDefault()
		m.route(e.currentTarget[m.route.mode].slice(modes[m.route.mode].length))
	}
	function setScroll() {
		if (m.route.mode != "hash" && window.location.hash) window.location.hash = window.location.hash
		else window.scrollTo(0, 0)
	}
	function buildQueryString(object, prefix) {
		var str = []
		for(var prop in object) {
			var key = prefix ? prefix + "[" + prop + "]" : prop, value = object[prop]
			str.push(typeof value == "object" ? buildQueryString(value, key) : encodeURIComponent(key) + "=" + encodeURIComponent(value))
		}
		return str.join("&")
	}
	function parseQueryString(str) {
		var pairs = str.split("&"), params = {}
		for (var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split("=")
			params[decodeSpace(pair[0])] = pair[1] ? decodeSpace(pair[1]) : (pair.length === 1 ? true : "")
		}
		return params
	}
	function decodeSpace(string) {
		return decodeURIComponent(string.replace(/\+/g, " "))
	}
	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	var none = {}
	function newPromisedProp(prop, promise) {
		prop.then = function () {
			var newProp = m.prop()
			return newPromisedProp(newProp,
				promise.then.apply(promise, arguments).then(newProp))
		}
		prop.promise = prop
		prop.resolve = function (val) {
			prop(val)
			promise = promise.resolve.apply(promise, arguments)
			return prop
		}
		prop.reject = function () {
			promise = promise.reject.apply(promise, arguments)
			return prop
		}

		return prop
	}
	m.deferred = function () {

		// Promiz.mithril.js | Zolmeister | MIT
		function Deferred(fn, er) {
			// states
			// 0: pending
			// 1: resolving
			// 2: rejecting
			// 3: resolved
			// 4: rejected
			var self = this,
				state = 0,
				val = 0,
				next = [];

			self['promise'] = self

			self['resolve'] = function (v) {
				if (!state) {
					val = v
					state = 1

					fire()
				}
				return this
			}

			self['reject'] = function (v) {
				if (!state) {
					val = v
					state = 2

					fire()
				}
				return this
			}

			self['then'] = function (fn, er) {
				var d = new Deferred(fn, er)
				if (state == 3) {
					d.resolve(val)
				}
				else if (state == 4) {
					d.reject(val)
				}
				else {
					next.push(d)
				}
				return d
			}

			var finish = function (type) {
				state = type || 4
				next.map(function (p) {
					state == 3 && p.resolve(val) || p.reject(val)
				})
			}

			// ref : reference to 'then' function
			// cb, ec, cn : successCallback, failureCallback, notThennableCallback
			function thennable (ref, cb, ec, cn) {
				if ((typeof val == 'object' || typeof val == 'function') && typeof ref == 'function') {
					try {

						// cnt protects against abuse calls from spec checker
						var cnt = 0
						ref.call(val, function (v) {
							if (cnt++) return
							val = v
							cb()
						}, function (v) {
							if (cnt++) return
							val = v
							ec()
						})
					} catch (e) {
						val = e
						ec()
					}
				} else {
					cn()
				}
			};

			function fire() {

				// check if it's a thenable
				var ref;
				try {
					ref = val && val.then
				} catch (e) {
					val = e
					state = 2
					return fire()
				}
				thennable(ref, function () {
					state = 1
					fire()
				}, function () {
					state = 2
					fire()
				}, function () {
					try {
						if (state == 1 && typeof fn == 'function') {
							val = fn(val)
						}

						else if (state == 2 && typeof er == 'function') {
							val = er(val)
							state = 1
						}
					} catch (e) {
						val = e
						return finish()
					}

					if (val == self) {
						val = TypeError()
						finish()
					} else thennable(ref, function () {
							finish(3)
						}, finish, function () {
							finish(state == 1 && 3)
						})

				})
			}
		}

		return newPromisedProp(m.prop(), new Deferred())
	}
	m.sync = function(args) {
		var method = "resolve"
		function synchronizer(pos, resolved) {
			return function(value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding == 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		var deferred = m.deferred()
		var outstanding = args.length
		var results = new Array(outstanding)
		if (args.length > 0) {
			for (var i = 0; i < args.length; i++) {
				args[i].then(synchronizer(i, true), synchronizer(i, false))
			}
		}
		else deferred.resolve()

		return deferred.promise
	}
	function identity(value) {return value}

	function ajax(options) {
		var xhr = new window.XMLHttpRequest
		xhr.open(options.method, options.url, true, options.user, options.password)
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr})
				else options.onerror({type: "error", target: xhr})
			}
		}
		if (options.serialize == JSON.stringify && options.method != "GET") {
			xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
		}
		if (typeof options.config == "function") {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr !== undefined) xhr = maybeXhr
		}
		xhr.send(options.method == "GET" ? "" : options.data)
		return xhr
	}
	function bindData(xhrOptions, data, serialize) {
		if (data && Object.keys(data).length > 0) {
			if (xhrOptions.method == "GET") {
				xhrOptions.url = xhrOptions.url + (xhrOptions.url.indexOf("?") < 0 ? "?" : "&") + buildQueryString(data)
			}
			else xhrOptions.data = serialize(data)
		}
		return xhrOptions
	}
	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi)
		if (tokens && data) {
			for (var i = 0; i < tokens.length; i++) {
				var key = tokens[i].slice(1)
				url = url.replace(tokens[i], data[key])
				delete data[key]
			}
		}
		return url
	}

	m.request = function(xhrOptions) {
		if (xhrOptions.background !== true) m.startComputation()
		var deferred = m.deferred()
		var serialize = xhrOptions.serialize = xhrOptions.serialize || JSON.stringify
		var deserialize = xhrOptions.deserialize = xhrOptions.deserialize || JSON.parse
		var extract = xhrOptions.extract || function(xhr) {
			return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
		}
		xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data)
		xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize)
		xhrOptions.onload = xhrOptions.onerror = function(e) {
			try {
				e = e || event
				var unwrap = (e.type == "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity
				var response = unwrap(deserialize(extract(e.target, xhrOptions)))
				if (e.type == "load") {
					if (type.call(response) == "[object Array]" && xhrOptions.type) {
						for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
					}
					else if (xhrOptions.type) response = new xhrOptions.type(response)
				}
				deferred[e.type == "load" ? "resolve" : "reject"](response)
			}
			catch (e) {
				if (e instanceof SyntaxError) throw new SyntaxError("Could not parse HTTP response. See http://lhorie.github.io/mithril/mithril.request.html#using-variable-data-formats")
				else if (type.call(e) == "[object Error]" && e.constructor !== Error) throw e
				else deferred.reject(e)
			}
			if (xhrOptions.background !== true) m.endComputation()
		}
		ajax(xhrOptions)
		return deferred.promise
	}

	//testing API
	m.deps = function(mock) {return window = mock}
	//for internal testing only, do not use `m.deps.factory`
	m.deps.factory = app

	return m
}(typeof window != "undefined" ? window : {})

if (typeof module != "undefined" && module !== null) module.exports = m
if (typeof define == "function" && define.amd) define(function() {return m})

;;;

function test(condition) {
	var duration = 0
	var start = 0
	var result = true
	test.total++

	if (typeof performance != "undefined") {
		start = performance.now()
	}
	try {
		if (!condition()) throw new Error()
	}
	catch (e) {
		result = false
		console.error(e)
		test.failures.push(condition)
	}
	if (typeof performance != "undefined") {
		duration = performance.now() - start
	}

	test_obj = {
		name: "" + test.total,
		result: result,
		duration: duration
	}

	if (typeof window != "undefined") {
		if (!result) {
			window.global_test_results.tests.push(test_obj)
		}

		window.global_test_results.duration += duration
		if (result) {
			window.global_test_results.passed++
		} else {
			window.global_test_results.failed++
		}
	}
}
test.total = 0
test.failures = []
test.print = function(print) {
	for (var i = 0; i < test.failures.length; i++) {
		print(test.failures[i].toString())
	}
	print("tests: " + test.total + "\nfailures: " + test.failures.length)

	if (test.failures.length > 0) {
		throw new Error(test.failures.length + " tests did not pass")
	}
}

var mock = {}
mock.window = new function() {
	var window = {}
	window.document = {}
	window.document.childNodes = []
	window.document.createElement = function(tag) {
		return {
			style: {},
			childNodes: [],
			nodeType: 1,
			nodeName: tag.toUpperCase(),
			appendChild: window.document.appendChild,
			removeChild: window.document.removeChild,
			replaceChild: window.document.replaceChild,
			insertBefore: function(node, reference) {
				node.parentNode = this
				var referenceIndex = this.childNodes.indexOf(reference)
				if (referenceIndex < 0) this.childNodes.push(node)
				else {
					var index = this.childNodes.indexOf(node)
					if (index > -1) this.childNodes.splice(index, 1)
					this.childNodes.splice(referenceIndex, 0, node)
				}
			},
			insertAdjacentHTML: function(position, html) {
				//todo: accept markup
				if (position == "beforebegin") {
					this.parentNode.insertBefore(window.document.createTextNode(html), this)
				}
				else if (position == "beforeend") {
					this.appendChild(window.document.createTextNode(html))
				}
			},
			setAttribute: function(name, value) {
				this[name] = value.toString()
			},
			setAttributeNS: function(namespace, name, value) {
				this.namespaceURI = namespace
				this[name] = value.toString()
			},
			getAttribute: function(name, value) {
				return this[name]
			}
		}
	}
	window.document.createElementNS = function(namespace, tag) {
		var element = window.document.createElement(tag)
		element.namespaceURI = namespace
		return element
	}
	window.document.createTextNode = function(text) {
		return {nodeValue: text.toString()}
	}
	window.document.documentElement = window.document.createElement("html")
	window.document.replaceChild = function(newChild, oldChild) {
		var index = this.childNodes.indexOf(oldChild)
		if (index > -1) this.childNodes.splice(index, 1, newChild)
		else this.childNodes.push(newChild)
		newChild.parentNode = this
		oldChild.parentNode = null
	}
	window.document.appendChild = function(child) {
		var index = this.childNodes.indexOf(child)
		if (index > -1) this.childNodes.splice(index, 1)
		this.childNodes.push(child)
		child.parentNode = this
	}
	window.document.removeChild = function(child) {
		var index = this.childNodes.indexOf(child)
		this.childNodes.splice(index, 1)
		child.parentNode = null
	}
	window.scrollTo = function() {}
	window.cancelAnimationFrame = function() {}
	window.requestAnimationFrame = function(callback) {
		window.requestAnimationFrame.$callback = callback
		return window.requestAnimationFrame.$id++
	}
	window.requestAnimationFrame.$id = 1
	window.requestAnimationFrame.$resolve = function() {
		if (window.requestAnimationFrame.$callback) window.requestAnimationFrame.$callback()
		window.requestAnimationFrame.$callback = null
	}
	window.XMLHttpRequest = new function() {
		var request = function() {
			this.$headers = {}
			this.setRequestHeader = function(key, value) {
				this.$headers[key] = value
			}
			this.open = function(method, url) {
				this.method = method
				this.url = url
			}
			this.send = function() {
				this.responseText = JSON.stringify(this)
				this.readyState = 4
				this.status = 200
				request.$instances.push(this)
			}
		}
		request.$instances = []
		return request
	}
	window.location = {search: "", pathname: "", hash: ""},
	window.history = {}
	window.history.pushState = function(data, title, url) {
		window.location.pathname = window.location.search = window.location.hash = url
	},
	window.history.replaceState = function(data, title, url) {
		window.location.pathname = window.location.search = window.location.hash = url
	}
	return window
}
function testMithril(mock) {
	m.deps(mock)

	//m
	test(function() {return m("div").tag === "div"})
	test(function() {return m(".foo").tag === "div"})
	test(function() {return m(".foo").attrs.className === "foo"})
	test(function() {return m("[title=bar]").tag === "div"})
	test(function() {return m("[title=bar]").attrs.title === "bar"})
	test(function() {return m("[title=\'bar\']").attrs.title === "bar"})
	test(function() {return m("[title=\"bar\"]").attrs.title === "bar"})
	test(function() {return m("div", "test").children === "test"})
	test(function() {return m("div", ["test"]).children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, "test").attrs.title === "bar"})
	test(function() {return m("div", {title: "bar"}, "test").children === "test"})
	test(function() {return m("div", {title: "bar"}, ["test"]).children[0] === "test"})
	test(function() {return m("div", {title: "bar"}, m("div")).children.tag === "div"})
	test(function() {return m("div", {title: "bar"}, [m("div")]).children[0].tag === "div"})
	test(function() {return m("div", ["a", "b"]).children.length === 2})
	test(function() {return m("div", [m("div")]).children[0].tag === "div"})
	test(function() {return m("div", m("div")).children.tag === "div"}) //yes, this is expected behavior: see method signature
	test(function() {return m("div", [undefined]).tag === "div"})
	test(function() {return m("div", [{foo: "bar"}])}) //as long as it doesn't throw errors, it's fine
	test(function() {return m("svg", [m("g")])})
	test(function() {return m("svg", [m("a[href='http://google.com']")])})
	test(function() {return m(".foo", {class: "bar"}).attrs.class == "foo bar"})
	test(function() {return m(".foo", {className: "bar"}).attrs.className == "foo bar"})

	//m.module
	test(function() {
		mock.requestAnimationFrame.$resolve()

		var root1 = mock.document.createElement("div")
		m.module(root1, {
			controller: function() {this.value = "test1"},
			view: function(ctrl) {return ctrl.value}
		})

		var root2 = mock.document.createElement("div")
		m.module(root2, {
			controller: function() {this.value = "test2"},
			view: function(ctrl) {return ctrl.value}
		})

		mock.requestAnimationFrame.$resolve()

		return root1.childNodes[0].nodeValue === "test1" && root2.childNodes[0].nodeValue === "test2"
	})

	//m.withAttr
	test(function() {
		var value
		var handler = m.withAttr("test", function(data) {value = data})
		handler({currentTarget: {test: "foo"}})
		return value === "foo"
	})

	//m.trust
	test(function() {return m.trust("test").valueOf() === "test"})

	//m.render
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, "test")
		return root.childNodes[0].nodeValue === "test"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {class: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {class: "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m(".a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m(".b"))
		var elementAfter = root.childNodes[0]
		return elementBefore === elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {id: "a"}))
		var elementBefore = root.childNodes[0]
		m.render(root, m("div", {title: "b"}))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("[title=b]"))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, "test")
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [undefined]))
		return root.childNodes[0].childNodes[0].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("g")]))
		var g = root.childNodes[0].childNodes[0]
		return g.nodeName === "G" && g.namespaceURI == "http://www.w3.org/2000/svg"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("svg", [m("a[href='http://google.com']")]))
		return root.childNodes[0].childNodes[0].nodeName === "A"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div.classname", [m("a", {href: "/first"})]))
		m.render(root, m("div", [m("a", {href: "/second"})]))
		return root.childNodes[0].childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes[1].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li"), m("li")]))
		m.render(root, m("ul", [m("li"), undefined]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [undefined]))
		return root.childNodes[0].childNodes[0].nodeValue === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li")]))
		m.render(root, m("ul", [{}]))
		return root.childNodes[0].childNodes.length === 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", [m("a")])]))
		m.render(root, m("ul", [{subtree: "retain"}]))
		return root.childNodes[0].childNodes[0].childNodes[0].nodeName === "A"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/43
		var root = mock.document.createElement("div")
		m.render(root, m("a", {config: m.route}, "test"))
		m.render(root, m("a", {config: m.route}, "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/29
		var root = mock.document.createElement("div")
		var list = [false, false]
		m.render(root, list.reverse().map(function(flag, index) {
			return m("input[type=checkbox]", {onclick: m.withAttr("checked", function(value) {list[index] = value}), checked: flag})
		}))

		mock.document.activeElement = root.childNodes[0]
		root.childNodes[0].checked = true
		root.childNodes[0].onclick({currentTarget: {checked: true}})

		m.render(root, list.reverse().map(function(flag, index) {
			return m("input[type=checkbox]", {onclick: m.withAttr("checked", function(value) {list[index] = value}), checked: flag})
		}))

		mock.document.activeElement = null

		return root.childNodes[0].checked === false && root.childNodes[1].checked === true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (1)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (2)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [null, m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (3)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", ["test", m("#bar")]))
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeName === "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (4)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("div"), m("#bar")]))
		m.render(root, m("#foo", ["test", m("#bar")]))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/44 (5)
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [m("#bar")]))
		m.render(root, m("#foo", [m("#bar"), [m("#baz")]]))
		return root.childNodes[0].childNodes[1].id === "baz"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/48
		var root = mock.document
		m.render(root, m("html", [m("#foo")]))
		var result = root.childNodes[0].childNodes[0].id === "foo"
		root.childNodes = [mock.document.createElement("html")]
		return result
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a.foo", "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test"))
		return root.childNodes[0].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a.foo", "test"))
		m.render(root, m("a", "test1"))
		return root.childNodes[0].childNodes[0].nodeValue === "test1"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/49
		var root = mock.document.createElement("div")
		m.render(root, m("a", "test"))
		m.render(root, m("a", "test1"))
		return root.childNodes[0].childNodes[0].nodeValue === "test1"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "b"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], m("#bar")]))
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b"), m("div", "c")], m("#bar")]))
		return root.childNodes[0].childNodes[2].childNodes[0].nodeValue === "c"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], [m("div", "c"), m("div", "d")], m("#bar")]))
		return root.childNodes[0].childNodes[3].childNodes[0].nodeValue === "d" && root.childNodes[0].childNodes[4].id === "bar"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [[m("div", "a"), m("div", "b")], "test"]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "b" && root.childNodes[0].childNodes[2].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/50
		var root = mock.document.createElement("div")
		m.render(root, m("#foo", [["a", "b"], "test"]))
		return root.childNodes[0].childNodes[1].nodeValue === "b" && root.childNodes[0].childNodes[2].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", [m("span"), m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeName === "SPAN"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", ["test", m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/51
		var root = mock.document.createElement("div")
		m.render(root, m("main", [m("button"), m("article", [m("section"), m("nav")])]))
		m.render(root, m("main", [m("button"), m("article", [m.trust("test"), m("nav")])]))
		return root.childNodes[0].childNodes[1].childNodes[0].nodeValue === "test"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/55
		var root = mock.document.createElement("div")
		m.render(root, m("#a"))
		var elementBefore = root.childNodes[0]
		m.render(root, m("#b"))
		var elementAfter = root.childNodes[0]
		return elementBefore !== elementAfter
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/56
		var root = mock.document.createElement("div")
		m.render(root, [null, "foo"])
		m.render(root, ["bar"])
		return root.childNodes.length == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/56
		var root = mock.document.createElement("div")
		m.render(root, m("div", "foo"))
		return root.childNodes.length == 1
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("button"), m("ul")]))
		var valueBefore = root.childNodes[0].childNodes[0].nodeName
		m.render(root, m("div", [undefined, m("ul")]))
		var valueAfter = root.childNodes[0].childNodes[0].nodeValue
		return valueBefore === "BUTTON" && valueAfter === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("ul"), undefined]))
		var valueBefore1 = root.childNodes[0].childNodes[0].nodeName
		var valueBefore2 = root.childNodes[0].childNodes[1].nodeValue
		m.render(root, m("div", [undefined, m("ul")]))
		var valueAfter1 = root.childNodes[0].childNodes[0].nodeValue
		var valueAfter2 = root.childNodes[0].childNodes[1].nodeName
		return valueBefore1 === "UL" && valueAfter1 === "" && valueBefore2 === "" && valueAfter2 === "UL"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/79
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		var valueBefore = root.childNodes[0].style.background
		m.render(root, m("div", {style: {}}))
		var valueAfter = root.childNodes[0].style.background
		return valueBefore === "red" && valueAfter === ""
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div[style='background:red']"))
		return root.childNodes[0].style === "background:red"
	})
	test(function() {
		var root = mock.document.createElement("div")
		m.render(root, m("div", {style: {background: "red"}}))
		var valueBefore = root.childNodes[0].style.background
		m.render(root, m("div", {}))
		var valueAfter = root.childNodes[0].style.background
		return valueBefore === "red" && valueAfter === undefined
	})
	test(function() {
		var root = mock.document.createElement("div")
		var module = {}, unloaded = false
		module.controller = function() {
			this.onunload = function() {unloaded = true}
		}
		module.view = function() {}
		m.module(root, module)
		m.module(root, {controller: function() {}, view: function() {}})
		return unloaded === true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/87
		var root = mock.document.createElement("div")
		m.render(root, m("div", [[m("a"), m("a")], m("button")]))
		m.render(root, m("div", [[m("a")], m("button")]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeName == "BUTTON"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/87
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("a"), m("b"), m("button")]))
		m.render(root, m("div", [m("a"), m("button")]))
		return root.childNodes[0].childNodes.length == 2 && root.childNodes[0].childNodes[1].nodeName == "BUTTON"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/99
		var root = mock.document.createElement("div")
		m.render(root, m("div", [m("img"), m("h1")]))
		m.render(root, m("div", [m("a")]))
		return root.childNodes[0].childNodes.length == 1 && root.childNodes[0].childNodes[0].nodeName == "A"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", "b", "c", "d"]))
		m.render(root, m("div", [["d", "e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["a", "b", "c", "d"]]))
		m.render(root, m("div", ["d", "e"]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["x", [["a"], "b", "c", "d"]]))
		m.render(root, m("div", ["d", ["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["b"]))
		m.render(root, m("div", [["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 1 && children[0].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", ["b"]]))
		m.render(root, m("div", ["d", [["e"]]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"]]]))
		m.render(root, m("div", ["d", ["e"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 2 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/120
		var root = mock.document.createElement("div")
		m.render(root, m("div", ["a", [["b"], "c"]]))
		m.render(root, m("div", ["d", [[["e"]], "x"]]))
		var children = root.childNodes[0].childNodes
		return children.length == 3 && children[0].nodeValue == "d" && children[1].nodeValue == "e"
	})
	test(function() {
		var root = mock.document.createElement("div")

		var success = false
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {ctx.data = 1}}))
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {success = ctx.data === 1}}))
		return success
	})
	test(function() {
		var root = mock.document.createElement("div")

		var index = 0;
		var success = true;
		var statefulConfig = function(elem, isInitialized, ctx) {ctx.data = index++}
		var node = m("div", {config: statefulConfig});
		m.render(root, [node, node]);

		index = 0;
		var checkConfig = function(elem, isInitialized, ctx) {
			success = success && (ctx.data === index++)
		}
		node = m("div", {config: checkConfig});
		m.render(root, [node, node]);
		return success;
	})
	test(function() {
		var root = mock.document.createElement("div")
		var parent
		m.render(root, m("div", m("a", {
			config: function(el) {parent = el.parentNode.parentNode}
		})));
		return parent === root
	})
	test(function() {
		var root = mock.document.createElement("div")
		var count = 0
		m.render(root, m("div", m("a", {
			config: function(el) {
				var island = mock.document.createElement("div")
				count++
				if (count > 2) throw "too much recursion..."
				m.render(island, m("div"))
			}
		})));
		return count == 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/129
		var root = mock.document.createElement("div")
		m.render(root, m("div", [["foo", "bar"], ["foo", "bar"], ["foo", "bar"]]));
		m.render(root, m("div", ["asdf", "asdf2", "asdf3"]));
		return true
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		//insert at beginning
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 4}), m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstAfter = root.childNodes[1]
		return firstBefore == firstAfter && root.childNodes[0].key == 4 && root.childNodes.length == 4
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[0]
		m.render(root, [m("a", {key: 4}), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[1]
		return firstBefore == firstAfter && root.childNodes[0].key == 4 && root.childNodes.length == 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3})])
		var firstBefore = root.childNodes[1]
		m.render(root, [m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4})])
		var firstAfter = root.childNodes[0]
		return firstBefore == firstAfter && root.childNodes[0].key === "2" && root.childNodes.length === 3
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]
		m.render(root, [m("a", {key: 4}), m("a", {key: 10}), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[2]
		var secondAfter = root.childNodes[3]
		var fourthAfter = root.childNodes[0]
		return firstBefore === firstAfter && secondBefore === secondAfter && fourthBefore === fourthAfter && root.childNodes[1].key == "10" && root.childNodes.length === 4
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/98
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a", {key: 3}), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var fourthBefore = root.childNodes[3]
		m.render(root, [m("a", {key: 4}), m("a", {key: 10}), m("a", {key: 2}), m("a", {key: 1}), m("a", {key: 6}), m("a", {key: 7})])
		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		return firstBefore === firstAfter && secondBefore === secondAfter && fourthBefore === fourthAfter && root.childNodes[1].key == "10" && root.childNodes[4].key == "6" && root.childNodes[5].key == "7" && root.childNodes.length === 6
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/149
		var root = mock.document.createElement("div")
		m.render(root, [m("a", {key: 1}), m("a", {key: 2}), m("a"), m("a", {key: 4}), m("a", {key: 5})])
		var firstBefore = root.childNodes[0]
		var secondBefore = root.childNodes[1]
		var thirdBefore = root.childNodes[2]
		var fourthBefore = root.childNodes[3]
		var fifthBefore = root.childNodes[4]
		m.render(root, [m("a", {key: 4}), m("a", {key: 5}), m("a"), m("a", {key: 1}), m("a", {key: 2})])
		var firstAfter = root.childNodes[3]
		var secondAfter = root.childNodes[4]
		var thirdAfter = root.childNodes[2]
		var fourthAfter = root.childNodes[0]
		var fifthAfter = root.childNodes[1]
		return firstBefore === firstAfter && secondBefore === secondAfter && thirdBefore === thirdAfter && fourthBefore === fourthAfter && fifthBefore === fifthAfter
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/134
		var root = mock.document.createElement("div")
		m.render(root, m("div", {contenteditable: true}, "test"))
		mock.document.activeElement = root.childNodes[0]
		m.render(root, m("div", {contenteditable: true}, "test1"))
		m.render(root, m("div", {contenteditable: false}, "test2"))
		return root.childNodes[0].childNodes[0].nodeValue === "test2"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/136
		var root = mock.document.createElement("div")
		m.render(root, m("textarea", ["test"]))
		m.render(root, m("textarea", ["test1"]))
		return root.childNodes[0].value === "test1"
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloaded = 0
		m.render(root, [
			m("div", {
				key: 1,
				config: function(el, init, ctx) {
					ctx.onunload = function() {
						unloaded++
					}
				}
			})
		])
		m.render(root, [
			m("div", {key: 2}),
			m("div", {
				key: 1,
				config: function(el, init, ctx) {
					ctx.onunload = function() {
						unloaded++
					}
				}
			})
		])
		return unloaded == 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloadedParent = 0
		var unloadedChild = 0
		var configParent = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedParent++
			}
		}
		var configChild = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedChild++
			}
		}
		var unloaded = 0
		m.render(root, m("div", {config: configParent}, m("a", {config: configChild})))
		m.render(root, m("main", {config: configParent}, m("a", {config: configChild})))
		return unloadedParent === 1 && unloadedChild === 0
	})
	test(function() {
		var root = mock.document.createElement("div")
		var unloadedParent = 0
		var unloadedChild = 0
		var configParent = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedParent++
			}
		}
		var configChild = function(el, init, ctx) {
			ctx.onunload = function() {
				unloadedChild++
			}
		}
		var unloaded = 0
		m.render(root, m("div", {config: configParent}, m("a", {config: configChild})))
		m.render(root, m("main", {config: configParent}, m("b", {config: configChild})))
		return unloadedParent === 1 && unloadedChild === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/150
		var root = mock.document.createElement("div")
		m.render(root, [m("a"), m("div")])
		m.render(root, [[], m("div")])
		return root.childNodes.length == 1 && root.childNodes[0].nodeName == "DIV"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/156
		var root = mock.document.createElement("div")
		m.render(root, m("div", [
			["a", "b", "c", "d"].map(function() {
				return [m("div"), " "]
			}),
			m("span")
		]))
		return root.childNodes[0].childNodes[8].nodeName == "SPAN"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 2}), m("li", {key: 4})]))
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5})]))
		return root.childNodes[0].childNodes.map(function(n) {return n.key}).join("") == "012345"
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("input", {value: "a"}))
		m.render(root, m("input", {value: "aa"}))
		return root.childNodes[0].childNodes.length == 0
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/157
		var root = mock.document.createElement("div")
		m.render(root, m("br", {class: "a"}))
		m.render(root, m("br", {class: "aa"}))
		return root.childNodes[0].childNodes.length == 0
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/194
		var root = mock.document.createElement("div")
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 3}), m("li", {key: 4}), m("li", {key: 5})]))
		m.render(root, m("ul", [m("li", {key: 0}), m("li", {key: 1}), m("li", {key: 2}), m("li", {key: 4}), m("li", {key: 5})]))
		return root.childNodes[0].childNodes.map(function(n) {return n.key}).join("") == "01245"
	})
	//end m.render

	//m.redraw
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		mock.requestAnimationFrame.$resolve()
		var valueBefore = root.childNodes[0].nodeValue
		controller.value = "foo"
		m.redraw()
		mock.requestAnimationFrame.$resolve()
		return valueBefore === "" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		var count = 0
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {},
			view: function(ctrl) {
				count++
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		m.redraw() //should run synchronously

		m.redraw() //rest should run asynchronously since they're spamming
		m.redraw()
		m.redraw()
		mock.requestAnimationFrame.$resolve() //teardown
		return count === 3
	})

	//m.route
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test1", {
			"/test1": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test1" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.pathname = "/"

		var root = mock.document.createElement("div")
		m.route.mode = "pathname"
		m.route(root, "/test2", {
			"/test2": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.pathname == "/test2" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.hash = "#"

		var root = mock.document.createElement("div")
		m.route.mode = "hash"
		m.route(root, "/test3", {
			"/test3": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.hash == "#/test3" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test4/foo", {
			"/test4/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test4/foo" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("test")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test5/foo", {
			"/": module,
			"/test5/:test": module
		})
		var paramValueBefore = m.route.param("test")
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var paramValueAfter = m.route.param("test")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test6/foo", {
			"/": module,
			"/test6/:a1": module
		})
		var paramValueBefore = m.route.param("a1")
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var paramValueAfter = m.route.param("a1")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/61
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test7/foo", {
			"/": module,
			"/test7/:a1": module
		})
		var routeValueBefore = m.route()
		mock.requestAnimationFrame.$resolve()
		m.route("/")
		var routeValueAfter = m.route()
		mock.requestAnimationFrame.$resolve() //teardown
		return routeValueBefore === "/test7/foo" && routeValueAfter === "/"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test8/foo/SEP/bar/baz", {
			"/test8/:test/SEP/:path...": {
				controller: function() {},
				view: function() {
					return m.route.param("test") + "_" + m.route.param("path")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test8/foo/SEP/bar/baz" && root.childNodes[0].nodeValue === "foo_bar/baz"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test9/foo/bar/SEP/baz", {
			"/test9/:test.../SEP/:path": {
				controller: function() {},
				view: function() {
					return m.route.param("test") + "_" + m.route.param("path")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test9/foo/bar/SEP/baz" && root.childNodes[0].nodeValue === "foo/bar_baz"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test10/foo%20bar", {
			"/test10/:test": {
				controller: function() {},
				view: function() {
					return m.route.param("test")
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return root.childNodes[0].nodeValue === "foo bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "foo"}},
			"/test11": {controller: function() {}, view: function() {return "bar"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test11/")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test11/" && root.childNodes[0].nodeValue === "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {}},
			"/test12": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test12?a=foo&b=bar")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test12?a=foo&b=bar" && m.route.param("a") == "foo" && m.route.param("b") == "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "bar"}},
			"/test13/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test13/foo?test=bar")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test13/foo?test=bar" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {return "bar"}},
			"/test14": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test14?test&test2=")
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test14?test&test2=" && m.route.param("test") === true && m.route.param("test2") === ""
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {}, view: function() {}},
			"/test12": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test12", {a: "foo", b: "bar"})
		mock.requestAnimationFrame.$resolve() //teardown
		return mock.location.search == "?/test12?a=foo&b=bar" && m.route.param("a") == "foo" && m.route.param("b") == "bar"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var route1, route2
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {controller: function() {route1 = m.route()}, view: function() {}},
			"/test13": {controller: function() {route2 = m.route()}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test13")
		mock.requestAnimationFrame.$resolve() //teardown
		return route1 == "/" && route2 == "/test13"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test14": {controller: function() {}, view: function() {}}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test14")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div"),
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test15": {
				controller: function() {},
				view: function() {
					return [m("div")]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test15")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test16": {
				controller: function() {},
				view: function() {
					return m("a")
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test16")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test17": {
				controller: function() {},
				view: function() {
					return m("a")
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test17")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return m("div", {
						config: function(el, init, ctx) {
							ctx.onunload = function() {
								unloaded++
							}
						}
					})
				}
			},
			"/test18": {
				controller: function() {},
				view: function() {
					return [m("a")]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test18")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 1,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test20": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 2,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test20")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		m.route.mode = "search"
		m.route(root, "/", {
			"/": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							key: 1,
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			},
			"/test21": {
				controller: function() {},
				view: function() {
					return [
						m("div", {
							config: function(el, init, ctx) {
								ctx.onunload = function() {
									unloaded++
								}
							}
						})
					]
				}
			}
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/test21")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/foo", {
			"/foo": {
				controller: function() {},
				view: function() {
					return m("div", "foo");
				}
			},
			"/bar": {
				controller: function() {},
				view: function() {
					return m("div", "bar");
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		var foo = root.childNodes[0].childNodes[0].nodeValue;
		m.route("/bar")
		mock.requestAnimationFrame.$resolve() //teardown
		var bar = root.childNodes[0].childNodes[0].nodeValue;
		return (foo === "foo" && bar === "bar")
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var unloaded = 0
		var config = function(el, init, ctx) {
			ctx.onunload = function() {
				unloaded++
			}
		}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function() {
					return m("div", m("a", {config: config}, "foo"));
				}
			},
			"/bar1": {
				controller: function() {},
				view: function() {
					return m("main", m("a", {config: config}, "foo"));
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/bar1")
		mock.requestAnimationFrame.$resolve() //teardown
		return unloaded == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var strategy
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {
					strategy = m.redraw.strategy()
					m.redraw.strategy("none")
				},
				view: function() {
					return m("div");
				}
			}
		})
		mock.requestAnimationFrame.$resolve() //teardown
		return strategy == "all" && root.childNodes.length == 0
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var strategy, count = 0
		var config = function(el, init) {if (!init) count++}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function() {
					return m("div", {config: config});
				}
			},
			"/bar1": {
				controller: function() {
					strategy = m.redraw.strategy()
					m.redraw.strategy("redraw")
				},
				view: function() {
					return m("div", {config: config});
				}
			},
		})
		mock.requestAnimationFrame.$resolve()
		m.route("/bar1")
		mock.requestAnimationFrame.$resolve() //teardown
		return strategy == "all" && count == 1
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var strategy
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {this.number = 1},
				view: function(ctrl) {
					return m("div", {onclick: function() {
						strategy = m.redraw.strategy()
						ctrl.number++
						m.redraw.strategy("none")
					}}, ctrl.number);
				}
			}
		})
		root.childNodes[0].onclick({})
		return strategy == "diff" && root.childNodes[0].childNodes[0].nodeValue == "1"
	})
	test(function() {
		mock.requestAnimationFrame.$resolve() //setup
		mock.location.search = "?"

		var root = mock.document.createElement("div")
		var count = 0
		var config = function(el, init ) {if (!init) count++}
		m.route.mode = "search"
		m.route(root, "/foo1", {
			"/foo1": {
				controller: function() {},
				view: function(ctrl) {
					return m("div", {config: config, onclick: function() {
						m.redraw.strategy("all")
					}});
				}
			}
		})
		root.childNodes[0].onclick({})
		mock.requestAnimationFrame.$resolve() //teardown
		return count == 2
	})
	//end m.route

	//m.prop
	test(function() {
		var prop = m.prop("test")
		return prop() === "test"
	})
	test(function() {
		var prop = m.prop("test")
		prop("foo")
		return prop() === "foo"
	})
	test(function() {
		var prop = m.prop("test")
		return JSON.stringify(prop) === '"test"'
	})
	test(function() {
		var obj = {prop: m.prop("test")}
		return JSON.stringify(obj) === '{"prop":"test"}'
	})
	test(function() {
		var defer = m.deferred()
		var prop = m.prop(defer.promise)
		defer.resolve("test")

		return prop() === "test"
	})
	test(function() {
		var defer = m.deferred()
		var prop = m.prop(defer.promise).then(function () {
			return "test2"
		})
		defer.resolve("test")

		return prop() === "test2"
	})

	//m.request
	test(function() {
		var prop = m.request({method: "GET", url: "test"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().method === "GET" && prop().url === "test"
	})
	test(function() {
		var prop = m.request({method: "GET", url: "test"}).then(function(value) {return "foo"})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop() === "foo"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80", data: {}}).then(function(value) {return value})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "http://domain.com:80"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80/:test1", data: {test1: "foo"}}).then(function(value) {return value})
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().url === "http://domain.com:80/foo"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "GET", url: "test", deserialize: function() {throw new Error("error occurred")}}).then(null, error)
		mock.XMLHttpRequest.$instances.pop().onreadystatechange()
		return prop().message === "error occurred" && error().message === "error occurred"
	})
	test(function() {
		var error = m.prop("no error"), exception
		var prop = m.request({method: "GET", url: "test", deserialize: function() {throw new TypeError("error occurred")}}).then(null, error)
		try {mock.XMLHttpRequest.$instances.pop().onreadystatechange()}
		catch (e) {exception = e}
		m.endComputation()
		return prop() === undefined && error() === "no error" && exception.message == "error occurred"
	})
	test(function() {
		var error = m.prop("no error")
		var prop = m.request({method: "POST", url: "test"}).then(null, error)
		var xhr = mock.XMLHttpRequest.$instances.pop()
		xhr.onreadystatechange()
		return xhr.$headers["Content-Type"] == "application/json; charset=utf-8"
	})

	//m.deferred
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(function(data) {value = data})
		deferred.resolve("test")
		return value === "test"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(function(data) {return "foo"}).then(function(data) {value = data})
		deferred.resolve("test")
		return value === "foo"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(null, function(data) {value = data})
		deferred.reject("test")
		return value === "test"
	})
	test(function() {
		var value
		var deferred = m.deferred()
		deferred.promise.then(null, function(data) {return "foo"}).then(function(data) {value = data})
		deferred.reject("test")
		return value === "foo"
	})
	test(function() {
		var value1, value2
		var deferred = m.deferred()
		deferred.promise.then(function(data) {throw new Error}).then(function(data) {value1 = 1}, function(data) {value2 = data})
		deferred.resolve("test")
		return value1 === undefined && value2 instanceof Error
	})
	test(function() {
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		var value1, value2
		deferred1.promise.then(function(data) {
			value1 = data
			return deferred2.promise
		}).then(function(data) {
			value2 = data
		})
		deferred1.resolve(1)
		deferred2.resolve(2)
		return value1 === 1 && value2 === 2
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.resolve(1)
		deferred.promise.then(function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.reject(1)
		deferred.promise.then(null, function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.resolve(1)
		deferred.resolve(2)
		deferred.promise.then(function(data) {
			value = data
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.promise.then(function(data) {
			value = data
		})
		deferred.resolve(1)
		deferred.resolve(2)
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value1, value2
		deferred.promise.then(function(data) {
			value1 = data
		}, function(data) {
			value2 = data
		})
		deferred.resolve(1)
		deferred.reject(2)
		return value1 === 1 && value2 === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value1, value2
		deferred.promise.then(function() {
			value1 = data
		}, function(data) {
			value2 = data
		})
		deferred.reject(1)
		deferred.resolve(2)
		return value1 === undefined && value2 === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/80
		var deferred = m.deferred(), value
		deferred.promise.then(null, function(data) {
			value = data
		})
		deferred.reject(1)
		deferred.reject(2)
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/85
		var deferred = m.deferred(), value
		deferred.resolve()
		deferred.promise.then(function(data) {
			value = 1
		})
		return value === 1
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/85
		var deferred = m.deferred(), value
		deferred.reject()
		deferred.promise.then(null, function(data) {
			value = 1
		})
		return value === 1
	})
	test(function() {
		var deferred = m.deferred(), value
		deferred.resolve(1)
		return deferred.promise() === 1
	})
	test(function() {
		var deferred = m.deferred(), value
		var promise = deferred.promise.then(function(data) {return data + 1})
		deferred.resolve(1)
		return promise() === 2
	})
	test(function() {
		var deferred = m.deferred(), value
		deferred.reject(1)
		return deferred.promise() === undefined
	})

	//m.sync
	test(function() {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		m.sync([deferred1.promise, deferred2.promise]).then(function(data) {value = data})
		deferred1.resolve("test")
		deferred2.resolve("foo")
		return value[0] === "test" && value[1] === "foo"
	})
	test(function() {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		m.sync([deferred1.promise, deferred2.promise]).then(function(data) {value = data})
		deferred2.resolve("foo")
		deferred1.resolve("test")
		return value[0] === "test" && value[1] === "foo"
	})
	test(function() {
		var value = 1
		m.sync([]).then(function() {value = 2})
		return value == 2
	})

	//m.startComputation/m.endComputation
	test(function() {
		mock.requestAnimationFrame.$resolve()

		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})

		mock.requestAnimationFrame.$resolve()

		m.startComputation()
		controller.value = "foo"
		m.endComputation()
		mock.requestAnimationFrame.$resolve()

		return root.childNodes[0].nodeValue === "foo"
	})

	//console.log presence
	test(function() {
		return m.deps.factory.toString().indexOf("console") < 0
	})

	// config context
	test(function() {
		var root = mock.document.createElement("div")

		var success = false;
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {ctx.data=1}}));
		m.render(root, m("div", {config: function(elem, isInitialized, ctx) {success = ctx.data===1}}));
		return success;
	})

	// more complex config context
	test(function() {
		var root = mock.document.createElement("div")

		var idx = 0;
		var success = true;
		var statefulConfig = function(elem, isInitialized, ctx) {ctx.data=idx++}
		var node = m("div", {config: statefulConfig});
		m.render(root, [node, node]);

		idx = 0;
		var checkConfig = function(elem, isInitialized, ctx) {
			success = success && (ctx.data === idx++)
		}
		node = m("div", {config: checkConfig});
		m.render(root, [node, node]);
		return success;
	})

}

//test reporting for saucelabs
if (typeof window != "undefined") {
	window.global_test_results = {
		tests: [],
		duration: 0,
		passed: 0,
		failed: 0
	};
}

//mock
testMithril(mock.window);

test.print(function(value) {console.log(value)})
