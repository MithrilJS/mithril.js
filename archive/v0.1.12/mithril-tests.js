Mithril = m = new function app(window) {
	var selectorCache = {}
	var type = {}.toString
	var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g, attrParser = /\[(.+?)(?:=("|'|)(.+?)\2)?\]/
	
	function m() {
		var args = arguments
		var hasAttrs = type.call(args[1]) == "[object Object]"
		var attrs = hasAttrs ? args[1] : {}
		var classAttrName = "class" in attrs ? "class" : "className"
		var cell = selectorCache[args[0]]
		if (cell === undefined) {
			selectorCache[args[0]] = cell = {tag: "div", attrs: {}}
			var match, classes = []
			while (match = parser.exec(args[0])) {
				if (match[1] == "") cell.tag = match[2]
				else if (match[1] == "#") cell.attrs.id = match[2]
				else if (match[1] == ".") classes.push(match[2])
				else if (match[3][0] == "[") {
					var pair = attrParser.exec(match[3])
					cell.attrs[pair[1]] = pair[3] || true
				}
			}
			if (classes.length > 0) cell.attrs[classAttrName] = classes.join(" ")
		}
		cell = clone(cell)
		cell.attrs = clone(cell.attrs)
		cell.children = hasAttrs ? args[2] : args[1]
		for (var attrName in attrs) {
			if (attrName == classAttrName) cell.attrs[attrName] = (cell.attrs[attrName] || "") + " " + attrs[attrName]
			else cell.attrs[attrName] = attrs[attrName]
		}
		return cell
	}
	function build(parentElement, parentTag, data, cached, shouldReattach, index, editable, namespace) {
		if (data === null || data === undefined) data = ""
		if (data.subtree === "retain") return
		
		var cachedType = type.call(cached), dataType = type.call(data)
		if (cachedType != dataType) {
			if (cached !== null && cached !== undefined) clear(cached.nodes)
			cached = new data.constructor
			cached.nodes = []
		}
		
		if (dataType == "[object Array]") {
			var nodes = [], intact = cached.length === data.length, subArrayCount = 0
			for (var i = 0, cacheCount = 0; i < data.length; i++) {
				var item = build(parentElement, null, data[i], cached[cacheCount], shouldReattach, index + subArrayCount || subArrayCount, editable, namespace)
				if (item === undefined) continue
				if (!item.nodes.intact) intact = false
				subArrayCount += item instanceof Array ? item.length : 1
				cached[cacheCount++] = item
			}
			if (!intact) {
				for (var i = 0; i < data.length; i++) if (cached[i] !== undefined) nodes = nodes.concat(cached[i].nodes)
				for (var i = nodes.length, node; node = cached.nodes[i]; i++) if (node.parentNode !== null) node.parentNode.removeChild(node)
				for (var i = cached.nodes.length, node; node = nodes[i]; i++) if (node.parentNode === null) parentElement.appendChild(node)
				if (data.length < cached.length) cached.length = data.length
				cached.nodes = nodes
			}
		}
		else if (dataType == "[object Object]") {
			if (data.tag != cached.tag || Object.keys(data.attrs).join() != Object.keys(cached.attrs).join() || data.attrs.id != cached.attrs.id) clear(cached.nodes)
			if (typeof data.tag != "string") return
			
			var node, isNew = cached.nodes.length === 0
			if (data.tag === "svg") namespace = "http://www.w3.org/2000/svg"
			if (isNew) {
				node = namespace === undefined ? window.document.createElement(data.tag) : window.document.createElementNS(namespace, data.tag)
				cached = {
					tag: data.tag,
					attrs: setAttributes(node, data.tag, data.attrs, {}, namespace),
					children: build(node, data.tag, data.children, cached.children, true, 0, data.attrs.contenteditable ? node : editable, namespace),
					nodes: [node]
				}
				parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			else {
				node = cached.nodes[0]
				setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
				cached.children = build(node, data.tag, data.children, cached.children, false, 0, data.attrs.contenteditable ? node : editable, namespace)
				cached.nodes.intact = true
				if (shouldReattach === true) parentElement.insertBefore(node, parentElement.childNodes[index] || null)
			}
			if (type.call(data.attrs["config"]) == "[object Function]") data.attrs["config"](node, !isNew)
		}
		else {
			var node
			if (cached.nodes.length === 0) {
				if (data.$trusted) {
					node = injectHTML(parentElement, index, data)
				}
				else {
					node = window.document.createTextNode(data)
					parentElement.insertBefore(node, parentElement.childNodes[index] || null)
				}
				cached = "string number boolean".indexOf(typeof data) > -1 ? new data.constructor(data) : data
				cached.nodes = [node]
			}
			else if (cached.valueOf() !== data.valueOf() || shouldReattach === true) {
				if (!editable || editable !== window.document.activeElement) {
					if (data.$trusted) {
						var current = cached.nodes[0], nodes = [current]
						if (current) {
							while (current = current.nextSibling) nodes.push(current)
							clear(nodes)
							node = injectHTML(parentElement, index, data)
						}
						else parentElement.innerHTML = data
					}
					else {
						node = cached.nodes[0]
						if (parentTag === "textarea") parentElement.value = data
						else if (editable) editable.innerHTML = data
						else {
							parentElement.insertBefore(node, parentElement.childNodes[index] || null)
							node.nodeValue = data
						}
					}
				}
				cached = new data.constructor(data)
				cached.nodes = [node]
			}
			else cached.nodes.intact = true
		}
		
		return cached
	}
	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			var dataAttr = dataAttrs[attrName]
			var cachedAttr = cachedAttrs[attrName]
			if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr) || node === window.document.activeElement) {
				cachedAttrs[attrName] = dataAttr
				if (attrName === "config") continue
				else if (typeof dataAttr == "function" && attrName.indexOf("on") == 0) {
					node[attrName] = autoredraw(dataAttr, node)
				}
				else if (attrName === "style") {
					for (var rule in dataAttr) {
						if (cachedAttr === undefined || cachedAttr[rule] !== dataAttr[rule]) node.style[rule] = dataAttr[rule]
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
				else if (attrName in node && attrName != "list") node[attrName] = dataAttr
				else node.setAttribute(attrName, dataAttr)
			}
		}
		return cachedAttrs
	}
	function clear(nodes) {
		for (var i = nodes.length - 1; i > -1; i--) nodes[i].parentNode.removeChild(nodes[i])
		nodes.length = 0
	}
	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index]
		if (nextSibling) nextSibling.insertAdjacentHTML("beforebegin", data)
		else parentElement.insertAdjacentHTML("beforeend", data)
		return nextSibling ? nextSibling.previousSibling : parentElement.firstChild
	}
	function clone(object) {
		var result = {}
		for (var prop in object) result[prop] = object[prop]
		return result
	}
	function autoredraw(callback, object) {
		return function(e) {
			m.startComputation()
			try {return callback.call(object, e)}
			finally {m.endComputation()}
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
			if (window.document.documentElement !== html) {
				window.document.replaceChild(html, window.document.documentElement)
			}
		},
		insertBefore: function(node) {
			this.appendChild(node)
		},
		childNodes: []
	}
	var nodeCache = [], cellCache = {}
	m.render = function(root, cell) {
		var index = nodeCache.indexOf(root)
		var id = index < 0 ? nodeCache.push(root) - 1 : index
		var node = root == window.document || root == window.document.documentElement ? documentNode : root
		cellCache[id] = build(node, null, cell, cellCache[id], false, 0, null, undefined)
	}
	
	m.trust = function(value) {
		value = new String(value)
		value.$trusted = true
		return value
	}
	
	var roots = [], modules = [], controllers = [], now = 0, lastRedraw = 0, lastRedrawId = 0, computePostRedrawHook = null
	m.module = function(root, module) {
		m.startComputation()
		var index = roots.indexOf(root)
		if (index < 0) index = roots.length
		roots[index] = root
		modules[index] = module
		controllers[index] = new module.controller
		m.endComputation()
	}
	m.redraw = function() {
		now = window.performance && window.performance.now ? window.performance.now() : new window.Date().getTime()
		if (now - lastRedraw > 16) redraw()
		else {
			var cancel = window.cancelAnimationFrame || window.clearTimeout
			var defer = window.requestAnimationFrame || window.setTimeout
			cancel(lastRedrawId)
			lastRedrawId = defer(redraw, 0)
		}
	}
	function redraw() {
		for (var i = 0; i < roots.length; i++) {
			m.render(roots[i], modules[i].view(controllers[i]))
		}
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}
		lastRedraw = now
	}
	
	var pendingRequests = 0
	m.startComputation = function() {pendingRequests++}
	m.endComputation = function() {
		pendingRequests = Math.max(pendingRequests - 1, 0)
		if (pendingRequests == 0) m.redraw()
	}
	
	m.withAttr = function(prop, withAttrCallback) {
		return function(e) {withAttrCallback(prop in e.currentTarget ? e.currentTarget[prop] : e.currentTarget.getAttribute(prop))}
	}
	
	//routing
	var modes = {pathname: "", hash: "#", search: "?"}
	var redirect = function() {}, routeParams = {}, currentRoute
	m.route = function() {
		if (arguments.length === 0) return currentRoute
		else if (arguments.length === 3) {
			currentRoute = window.location[m.route.mode].slice(modes[m.route.mode].length)
			var root = arguments[0], defaultRoute = arguments[1], router = arguments[2]
			redirect = function(source) {
				var path = source.slice(modes[m.route.mode].length)
				if (!routeByValue(root, router, path)) {
					m.route(defaultRoute, true)
				}
			}
			var listener = m.route.mode == "hash" ? "onhashchange" : "onpopstate"
			window[listener] = function() {
				redirect(window.location[m.route.mode])
			}
			computePostRedrawHook = scrollToHash
			window[listener]()
		}
		else if (arguments[0].addEventListener) {
			var element = arguments[0]
			var isInitialized = arguments[1]
			if (element.href.indexOf(modes[m.route.mode]) < 0) {
				element.href = location.pathname + modes[m.route.mode] + element.pathname
			}
			if (!isInitialized) {
				element.removeEventListener("click", routeUnobtrusive)
				element.addEventListener("click", routeUnobtrusive)
			}
		}
		else if (typeof arguments[0] == "string") {
			currentRoute = arguments[0]
			var shouldReplaceHistoryEntry = arguments[1] === true
			if (window.history.pushState) {
				computePostRedrawHook = function() {
					window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, window.document.title, modes[m.route.mode] + currentRoute)
					scrollToHash()
				}
				redirect(modes[m.route.mode] + currentRoute)
			}
			else window.location[m.route.mode] = currentRoute
		}
	}
	m.route.param = function(key) {return routeParams[key]}
	m.route.mode = "search"
	function routeByValue(root, router, path) {
		routeParams = {}
		for (var route in router) {
			if (route == path) return !void m.module(root, router[route])
			
			var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "$")
			
			if (matcher.test(path)) {
				return !void path.replace(matcher, function() {
					var keys = route.match(/:[^\/]+/g)
					var values = [].slice.call(arguments, 1, -2)
					for (var i = 0; i < keys.length; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
					m.module(root, router[route])
				})
			}
		}
	}
	function routeUnobtrusive(e) {
		if (e.ctrlKey || e.metaKey || e.which == 2) return
		e.preventDefault()
		m.route(e.currentTarget[m.route.mode].slice(modes[m.route.mode].length))
	}
	function scrollToHash() {
		if (m.route.mode != "hash" && window.location.hash) window.location.hash = window.location.hash
	}
	
	//model
	m.prop = function(store) {
		var prop = function() {
			if (arguments.length) store = arguments[0]
			return store
		}
		prop.toJSON = function() {
			return store
		}
		return prop
	}

	m.deferred = function() {
		var resolvers = [], rejecters = []
		var object = {
			resolve: function(value) {
				for (var i = 0; i < resolvers.length; i++) resolvers[i](value)
			},
			reject: function(value) {
				for (var i = 0; i < rejecters.length; i++) rejecters[i](value)
			},
			promise: m.prop()
		}
		object.promise.resolvers = resolvers
		object.promise.then = function(success, error) {
			var next = m.deferred()
			if (!success) success = identity
			if (!error) error = identity
			function push(list, method, callback) {
				list.push(function(value) {
					try {
						var result = callback(value)
						if (result && typeof result.then == "function") result.then(next[method], error)
						else next[method](result !== undefined ? result : value)
					}
					catch (e) {
						if (e instanceof Error && e.constructor !== Error) throw e
						else next.reject(e)
					}
				})
			}
			push(resolvers, "resolve", success)
			push(rejecters, "reject", error)
			return next.promise
		}
		return object
	}
	m.sync = function(args) {
		var method = "resolve"
		function synchronizer(resolved) {
			return function(value) {
				results.push(value)
				if (!resolved) method = "reject"
				if (results.length == args.length) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}
		
		var deferred = m.deferred()
		var results = []
		for (var i = 0; i < args.length; i++) {
			args[i].then(synchronizer(true), synchronizer(false))
		}
		return deferred.promise
	}
	function identity(value) {return value}

	function ajax(options) {
		var xhr = window.XDomainRequest ? new window.XDomainRequest : new window.XMLHttpRequest
		xhr.open(options.method, options.url, true, options.user, options.password)
		xhr.onload = typeof options.onload == "function" ? options.onload : function() {}
		xhr.onerror = typeof options.onerror == "function" ? options.onerror : function() {}
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4 && xhr.status === 0) {
				xhr.onerror({type: "error", target: xhr})
			}
		}
		if (typeof options.config == "function") options.config(xhr, options)
		xhr.send(options.data)
		return xhr
	}
	function querystring(object, prefix) {
		var str = []
		for(var prop in object) {
			var key = prefix ? prefix + "[" + prop + "]" : prop, value = object[prop]
			str.push(typeof value == "object" ? querystring(value, key) : encodeURIComponent(key) + "=" + encodeURIComponent(value))
		}
		return str.join("&")
	}
	function bindData(xhrOptions, data, serialize) {
		if (data && Object.keys(data).length > 0) {
			if (xhrOptions.method == "GET") {
				xhrOptions.url = xhrOptions.url + (xhrOptions.url.indexOf("?") < 0 ? "?" : "&") + querystring(data)
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
		var serialize = xhrOptions.serialize || JSON.stringify
		var deserialize = xhrOptions.deserialize || JSON.parse
		var extract = xhrOptions.extract || function(xhr) {
			return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
		}
		xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data)
		xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize)
		xhrOptions.onload = xhrOptions.onerror = function(e) {
			var unwrap = (e.type == "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity
			var response = unwrap(deserialize(extract(e.target, xhrOptions)))
			if (response instanceof Array && xhrOptions.type) {
				for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
			}
			else if (xhrOptions.type) response = new xhrOptions.type(response)
			deferred.promise(response)
			deferred[e.type == "load" ? "resolve" : "reject"](response)
			if (xhrOptions.background !== true) m.endComputation()
		}
		ajax(xhrOptions)
		deferred.promise.then = propBinder(deferred.promise)
		return deferred.promise
	}
	function propBinder(promise) {
		var bind = promise.then
		return function(success, error) {
			var next = bind(function(value) {return next(success(value))}, function(value) {return next(error(value))})
			next.then = propBinder(next)
			return next
		}
	}
	
	//testing API
	m.deps = function(mock) {return window = mock}
	//for internal testing only, do not use `m.deps.factory`
	m.deps.factory = app
	
	return m
}(this)

if (typeof module != "undefined" && module !== null) module.exports = m
if (typeof define == "function" && define.amd) define(function() {return m})

function test(condition) {
	try {if (!condition()) throw new Error}
	catch (e) {console.error(e);test.failures.push(condition)}
	test.total++
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
			childNodes: [],
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
					this.childNodes.splice(referenceIndex, index < 0 ? 0 : 1, node)
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
	window.performance = new function () {
		var timestamp = 50
		this.$elapse = function(amount) {timestamp += amount}
		this.now = function() {return timestamp}
	}
	window.cancelAnimationFrame = function() {}
	window.requestAnimationFrame = function(callback) {window.requestAnimationFrame.$callback = callback}
	window.requestAnimationFrame.$resolve = function() {
		if (window.requestAnimationFrame.$callback) window.requestAnimationFrame.$callback()
		window.requestAnimationFrame.$callback = null
		window.performance.$elapse(20)
	}
	window.XMLHttpRequest = new function() {
		var request = function() {
			this.open = function(method, url) {
				this.method = method
				this.url = url
			}
			this.send = function() {
				this.responseText = JSON.stringify(this)
				request.$events.push({type: "load", target: this})
			}
		}
		request.$events = []
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
	test(function() {return m("div", m("div")).attrs.tag === "div"}) //yes, this is expected behavior: see method signature
	test(function() {return m("div", [undefined]).tag === "div"})
	test(function() {return m("div", [{foo: "bar"}])}) //as long as it doesn't throw errors, it's fine
	test(function() {return m("svg", [m("g")])})
	test(function() {return m("svg", [m("a[href='http://google.com']")])})

	//m.module
	test(function() {
		mock.performance.$elapse(50)
		
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
		return root.childNodes[0].childNodes[1].nodeValue === ""
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
	//end m.render
	
	//m.redraw
	test(function() {
		mock.performance.$elapse(50) //setup
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		controller.value = "foo"
		m.redraw()
		var valueBefore = root.childNodes[0].nodeValue
		mock.performance.$elapse(50)
		m.redraw()
		mock.performance.$elapse(50) //teardown
		return valueBefore === "" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		var count = 0
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {},
			view: function(ctrl) {
				count++
			}
		})
		m.redraw()
		m.redraw()
		m.redraw()
		mock.performance.$elapse(50)
		m.redraw()
		mock.performance.$elapse(50) //teardown
		return count === 2
	})

	//m.route
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test1", {
			"/test1": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test1" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.pathname = "/"
		
		var root = mock.document.createElement("div")
		m.route.mode = "pathname"
		m.route(root, "/test2", {
			"/test2": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.pathname == "/test2" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.hash = "#"
		
		var root = mock.document.createElement("div")
		m.route.mode = "hash"
		m.route(root, "/test3", {
			"/test3": {controller: function() {}, view: function() {return "foo"}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.hash == "#/test3" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test4/foo", {
			"/test4/:test": {controller: function() {}, view: function() {return m.route.param("test")}}
		})
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test4/foo" && root.childNodes[0].nodeValue === "foo"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("test")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test5/foo", {
			"/": module,
			"/test5/:test": module
		})
		var paramValueBefore = m.route.param("test")
		mock.performance.$elapse(50)
		m.route("/")
		var paramValueAfter = m.route.param("test")
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test6/foo", {
			"/": module,
			"/test6/:a1": module
		})
		var paramValueBefore = m.route.param("a1")
		mock.performance.$elapse(50)
		m.route("/")
		var paramValueAfter = m.route.param("a1")
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/" && paramValueBefore === "foo" && paramValueAfter === undefined
	})
	test(function() {
		//https://github.com/lhorie/mithril.js/issues/61
		mock.performance.$elapse(50) //setup
		mock.location.search = "?"
		
		var module = {controller: function() {}, view: function() {return m.route.param("a1")}}
		
		var root = mock.document.createElement("div")
		m.route.mode = "search"
		m.route(root, "/test7/foo", {
			"/": module,
			"/test7/:a1": module
		})
		var routeValueBefore = m.route()
		mock.performance.$elapse(50)
		m.route("/")
		var routeValueAfter = m.route()
		mock.performance.$elapse(50) //teardown
		return routeValueBefore === "/test7/foo" && routeValueAfter === "/"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
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
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test8/foo/SEP/bar/baz" && root.childNodes[0].nodeValue === "foo_bar/baz"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
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
		mock.performance.$elapse(50) //teardown
		return mock.location.search == "?/test9/foo/bar/SEP/baz" && root.childNodes[0].nodeValue === "foo/bar_baz"
	})
	test(function() {
		mock.performance.$elapse(50) //setup
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
		mock.performance.$elapse(50) //teardown
		return root.childNodes[0].nodeValue === "foo bar"
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

	//m.request
	test(function() {
		var prop = m.request({method: "GET", url: "test"})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop().method === "GET" && prop().url === "test"
	})
	test(function() {
		var prop = m.request({method: "GET", url: "test"}).then(function(value) {return "foo"})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop() === "foo"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80", data: {}}).then(function(value) {return value})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop().url === "http://domain.com:80"
	})
	test(function() {
		var prop = m.request({method: "POST", url: "http://domain.com:80/:test1", data: {test1: "foo"}}).then(function(value) {return value})
		var e = mock.XMLHttpRequest.$events.pop()
		e.target.onload(e)
		return prop().url === "http://domain.com:80/foo"
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
		deferred.promise.then(null, function(data) {return "foo"}).then(null, function(data) {value = data})
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

	//m.startComputation/m.endComputation
	test(function() {
		mock.performance.$elapse(50)
		
		var controller
		var root = mock.document.createElement("div")
		m.module(root, {
			controller: function() {controller = this},
			view: function(ctrl) {return ctrl.value}
		})
		
		mock.performance.$elapse(50)
		
		m.startComputation()
		controller.value = "foo"
		m.endComputation()
		return root.childNodes[0].nodeValue === "foo"
	})
	
	//console.log presence
	test(function() {
		return m.deps.factory.toString().indexOf("console") < 0
	})
}

//mocks
testMithril(mock.window)

test.print(console.log)