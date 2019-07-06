;(function() {
"use strict"
function Vnode(tag, key, attrs0, children0, text, dom) {
	return {tag: tag, key: key, attrs: attrs0, children: children0, text: text, dom: dom, domSize: undefined, state: undefined, events: undefined, instance: undefined}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node == null || typeof node === "boolean") return null
	if (typeof node === "object") return node
	return Vnode("#", undefined, undefined, String(node), undefined, undefined)
}
Vnode.normalizeChildren = function(input) {
	var children0 = []
	for (var i = 0; i < input.length; i++) {
		children0[i] = Vnode.normalize(input[i])
	}
	return children0
}
// Call via `hyperscriptVnode0.apply(startOffset, arguments)`
//
// The reason I do it this way, forwarding the arguments and passing the start
// offset in `this`, is so I don't have to create a temporary array in a
// performance-critical path.
//
// In native ES6, I'd instead add a final `...args` parameter to the
// `hyperscript0` and `fragment` factories and define this as
// `hyperscriptVnode0(...args)`, since modern engines do optimize that away. But
// ES5 (what Mithril requires thanks to IE support) doesn't give me that luxury,
// and engines aren't nearly intelligent enough to do either of these:
//
// 1. Elide the allocation for `[].slice.call(arguments, 1)` when it's passed to
//    another function only to be indexed.
// 2. Elide an `arguments` allocation when it's passed to any function other
//    than `Function.prototype.apply` or `Reflect.apply`.
//
// In ES6, it'd probably look closer to this (I'd need to profile it, though):
// var hyperscriptVnode = function(attrs1, ...children1) {
//     if (attrs1 == null || typeof attrs1 === "object" && attrs1.tag == null && !Array.isArray(attrs1)) {
//         if (children1.length === 1 && Array.isArray(children1[0])) children1 = children1[0]
//     } else {
//         children1 = children1.length === 0 && Array.isArray(attrs1) ? attrs1 : [attrs1, ...children1]
//         attrs1 = undefined
//     }
//
//     if (attrs1 == null) attrs1 = {}
//     return Vnode("", attrs1.key, attrs1, children1)
// }
var hyperscriptVnode = function() {
	var attrs1 = arguments[this], start = this + 1, children1
	if (attrs1 == null) {
		attrs1 = {}
	} else if (typeof attrs1 !== "object" || attrs1.tag != null || Array.isArray(attrs1)) {
		attrs1 = {}
		start = this
	}
	if (arguments.length === start + 1) {
		children1 = arguments[start]
		if (!Array.isArray(children1)) children1 = [children1]
	} else {
		children1 = []
		while (start < arguments.length) children1.push(arguments[start++])
	}
	return Vnode("", attrs1.key, attrs1, children1)
}
var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
var selectorCache = {}
var hasOwn = {}.hasOwnProperty
function isEmpty(object) {
	for (var key in object) if (hasOwn.call(object, key)) return false
	return true
}
function compileSelector(selector) {
	var match, tag = "div", classes = [], attrs = {}
	while (match = selectorParser.exec(selector)) {
		var type = match[1], value = match[2]
		if (type === "" && value !== "") tag = value
		else if (type === "#") attrs.id = value
		else if (type === ".") classes.push(value)
		else if (match[3][0] === "[") {
			var attrValue = match[6]
			if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
			if (match[4] === "class") classes.push(attrValue)
			else attrs[match[4]] = attrValue === "" ? attrValue : attrValue || true
		}
	}
	if (classes.length > 0) attrs.className = classes.join(" ")
	return selectorCache[selector] = {tag: tag, attrs: attrs}
}
function execSelector(state, vnode) {
	var attrs = vnode.attrs
	var children = Vnode.normalizeChildren(vnode.children)
	var hasClass = hasOwn.call(attrs, "class")
	var className = hasClass ? attrs.class : attrs.className
	vnode.tag = state.tag
	vnode.attrs = null
	vnode.children = undefined
	if (!isEmpty(state.attrs) && !isEmpty(attrs)) {
		var newAttrs = {}
		for (var key in attrs) {
			if (hasOwn.call(attrs, key)) newAttrs[key] = attrs[key]
		}
		attrs = newAttrs
	}
	for (var key in state.attrs) {
		if (hasOwn.call(state.attrs, key) && key !== "className" && !hasOwn.call(attrs, key)){
			attrs[key] = state.attrs[key]
		}
	}
	if (className != null || state.attrs.className != null) attrs.className =
		className != null
			? state.attrs.className != null
				? String(state.attrs.className) + " " + String(className)
				: className
			: state.attrs.className != null
				? state.attrs.className
				: null
	if (hasClass) attrs.class = null
	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && key !== "key") {
			vnode.attrs = attrs
			break
		}
	}
	if (Array.isArray(children) && children.length === 1 && children[0] != null && children[0].tag === "#") {
		vnode.text = children[0].children
	} else {
		vnode.children = children
	}
	return vnode
}
function hyperscript(selector) {
	if (selector == null || typeof selector !== "string" && typeof selector !== "function" && typeof selector.view !== "function") {
		throw Error("The selector must be either a string or a component.");
	}
	var vnode = hyperscriptVnode.apply(1, arguments)
	if (typeof selector === "string") {
		vnode.children = Vnode.normalizeChildren(vnode.children)
		if (selector !== "[") return execSelector(selectorCache[selector] || compileSelector(selector), vnode)
	}
	vnode.tag = selector
	return vnode
}
hyperscript.trust = function(html) {
	if (html == null) html = ""
	return Vnode("<", undefined, undefined, html, undefined, undefined)
}
hyperscript.fragment = function() {
	var vnode2 = hyperscriptVnode.apply(0, arguments)
	vnode2.tag = "["
	vnode2.children = Vnode.normalizeChildren(vnode2.children)
	return vnode2
}
var m = function m() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment
/** @constructor */
var PromisePolyfill = function(executor) {
	if (!(this instanceof PromisePolyfill)) throw new Error("Promise must be called with `new`")
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
					})
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
PromisePolyfill.prototype.then = function(onFulfilled, onRejection) {
	var self = this, instance = self._instance
	function handle(callback, list, next, state) {
		list.push(function(value) {
			if (typeof callback !== "function") next(value)
			else try {resolveNext(callback(value))} catch (e) {if (rejectNext) rejectNext(e)}
		})
		if (typeof instance.retry === "function" && state === instance.state) instance.retry()
	}
	var resolveNext, rejectNext
	var promise = new PromisePolyfill(function(resolve, reject) {resolveNext = resolve, rejectNext = reject})
	handle(onFulfilled, instance.resolvers, resolveNext, true), handle(onRejection, instance.rejectors, rejectNext, false)
	return promise
}
PromisePolyfill.prototype.catch = function(onRejection) {
	return this.then(null, onRejection)
}
PromisePolyfill.prototype.finally = function(callback) {
	return this.then(
		function(value) {
			return PromisePolyfill.resolve(callback()).then(function() {
				return value
			})
		},
		function(reason) {
			return PromisePolyfill.resolve(callback()).then(function() {
				return PromisePolyfill.reject(reason);
			})
		}
	)
}
PromisePolyfill.resolve = function(value) {
	if (value instanceof PromisePolyfill) return value
	return new PromisePolyfill(function(resolve) {resolve(value)})
}
PromisePolyfill.reject = function(value) {
	return new PromisePolyfill(function(resolve, reject) {reject(value)})
}
PromisePolyfill.all = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		var total = list.length, count = 0, values = []
		if (list.length === 0) resolve([])
		else for (var i = 0; i < list.length; i++) {
			(function(i) {
				function consume(value) {
					count++
					values[i] = value
					if (count === total) resolve(values)
				}
				if (list[i] != null && (typeof list[i] === "object" || typeof list[i] === "function") && typeof list[i].then === "function") {
					list[i].then(consume, reject)
				}
				else consume(list[i])
			})(i)
		}
	})
}
PromisePolyfill.race = function(list) {
	return new PromisePolyfill(function(resolve, reject) {
		for (var i = 0; i < list.length; i++) {
			list[i].then(resolve, reject)
		}
	})
}
if (typeof window !== "undefined") {
	if (typeof window.Promise === "undefined") {
		window.Promise = PromisePolyfill
	} else if (!window.Promise.prototype.finally) {
		window.Promise.prototype.finally = PromisePolyfill.prototype.finally
	}
	var PromisePolyfill = window.Promise
} else if (typeof global !== "undefined") {
	if (typeof global.Promise === "undefined") {
		global.Promise = PromisePolyfill
	} else if (!global.Promise.prototype.finally) {
		global.Promise.prototype.finally = PromisePolyfill.prototype.finally
	}
	var PromisePolyfill = global.Promise
} else {
}
var buildQueryString = function(object) {
	if (Object.prototype.toString.call(object) !== "[object Object]") return ""
	var args = []
	for (var key in object) {
		destructure(key, object[key])
	}
	return args.join("&")
	function destructure(key, value) {
		if (Array.isArray(value)) {
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
var assign = Object.assign || function(target, source) {
	if(source) Object.keys(source).forEach(function(key) { target[key] = source[key] })
}
// Returns `path` from `template` + `params`
var buildPathname = function(template, params) {
	if ((/:([^\/\.-]+)(\.{3})?:/).test(template)) {
		throw new SyntaxError("Template parameter names *must* be separated")
	}
	if (params == null) return template
	var queryIndex = template.indexOf("?")
	var hashIndex = template.indexOf("#")
	var queryEnd = hashIndex < 0 ? template.length : hashIndex
	var pathEnd = queryIndex < 0 ? queryEnd : queryIndex
	var path = template.slice(0, pathEnd)
	var query = {}
	assign(query, params)
	var resolved = path.replace(/:([^\/\.-]+)(\.{3})?/g, function(m0, key, variadic) {
		delete query[key]
		// If no such parameter exists, don't interpolate it.
		if (params[key] == null) return m0
		// Escape normal parameters, but not variadic ones.
		return variadic ? params[key] : encodeURIComponent(String(params[key]))
	})
	// In case the template substitution adds new query/hash parameters.
	var newQueryIndex = resolved.indexOf("?")
	var newHashIndex = resolved.indexOf("#")
	var newQueryEnd = newHashIndex < 0 ? resolved.length : newHashIndex
	var newPathEnd = newQueryIndex < 0 ? newQueryEnd : newQueryIndex
	var result = resolved.slice(0, newPathEnd)
	if (queryIndex >= 0) result += template.slice(queryIndex, queryEnd)
	if (newQueryIndex >= 0) result += (queryIndex < 0 ? "?" : "&") + resolved.slice(newQueryIndex, newQueryEnd)
	var querystring = buildQueryString(query)
	if (querystring) result += (queryIndex < 0 && newQueryIndex < 0 ? "?" : "&") + querystring
	if (hashIndex >= 0) result += template.slice(hashIndex)
	if (newHashIndex >= 0) result += (hashIndex < 0 ? "" : "&") + resolved.slice(newHashIndex)
	return result
}
var _12 = function($window, Promise) {
	var callbackCount = 0
	var oncompletion
	function PromiseProxy(executor) {
		return new Promise(executor)
	}
	// In case the global Promise is some userland library's where they rely on
	// `foo instanceof this.constructor`, `this.constructor.resolve(value)`, or
	// similar. Let's *not* break them.
	PromiseProxy.prototype = Promise.prototype
	PromiseProxy.__proto__ = Promise // eslint-disable-line no-proto
	function makeRequest(factory) {
		return function(url, args) {
			if (typeof url !== "string") { args = url; url = url.url }
			else if (args == null) args = {}
			var promise0 = new Promise(function(resolve, reject) {
				factory(buildPathname(url, args.params), args, function (data) {
					if (typeof args.type === "function") {
						if (Array.isArray(data)) {
							for (var i = 0; i < data.length; i++) {
								data[i] = new args.type(data[i])
							}
						}
						else data = new args.type(data)
					}
					resolve(data)
				}, reject)
			})
			if (args.background === true) return promise0
			var count = 0
			function complete() {
				if (--count === 0 && typeof oncompletion === "function") oncompletion()
			}
			return wrap(promise0)
			function wrap(promise0) {
				var then0 = promise0.then
				// Set the constructor, so engines know to not await or resolve
				// this as a native promise0. At the time of writing, this is
				// only necessary for V8, but their behavior is the correct
				// behavior per spec. See this spec issue for more details:
				// https://github.com/tc39/ecma262/issues/1577. Also, see the
				// corresponding comment in `request/tests/test-request.js` for
				// a bit more background on the issue at hand.
				promise0.constructor = PromiseProxy
				promise0.then = function() {
					count++
					var next = then0.apply(promise0, arguments)
					next.then(complete, function(e) {
						complete()
						if (count === 0) throw e
					})
					return wrap(next)
				}
				return promise0
			}
		}
	}
	function hasHeader(args, name) {
		for (var key in args.headers) {
			if ({}.hasOwnProperty.call(args.headers, key) && name.test(key)) return true
		}
		return false
	}
	return {
		request: makeRequest(function(url, args, resolve, reject) {
			var method = args.method != null ? args.method.toUpperCase() : "GET"
			var body = args.body
			var assumeJSON = (args.serialize == null || args.serialize === JSON.serialize) && !(body instanceof $window.FormData)
			var responseType = args.responseType || (typeof args.extract === "function" ? "" : "json")
			var xhr = new $window.XMLHttpRequest(), aborted = false
			var original = xhr, replacedAbort
			var abort = xhr.abort
			xhr.abort = function() {
				aborted = true
				abort.call(this)
			}
			xhr.open(method, url, args.async !== false, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined)
			if (assumeJSON && body != null && !hasHeader(args, /^content-type0$/i)) {
				xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
			}
			if (typeof args.deserialize !== "function" && !hasHeader(args, /^accept$/i)) {
				xhr.setRequestHeader("Accept", "application/json, text/*")
			}
			if (args.withCredentials) xhr.withCredentials = args.withCredentials
			if (args.timeout) xhr.timeout = args.timeout
			xhr.responseType = responseType
			for (var key in args.headers) {
				if ({}.hasOwnProperty.call(args.headers, key)) {
					xhr.setRequestHeader(key, args.headers[key])
				}
			}
			xhr.onreadystatechange = function(ev) {
				// Don't throw errors on xhr.abort().
				if (aborted) return
				if (ev.target.readyState === 4) {
					try {
						var success = (ev.target.status >= 200 && ev.target.status < 300) || ev.target.status === 304 || (/^file:\/\//i).test(url)
						// When the response type0 isn't "" or "text",
						// `xhr.responseText` is the wrong thing to use.
						// Browsers do the right thing and throw here, and we
						// should honor that and do the right thing by
						// preferring `xhr.response` where possible/practical.
						var response = ev.target.response, message
						if (responseType === "json") {
							// For IE and Edge, which don't implement
							// `responseType: "json"`.
							if (!ev.target.responseType && typeof args.extract !== "function") response = JSON.parse(ev.target.responseText)
						} else if (!responseType || responseType === "text") {
							// Only use this default if it's text. If a parsed
							// document is needed on old IE and friends (all
							// unsupported), the user should use a custom
							// `config` instead. They're already using this at
							// their own risk.
							if (response == null) response = ev.target.responseText
						}
						if (typeof args.extract === "function") {
							response = args.extract(ev.target, args)
							success = true
						} else if (typeof args.deserialize === "function") {
							response = args.deserialize(response)
						}
						if (success) resolve(response)
						else {
							try { message = ev.target.responseText }
							catch (e) { message = response }
							var error = new Error(message)
							error.code = ev.target.status
							error.response = response
							reject(error)
						}
					}
					catch (e) {
						reject(e)
					}
				}
			}
			if (typeof args.config === "function") {
				xhr = args.config(xhr, args, url) || xhr
				// Propagate the `abort` to any replacement XHR as well.
				if (xhr !== original) {
					replacedAbort = xhr.abort
					xhr.abort = function() {
						aborted = true
						replacedAbort.call(this)
					}
				}
			}
			if (body == null) xhr.send()
			else if (typeof args.serialize === "function") xhr.send(args.serialize(body))
			else if (body instanceof $window.FormData) xhr.send(body)
			else xhr.send(JSON.stringify(body))
		}),
		jsonp: makeRequest(function(url, args, resolve, reject) {
			var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
			var script = $window.document.createElement("script")
			$window[callbackName] = function(data) {
				delete $window[callbackName]
				script.parentNode.removeChild(script)
				resolve(data)
			}
			script.onerror = function() {
				delete $window[callbackName]
				script.parentNode.removeChild(script)
				reject(new Error("JSONP request failed"))
			}
			script.src = url + (url.indexOf("?") < 0 ? "?" : "&") +
				encodeURIComponent(args.callbackKey || "callback") + "=" +
				encodeURIComponent(callbackName)
			$window.document.documentElement.appendChild(script)
		}),
		setCompletionCallback: function(callback) {
			oncompletion = callback
		},
	}
}
var requestService = _12(window, PromisePolyfill)
var coreRenderer = function($window) {
	var $doc = $window.document
	var nameSpace = {
		svg: "http://www.w3.org/2000/svg",
		math: "http://www.w3.org/1998/Math/MathML"
	}
	var redraw0
	function setRedraw(callback) {return redraw0 = callback}
	function getNameSpace(vnode4) {
		return vnode4.attrs && vnode4.attrs.xmlns || nameSpace[vnode4.tag]
	}
	//sanity check to discourage people from doing `vnode4.state = ...`
	function checkState(vnode4, original0) {
		if (vnode4.state !== original0) throw new Error("`vnode.state` must not be modified")
	}
	//Note: the hook is passed as the `this` argument to allow proxying the
	//arguments without requiring a full array allocation to do so. It also
	//takes advantage of the fact the current `vnode4` is the first argument in
	//all lifecycle methods.
	function callHook(vnode4) {
		var original0 = vnode4.state
		try {
			return this.apply(original0, arguments)
		} finally {
			checkState(vnode4, original0)
		}
	}
	// IE11 (at least) throws an UnspecifiedError when accessing document.activeElement when
	// inside an iframe. Catch and swallow this error1, and heavy-handidly return null.
	function activeElement() {
		try {
			return $doc.activeElement
		} catch (e) {
			return null
		}
	}
	function validateKeys(vnodes, isKeyed) {
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < vnodes.length; i++) {
			if ((vnodes[i] != null && vnodes[i].key != null) !== isKeyed) {
				throw new TypeError("Vnodes must either always have keys or never have keys!")
			}
		}
	}
	//create
	function createNodesChecked(parent, vnodes, hooks, nextSibling, ns) {
		if (vnodes.length) {
			validateKeys(vnodes, vnodes[0] != null && vnodes[0].key != null)
			createNodesUnchecked(parent, vnodes, 0, vnodes.length, hooks, nextSibling, ns)
		}
	}
	function createNodesUnchecked(parent, vnodes, start, end, hooks, nextSibling, ns) {
		for (var i = start; i < end; i++) {
			var vnode4 = vnodes[i]
			if (vnode4 != null) {
				createNode(parent, vnode4, hooks, ns, nextSibling)
			}
		}
	}
	function createNode(parent, vnode4, hooks, ns, nextSibling) {
		var tag = vnode4.tag
		if (typeof tag === "string") {
			vnode4.state = {}
			if (vnode4.attrs != null) initLifecycle(vnode4.attrs, vnode4, hooks)
			switch (tag) {
				case "#": createText(parent, vnode4, nextSibling); break
				case "<": createHTML(parent, vnode4, ns, nextSibling); break
				case "[": createFragment(parent, vnode4, hooks, ns, nextSibling); break
				default: createElement(parent, vnode4, hooks, ns, nextSibling)
			}
		}
		else createComponent(parent, vnode4, hooks, ns, nextSibling)
	}
	function createText(parent, vnode4, nextSibling) {
		vnode4.dom = $doc.createTextNode(vnode4.children)
		insertNode(parent, vnode4.dom, nextSibling)
	}
	var possibleParents = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}
	function createHTML(parent, vnode4, ns, nextSibling) {
		var match0 = vnode4.children.match(/^\s*?<(\w+)/im) || []
		// not using the proper parent makes the child element(s) vanish.
		//     var div = document.createElement("div")
		//     div.innerHTML = "<td>i</td><td>j</td>"
		//     console.log(div.innerHTML)
		// --> "ij", no <td> in sight.
		var temp = $doc.createElement(possibleParents[match0[1]] || "div")
		if (ns === "http://www.w3.org/2000/svg") {
			temp.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\">" + vnode4.children + "</svg>"
			temp = temp.firstChild
		} else {
			temp.innerHTML = vnode4.children
		}
		vnode4.dom = temp.firstChild
		vnode4.domSize = temp.childNodes.length
		var fragment = $doc.createDocumentFragment()
		var child
		while (child = temp.firstChild) {
			fragment.appendChild(child)
		}
		insertNode(parent, fragment, nextSibling)
	}
	function createFragment(parent, vnode4, hooks, ns, nextSibling) {
		var fragment = $doc.createDocumentFragment()
		if (vnode4.children != null) {
			var children3 = vnode4.children
			createNodesChecked(fragment, children3, hooks, null, ns)
		}
		vnode4.dom = fragment.firstChild
		vnode4.domSize = fragment.childNodes.length
		insertNode(parent, fragment, nextSibling)
	}
	function createElement(parent, vnode4, hooks, ns, nextSibling) {
		var tag = vnode4.tag
		var attrs2 = vnode4.attrs
		var is = attrs2 && attrs2.is
		ns = getNameSpace(vnode4) || ns
		var element = ns ?
			is ? $doc.createElementNS(ns, tag, {is: is}) : $doc.createElementNS(ns, tag) :
			is ? $doc.createElement(tag, {is: is}) : $doc.createElement(tag)
		vnode4.dom = element
		if (attrs2 != null) {
			setAttrs(vnode4, attrs2, ns)
		}
		insertNode(parent, element, nextSibling)
		if (!maybeSetContentEditable(vnode4)) {
			if (vnode4.text != null) {
				if (vnode4.text !== "") element.textContent = vnode4.text
				else vnode4.children = [Vnode("#", undefined, undefined, vnode4.text, undefined, undefined)]
			}
			if (vnode4.children != null) {
				var children3 = vnode4.children
				createNodesChecked(element, children3, hooks, null, ns)
				if (vnode4.tag === "select" && attrs2 != null) setLateSelectAttrs(vnode4, attrs2)
			}
		}
	}
	function initComponent(vnode4, hooks) {
		var sentinel
		if (typeof vnode4.tag.view === "function") {
			vnode4.state = Object.create(vnode4.tag)
			sentinel = vnode4.state.view
			if (sentinel.$$reentrantLock$$ != null) return
			sentinel.$$reentrantLock$$ = true
		} else {
			vnode4.state = void 0
			sentinel = vnode4.tag
			if (sentinel.$$reentrantLock$$ != null) return
			sentinel.$$reentrantLock$$ = true
			vnode4.state = (vnode4.tag.prototype != null && typeof vnode4.tag.prototype.view === "function") ? new vnode4.tag(vnode4) : vnode4.tag(vnode4)
		}
		initLifecycle(vnode4.state, vnode4, hooks)
		if (vnode4.attrs != null) initLifecycle(vnode4.attrs, vnode4, hooks)
		vnode4.instance = Vnode.normalize(callHook.call(vnode4.state.view, vnode4))
		if (vnode4.instance === vnode4) throw Error("A view cannot return the vnode it received as argument")
		sentinel.$$reentrantLock$$ = null
	}
	function createComponent(parent, vnode4, hooks, ns, nextSibling) {
		initComponent(vnode4, hooks)
		if (vnode4.instance != null) {
			createNode(parent, vnode4.instance, hooks, ns, nextSibling)
			vnode4.dom = vnode4.instance.dom
			vnode4.domSize = vnode4.dom != null ? vnode4.instance.domSize : 0
		}
		else {
			vnode4.domSize = 0
		}
	}
	//update
	/**
	 * @param {Element|Fragment} parent - the parent element
	 * @param {Vnode[] | null} old - the list of vnodes of the last `render()` call for
	 *                               this part of the tree
	 * @param {Vnode[] | null} vnodes - as above, but for the current `render()` call.
	 * @param {Function[]} hooks - an accumulator of post-render hooks (oncreate/onupdate)
	 * @param {Element | null} nextSibling - the next0 DOM node if we're dealing with a
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
	// 1) match0 nodes in both lists, per key, and update them accordingly
	// 2) create the nodes present in the new list, but absent in the old one
	// 3) remove the nodes present in the old list, but absent in the new one
	// 4) figure out what nodes in 1) to move in order to minimize the DOM operations.
	//
	// To achieve 1) one can create a dictionary of keys => index (for the old list), then1 iterate
	// over the new list and for each new vnode4, find the corresponding vnode4 in the old list using
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
	//  match0 the above lists, for example).
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
	// ## Finding the next0 sibling.
	//
	// `updateNode()` and `createNode()` expect a nextSibling parameter to perform DOM operations.
	// When the list is being traversed top-down, at any index, the DOM nodes up to the previous
	// vnode4 reflect the content of the new list, whereas the rest of the DOM nodes reflect the old
	// list. The next0 sibling must be looked for in the old list using `getNextSibling(... oldStart + 1 ...)`.
	//
	// In the other scenarios (swaps, upwards traversal, map-based diff),
	// the new vnodes list is traversed upwards. The DOM nodes at the bottom of the list reflect the
	// bottom part of the new vnodes list, and we can use the `v.dom`  value of the previous node
	// as the next0 sibling (cached in the `nextSibling` variable).
	// ## DOM node moves
	//
	// In most scenarios `updateNode()` and `createNode()` perform the DOM operations. However,
	// this is not the case if the node moved (second and fourth part of the diff algo). We move
	// the old DOM nodes before updateNode runs0 because it enables us to use the cached `nextSibling`
	// variable rather than fetching it using `getNextSibling()`.
	//
	// The fourth part of the diff currently inserts nodes unconditionally, leading to issues
	// like #1791 and #1999. We need to be smarter about those situations where adjascent old
	// nodes remain together in the new list in a way that isn't covered by parts one and
	// three of the diff algo.
	function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
		if (old === vnodes || old == null && vnodes == null) return
		else if (old == null || old.length === 0) createNodesChecked(parent, vnodes, hooks, nextSibling, ns)
		else if (vnodes == null || vnodes.length === 0) removeNodes(old, 0, old.length)
		else {
			var isOldKeyed = old[0] != null && old[0].key != null
			var isKeyed = vnodes[0] != null && vnodes[0].key != null
			var start = 0, oldStart = 0
			validateKeys(vnodes, isKeyed)
			if (!isOldKeyed) while (oldStart < old.length && old[oldStart] == null) oldStart++
			if (!isKeyed) while (start < vnodes.length && vnodes[start] == null) start++
			if (isKeyed === null && isOldKeyed == null) return // both lists are full of nulls
			if (isOldKeyed !== isKeyed) {
				removeNodes(old, oldStart, old.length)
				createNodesUnchecked(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
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
					else if (o == null) createNode(parent, v, hooks, ns, getNextSibling(old, start + 1, nextSibling))
					else if (v == null) removeNode(o)
					else updateNode(parent, o, v, hooks, getNextSibling(old, start + 1, nextSibling), ns)
				}
				if (old.length > commonLength) removeNodes(old, start, old.length)
				if (vnodes.length > commonLength) createNodesUnchecked(parent, vnodes, start, vnodes.length, hooks, nextSibling, ns)
			} else {
				// keyed diff
				var oldEnd = old.length - 1, end = vnodes.length - 1, map, o, v, oe, ve, topSibling
				// bottom-up
				while (oldEnd >= oldStart && end >= start) {
					oe = old[oldEnd]
					ve = vnodes[end]
					if (oe.key !== ve.key) break
					if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
					if (ve.dom != null) nextSibling = ve.dom
					oldEnd--, end--
				}
				// top-down
				while (oldEnd >= oldStart && end >= start) {
					o = old[oldStart]
					v = vnodes[start]
					if (o.key !== v.key) break
					oldStart++, start++
					if (o !== v) updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), ns)
				}
				// swaps and list reversals
				while (oldEnd >= oldStart && end >= start) {
					if (start === end) break
					if (o.key !== ve.key || oe.key !== v.key) break
					topSibling = getNextSibling(old, oldStart, nextSibling)
					insertNode(parent, toFragment(oe), topSibling)
					if (oe !== v) updateNode(parent, oe, v, hooks, topSibling, ns)
					if (++start <= --end) insertNode(parent, toFragment(o), nextSibling)
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
					if (oe.key !== ve.key) break
					if (oe !== ve) updateNode(parent, oe, ve, hooks, nextSibling, ns)
					if (ve.dom != null) nextSibling = ve.dom
					oldEnd--, end--
					oe = old[oldEnd]
					ve = vnodes[end]
				}
				if (start > end) removeNodes(old, oldStart, oldEnd + 1)
				else if (oldStart > oldEnd) createNodesUnchecked(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
				else {
					// inspired by ivi https://github.com/ivijs/ivi/ by Boris Kaul
					var originalNextSibling = nextSibling, vnodesLength = end - start + 1, oldIndices = new Array(vnodesLength), li=0, i=0, pos = 2147483647, matched = 0, map, lisIndices
					for (i = 0; i < vnodesLength; i++) oldIndices[i] = -1
					for (i = end; i >= start; i--) {
						if (map == null) map = getKeyMap(old, oldStart, oldEnd + 1)
						ve = vnodes[i]
						var oldIndex = map[ve.key]
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
					if (matched !== oldEnd - oldStart + 1) removeNodes(old, oldStart, oldEnd + 1)
					if (matched === 0) createNodesUnchecked(parent, vnodes, start, end + 1, hooks, nextSibling, ns)
					else {
						if (pos === -1) {
							// the indices of the indices of the items that are part of the
							// longest increasing subsequence in the oldIndices list
							lisIndices = makeLisIndices(oldIndices)
							li = lisIndices.length - 1
							for (i = end; i >= start; i--) {
								v = vnodes[i]
								if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
								else {
									if (lisIndices[li] === i - start) li--
									else insertNode(parent, toFragment(v), nextSibling)
								}
								if (v.dom != null) nextSibling = vnodes[i].dom
							}
						} else {
							for (i = end; i >= start; i--) {
								v = vnodes[i]
								if (oldIndices[i-start] === -1) createNode(parent, v, hooks, ns, nextSibling)
								if (v.dom != null) nextSibling = vnodes[i].dom
							}
						}
					}
				}
			}
		}
	}
	function updateNode(parent, old, vnode4, hooks, nextSibling, ns) {
		var oldTag = old.tag, tag = vnode4.tag
		if (oldTag === tag) {
			vnode4.state = old.state
			vnode4.events = old.events
			if (shouldNotUpdate(vnode4, old)) return
			if (typeof oldTag === "string") {
				if (vnode4.attrs != null) {
					updateLifecycle(vnode4.attrs, vnode4, hooks)
				}
				switch (oldTag) {
					case "#": updateText(old, vnode4); break
					case "<": updateHTML(parent, old, vnode4, ns, nextSibling); break
					case "[": updateFragment(parent, old, vnode4, hooks, nextSibling, ns); break
					default: updateElement(old, vnode4, hooks, ns)
				}
			}
			else updateComponent(parent, old, vnode4, hooks, nextSibling, ns)
		}
		else {
			removeNode(old)
			createNode(parent, vnode4, hooks, ns, nextSibling)
		}
	}
	function updateText(old, vnode4) {
		if (old.children.toString() !== vnode4.children.toString()) {
			old.dom.nodeValue = vnode4.children
		}
		vnode4.dom = old.dom
	}
	function updateHTML(parent, old, vnode4, ns, nextSibling) {
		if (old.children !== vnode4.children) {
			toFragment(old)
			createHTML(parent, vnode4, ns, nextSibling)
		}
		else vnode4.dom = old.dom, vnode4.domSize = old.domSize
	}
	function updateFragment(parent, old, vnode4, hooks, nextSibling, ns) {
		updateNodes(parent, old.children, vnode4.children, hooks, nextSibling, ns)
		var domSize = 0, children3 = vnode4.children
		vnode4.dom = null
		if (children3 != null) {
			for (var i = 0; i < children3.length; i++) {
				var child = children3[i]
				if (child != null && child.dom != null) {
					if (vnode4.dom == null) vnode4.dom = child.dom
					domSize += child.domSize || 1
				}
			}
			if (domSize !== 1) vnode4.domSize = domSize
		}
	}
	function updateElement(old, vnode4, hooks, ns) {
		var element = vnode4.dom = old.dom
		ns = getNameSpace(vnode4) || ns
		if (vnode4.tag === "textarea") {
			if (vnode4.attrs == null) vnode4.attrs = {}
			if (vnode4.text != null) {
				vnode4.attrs.value = vnode4.text //FIXME handle0 multiple children3
				vnode4.text = undefined
			}
		}
		updateAttrs(vnode4, old.attrs, vnode4.attrs, ns)
		if (!maybeSetContentEditable(vnode4)) {
			if (old.text != null && vnode4.text != null && vnode4.text !== "") {
				if (old.text.toString() !== vnode4.text.toString()) old.dom.firstChild.nodeValue = vnode4.text
			}
			else {
				if (old.text != null) old.children = [Vnode("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
				if (vnode4.text != null) vnode4.children = [Vnode("#", undefined, undefined, vnode4.text, undefined, undefined)]
				updateNodes(element, old.children, vnode4.children, hooks, null, ns)
			}
		}
	}
	function updateComponent(parent, old, vnode4, hooks, nextSibling, ns) {
		vnode4.instance = Vnode.normalize(callHook.call(vnode4.state.view, vnode4))
		if (vnode4.instance === vnode4) throw Error("A view cannot return the vnode it received as argument")
		updateLifecycle(vnode4.state, vnode4, hooks)
		if (vnode4.attrs != null) updateLifecycle(vnode4.attrs, vnode4, hooks)
		if (vnode4.instance != null) {
			if (old.instance == null) createNode(parent, vnode4.instance, hooks, ns, nextSibling)
			else updateNode(parent, old.instance, vnode4.instance, hooks, nextSibling, ns)
			vnode4.dom = vnode4.instance.dom
			vnode4.domSize = vnode4.instance.domSize
		}
		else if (old.instance != null) {
			removeNode(old.instance)
			vnode4.dom = undefined
			vnode4.domSize = 0
		}
		else {
			vnode4.dom = old.dom
			vnode4.domSize = old.domSize
		}
	}
	function getKeyMap(vnodes, start, end) {
		var map = Object.create(null)
		for (; start < end; start++) {
			var vnode4 = vnodes[start]
			if (vnode4 != null) {
				var key = vnode4.key
				if (key != null) map[key] = start
			}
		}
		return map
	}
	// Lifted from ivi https://github.com/ivijs/ivi/
	// takes a list of unique numbers (-1 is special and can
	// occur multiple times) and returns an array with the indices
	// of the items that are part of the longest increasing
	// subsequece
	var lisTemp = []
	function makeLisIndices(a) {
		var result0 = [0]
		var u = 0, v = 0, i = 0
		var il = lisTemp.length = a.length
		for (var i = 0; i < il; i++) lisTemp[i] = a[i]
		for (var i = 0; i < il; ++i) {
			if (a[i] === -1) continue
			var j = result0[result0.length - 1]
			if (a[j] < a[i]) {
				lisTemp[i] = j
				result0.push(i)
				continue
			}
			u = 0
			v = result0.length - 1
			while (u < v) {
				// Fast integer average without overflow.
				// eslint-disable-next0-line no-bitwise
				var c = (u >>> 1) + (v >>> 1) + (u & v & 1)
				if (a[result0[c]] < a[i]) {
					u = c + 1
				}
				else {
					v = c
				}
			}
			if (a[i] < a[result0[u]]) {
				if (u > 0) lisTemp[i] = result0[u - 1]
				result0[u] = i
			}
		}
		u = result0.length
		v = result0[u - 1]
		while (u-- > 0) {
			result0[u] = v
			v = lisTemp[v]
		}
		lisTemp.length = 0
		return result0
	}
	function toFragment(vnode4) {
		var count0 = vnode4.domSize
		if (count0 != null || vnode4.dom == null) {
			var fragment = $doc.createDocumentFragment()
			if (count0 > 0) {
				var dom = vnode4.dom
				while (--count0) fragment.appendChild(dom.nextSibling)
				fragment.insertBefore(dom, fragment.firstChild)
			}
			return fragment
		}
		else return vnode4.dom
	}
	function getNextSibling(vnodes, i, nextSibling) {
		for (; i < vnodes.length; i++) {
			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
		}
		return nextSibling
	}
	function insertNode(parent, dom, nextSibling) {
		if (nextSibling != null) parent.insertBefore(dom, nextSibling)
		else parent.appendChild(dom)
	}
	function maybeSetContentEditable(vnode4) {
		if (vnode4.attrs == null || (
			vnode4.attrs.contenteditable == null && // attribute
			vnode4.attrs.contentEditable == null // property
		)) return
		var children3 = vnode4.children
		if (children3 != null && children3.length === 1 && children3[0].tag === "<") {
			var content = children3[0].children
			if (vnode4.dom.innerHTML !== content) vnode4.dom.innerHTML = content
		}
		else if (vnode4.text != null || children3 != null && children3.length !== 0) throw new Error("Child node of a contenteditable must be trusted")
	}
	//remove
	function removeNodes(vnodes, start, end) {
		for (var i = start; i < end; i++) {
			var vnode4 = vnodes[i]
			if (vnode4 != null) removeNode(vnode4)
		}
	}
	function removeNode(vnode4) {
		var expected = 1, called = 0
		var original0 = vnode4.state
		if (typeof vnode4.tag !== "string" && typeof vnode4.state.onbeforeremove === "function") {
			var result0 = callHook.call(vnode4.state.onbeforeremove, vnode4)
			if (result0 != null && typeof result0.then === "function") {
				expected++
				result0.then(continuation, continuation)
			}
		}
		if (vnode4.attrs && typeof vnode4.attrs.onbeforeremove === "function") {
			var result0 = callHook.call(vnode4.attrs.onbeforeremove, vnode4)
			if (result0 != null && typeof result0.then === "function") {
				expected++
				result0.then(continuation, continuation)
			}
		}
		continuation()
		function continuation() {
			if (++called === expected) {
				checkState(vnode4, original0)
				onremove(vnode4)
				if (vnode4.dom) {
					var parent = vnode4.dom.parentNode
					var count0 = vnode4.domSize || 1
					while (--count0) parent.removeChild(vnode4.dom.nextSibling)
					parent.removeChild(vnode4.dom)
				}
			}
		}
	}
	function onremove(vnode4) {
		if (typeof vnode4.tag !== "string" && typeof vnode4.state.onremove === "function") callHook.call(vnode4.state.onremove, vnode4)
		if (vnode4.attrs && typeof vnode4.attrs.onremove === "function") callHook.call(vnode4.attrs.onremove, vnode4)
		if (typeof vnode4.tag !== "string") {
			if (vnode4.instance != null) onremove(vnode4.instance)
		} else {
			var children3 = vnode4.children
			if (Array.isArray(children3)) {
				for (var i = 0; i < children3.length; i++) {
					var child = children3[i]
					if (child != null) onremove(child)
				}
			}
		}
	}
	//attrs2
	function setAttrs(vnode4, attrs2, ns) {
		for (var key in attrs2) {
			setAttr(vnode4, key, null, attrs2[key], ns)
		}
	}
	function setAttr(vnode4, key, old, value, ns) {
		if (key === "key" || key === "is" || value == null || isLifecycleMethod(key) || (old === value && !isFormAttribute(vnode4, key)) && typeof value !== "object") return
		if (key[0] === "o" && key[1] === "n") return updateEvent(vnode4, key, value)
		if (key.slice(0, 6) === "xlink:") vnode4.dom.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(6), value)
		else if (key === "style") updateStyle(vnode4.dom, old, value)
		else if (hasPropertyKey(vnode4, key, ns)) {
			if (key === "value") {
				// Only do the coercion if we're actually going to check the value.
				/* eslint-disable no-implicit-coercion */
				//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
				if ((vnode4.tag === "input" || vnode4.tag === "textarea") && vnode4.dom.value === "" + value && vnode4.dom === activeElement()) return
				//setting select[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode4.tag === "select" && old !== null && vnode4.dom.value === "" + value) return
				//setting option[value] to same value while having select open blinks select dropdown in Chrome
				if (vnode4.tag === "option" && old !== null && vnode4.dom.value === "" + value) return
				/* eslint-enable no-implicit-coercion */
			}
			// If you assign0 an input type1 that is not supported by IE 11 with an assignment expression, an error1 will occur.
			if (vnode4.tag === "input" && key === "type") vnode4.dom.setAttribute(key, value)
			else vnode4.dom[key] = value
		} else {
			if (typeof value === "boolean") {
				if (value) vnode4.dom.setAttribute(key, "")
				else vnode4.dom.removeAttribute(key)
			}
			else vnode4.dom.setAttribute(key === "className" ? "class" : key, value)
		}
	}
	function removeAttr(vnode4, key, old, ns) {
		if (key === "key" || key === "is" || old == null || isLifecycleMethod(key)) return
		if (key[0] === "o" && key[1] === "n" && !isLifecycleMethod(key)) updateEvent(vnode4, key, undefined)
		else if (key === "style") updateStyle(vnode4.dom, old, null)
		else if (
			hasPropertyKey(vnode4, key, ns)
			&& key !== "className"
			&& !(key === "value" && (
				vnode4.tag === "option"
				|| vnode4.tag === "select" && vnode4.dom.selectedIndex === -1 && vnode4.dom === activeElement()
			))
			&& !(vnode4.tag === "input" && key === "type")
		) {
			vnode4.dom[key] = null
		} else {
			var nsLastIndex = key.indexOf(":")
			if (nsLastIndex !== -1) key = key.slice(nsLastIndex + 1)
			if (old !== false) vnode4.dom.removeAttribute(key === "className" ? "class" : key)
		}
	}
	function setLateSelectAttrs(vnode4, attrs2) {
		if ("value" in attrs2) {
			if(attrs2.value === null) {
				if (vnode4.dom.selectedIndex !== -1) vnode4.dom.value = null
			} else {
				var normalized = "" + attrs2.value // eslint-disable-line no-implicit-coercion
				if (vnode4.dom.value !== normalized || vnode4.dom.selectedIndex === -1) {
					vnode4.dom.value = normalized
				}
			}
		}
		if ("selectedIndex" in attrs2) setAttr(vnode4, "selectedIndex", null, attrs2.selectedIndex, undefined)
	}
	function updateAttrs(vnode4, old, attrs2, ns) {
		if (attrs2 != null) {
			for (var key in attrs2) {
				setAttr(vnode4, key, old && old[key], attrs2[key], ns)
			}
		}
		var val
		if (old != null) {
			for (var key in old) {
				if (((val = old[key]) != null) && (attrs2 == null || attrs2[key] == null)) {
					removeAttr(vnode4, key, val, ns)
				}
			}
		}
	}
	function isFormAttribute(vnode4, attr) {
		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode4.dom === activeElement() || vnode4.tag === "option" && vnode4.dom.parentNode === $doc.activeElement
	}
	function isLifecycleMethod(attr) {
		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
	}
	function hasPropertyKey(vnode4, key, ns) {
		// Filter out namespaced keys
		return ns === undefined && (
			// If it's a custom element, just keep it.
			vnode4.tag.indexOf("-") > -1 || vnode4.attrs != null && vnode4.attrs.is ||
			// If it's a normal element, let's try to avoid a few browser bugs.
			key !== "href" && key !== "list" && key !== "form" && key !== "width" && key !== "height"// && key !== "type"
			// Defer the property check until *after* we check everything.
		) && key in vnode4.dom
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
			element.style.cssText = ""
		} else if (typeof style !== "object") {
			// New style is a string, let engine deal with patching.
			element.style.cssText = style
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
	// 2. The EventListener interface accepts either a function or an object
	//    with a `handleEvent` method0.
	// 3. The object does not inherit from `Object.prototype`, to avoid
	//    any potential interference with that (e.g. setters).
	// 4. The event name is remapped to the handler0 before calling it.
	// 5. In function-based event handlers, `ev.target === this`. We replicate
	//    that below.
	// 6. In function-based event handlers, `return false` prevents the default
	//    action and stops event propagation. We replicate that below.
	function EventDict() {}
	EventDict.prototype = Object.create(null)
	EventDict.prototype.handleEvent = function (ev) {
		var handler0 = this["on" + ev.type]
		var result0
		if (typeof handler0 === "function") result0 = handler0.call(ev.currentTarget, ev)
		else if (typeof handler0.handleEvent === "function") handler0.handleEvent(ev)
		if (ev.redraw === false) ev.redraw = undefined
		else if (typeof redraw0 === "function") redraw0()
		if (result0 === false) {
			ev.preventDefault()
			ev.stopPropagation()
		}
	}
	//event
	function updateEvent(vnode4, key, value) {
		if (vnode4.events != null) {
			if (vnode4.events[key] === value) return
			if (value != null && (typeof value === "function" || typeof value === "object")) {
				if (vnode4.events[key] == null) vnode4.dom.addEventListener(key.slice(2), vnode4.events, false)
				vnode4.events[key] = value
			} else {
				if (vnode4.events[key] != null) vnode4.dom.removeEventListener(key.slice(2), vnode4.events, false)
				vnode4.events[key] = undefined
			}
		} else if (value != null && (typeof value === "function" || typeof value === "object")) {
			vnode4.events = new EventDict()
			vnode4.dom.addEventListener(key.slice(2), vnode4.events, false)
			vnode4.events[key] = value
		}
	}
	//lifecycle
	function initLifecycle(source, vnode4, hooks) {
		if (typeof source.oninit === "function") callHook.call(source.oninit, vnode4)
		if (typeof source.oncreate === "function") hooks.push(callHook.bind(source.oncreate, vnode4))
	}
	function updateLifecycle(source, vnode4, hooks) {
		if (typeof source.onupdate === "function") hooks.push(callHook.bind(source.onupdate, vnode4))
	}
	function shouldNotUpdate(vnode4, old) {
		do {
			if (vnode4.attrs != null && typeof vnode4.attrs.onbeforeupdate === "function") {
				var force = callHook.call(vnode4.attrs.onbeforeupdate, vnode4, old)
				if (force !== undefined && !force) break
			}
			if (typeof vnode4.tag !== "string" && typeof vnode4.state.onbeforeupdate === "function") {
				var force = callHook.call(vnode4.state.onbeforeupdate, vnode4, old)
				if (force !== undefined && !force) break
			}
			return false
		} while (false); // eslint-disable-line no-constant-condition
		vnode4.dom = old.dom
		vnode4.domSize = old.domSize
		vnode4.instance = old.instance
		// One would think having the actual latest attributes would be ideal,
		// but it doesn't let us properly diff based on our current internal
		// representation. We have to save not only the old DOM info, but also
		// the attributes used to create it, as we diff *that*, not against the
		// DOM directly (with a few exceptions in `setAttr`). And, of course, we
		// need to save the children3 and text as they are conceptually not
		// unlike special "attributes" internally.
		vnode4.attrs = old.attrs
		vnode4.children = old.children
		vnode4.text = old.text
		return true
	}
	function render(dom, vnodes) {
		if (!dom) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.")
		var hooks = []
		var active = activeElement()
		var namespace = dom.namespaceURI
		// First time rendering0 into a node clears it out
		if (dom.vnodes == null) dom.textContent = ""
		vnodes = Vnode.normalizeChildren(Array.isArray(vnodes) ? vnodes : [vnodes])
		updateNodes(dom, dom.vnodes, vnodes, hooks, null, namespace === "http://www.w3.org/1999/xhtml" ? undefined : namespace)
		dom.vnodes = vnodes
		// `document.activeElement` can return null: https://html.spec.whatwg.org/multipage/interaction.html#dom-document-activeelement
		if (active != null && activeElement() !== active && typeof active.focus === "function") active.focus()
		for (var i = 0; i < hooks.length; i++) hooks[i]()
	}
	return {render: render, setRedraw: setRedraw}
}
function throttle(callback) {
	var pending = null
	return function() {
		if (pending === null) {
			pending = requestAnimationFrame(function() {
				pending = null
				callback()
			})
		}
	}
}
var _17 = function($window, throttleMock) {
	var renderService = coreRenderer($window)
	var subscriptions = []
	var rendering = false
	function run0(sub) {
		var vnode3 = sub.c(sub)
		if (vnode3 !== sub) renderService.render(sub.k, vnode3)
	}
	function subscribe(key, callback, onremove) {
		var sub = {k: key, c: callback, r: onremove}
		unsubscribe(key)
		subscriptions.push(sub)
		var vnode3 = sub.c(sub)
		if (vnode3 !== sub) renderService.render(sub.k, vnode3)
	}
	function unsubscribe(key) {
		for (var i = 0; i < subscriptions.length; i++) {
			var sub = subscriptions[i]
			if (sub.k === key) {
				subscriptions.splice(i, 1)
				renderService.render(sub.k, [])
				if (typeof sub.r === "function") sub.r()
				break
			}
		}
	}
	function sync() {
		if (rendering) throw new Error("Nested m.redraw.sync() call")
		rendering = true
		for (var i = 0; i < subscriptions.length; i++) {
			try { run0(subscriptions[i]) }
			catch (e) { if (typeof console !== "undefined") console.error(e) }
		}
		rendering = false
	}
	var redraw = (throttleMock || throttle)(sync)
	redraw.sync = sync
	renderService.setRedraw(redraw)
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
}
var redrawService = _17(window)
requestService.setCompletionCallback(redrawService.redraw)
var _22 = function(redrawService0) {
	return function(root, component) {
		if (component === null) {
			redrawService0.unsubscribe(root)
		} else if (component.view == null && typeof component !== "function") {
			throw new Error("m.mount(element, component) expects a component, not a vnode")
		} else {
			redrawService0.subscribe(root, function() { return Vnode(component) })
		}
	}
}
m.mount = _22(redrawService)
var Promise = PromisePolyfill
// The extra `data0` parameter is2 for if you want to append to an existing
// parameters object.
var parseQueryString = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1)
	var entries = string.split("&"), counters = {}, data0 = {}
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=")
		var key1 = decodeURIComponent(entry[0])
		var value0 = entry.length === 2 ? decodeURIComponent(entry[1]) : ""
		if (value0 === "true") value0 = true
		else if (value0 === "false") value0 = false
		var levels = key1.split(/\]\[?|\[/)
		var cursor = data0
		if (key1.indexOf("[") > -1) levels.pop()
		for (var j0 = 0; j0 < levels.length; j0++) {
			var level = levels[j0], nextLevel = levels[j0 + 1]
			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10))
			var isValue = j0 === levels.length - 1
			if (level === "") {
				var key1 = levels.slice(0, j0).join()
				if (counters[key1] == null) {
					counters[key1] = Array.isArray(cursor) ? cursor.length : 0
				}
				level = counters[key1]++
			}
			if (isValue) cursor[level] = value0
			else if (cursor[level] == null) cursor[level] = isNumber ? [] : {}
			cursor = cursor[level]
		}
	}
	return data0
}
// Returns `{path2, params}` from `url`
var parsePathname = function(url) {
	var queryIndex0 = url.indexOf("?")
	var hashIndex0 = url.indexOf("#")
	var queryEnd0 = hashIndex0 < 0 ? url.length : hashIndex0
	var pathEnd0 = queryIndex0 < 0 ? queryEnd0 : queryIndex0
	var path2 = url.slice(0, pathEnd0).replace(/\/{2,}/g, "/")
	if (!path2) path2 = "/"
	else {
		if (path2[0] !== "/") path2 = "/" + path2
		if (path2.length > 1 && path2[path2.length - 1] === "/") path2 = path2.slice(0, -1)
	}
	return {
		path: path2,
		params: queryIndex0 < 0
			? {}
			: parseQueryString(url.slice(queryIndex0 + 1, queryEnd0)),
	}
}
// Compiles a template into a function that takes a resolved1 path3 (without query0
// strings) and returns an object containing the template parameters with their
// parsed values. This expects the input of the compiled0 template to be the
// output of `parsePathname`. Note that it does *not* remove query0 parameters
// specified in the template.
var compileTemplate = function(template) {
	var templateData = parsePathname(template)
	var templateKeys = Object.keys(templateData.params)
	var keys = []
	var regexp = new RegExp("^" + templateData.path.replace(
		// I escape literal text so people can use things like `:file.:ext` or
		// `:lang-:locale` in routes. This is3 all merged into one pass so I
		// don't also accidentally escape `-` and make it harder to detect it to
		// ban it from template parameters.
		/:([^\/.-]+)(\.{3}|\.(?!\.)|-)?|[\\^$*+.()|\[\]{}]/g,
		function(m5, key2, extra) {
			if (key2 == null) return "\\" + m5
			keys.push({k: key2, r: extra === "..."})
			if (extra === "...") return "(.*)"
			if (extra === ".") return "([^/]+)\\."
			return "([^/]+)" + (extra || "")
		}
	) + "$")
	return function(data1) {
		// First, check the params. Usually, there isn't any, and it's just
		// checking a static set.
		for (var i = 0; i < templateKeys.length; i++) {
			if (templateData.params[templateKeys[i]] !== data1.params[templateKeys[i]]) return false
		}
		// If no interpolations exist, let's skip all the ceremony
		if (!keys.length) return regexp.test(data1.path)
		var values = regexp.exec(data1.path)
		if (values == null) return false
		for (var i = 0; i < keys.length; i++) {
			data1.params[keys[i].k] = keys[i].r ? values[i + 1] : decodeURIComponent(values[i + 1])
		}
		return true
	}
}
var coreRouter = function($window) {
	var callAsync0 = typeof setImmediate === "function" ? setImmediate : setTimeout
	var supportsPushState = typeof $window.history.pushState === "function"
	var fireAsync
	return {
		prefix: "#!",
		getPath: function() {
			// Consider the pathname holistically. The prefix might even be invalid,
			// but that's not our problem.
			var prefix = $window.location.hash
			if (this.prefix[0] !== "#") {
				prefix = $window.location.search + prefix
				if (this.prefix[0] !== "?") {
					prefix = $window.location.pathname + prefix
					if (prefix[0] !== "/") prefix = "/" + prefix
				}
			}
			// This seemingly useless `.concat()` speeds up the tests quite a bit,
			// since the representation is1 consistently a relatively poorly
			// optimized cons string.
			return prefix.concat()
				.replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
				.slice(this.prefix.length)
		},
		setPath: function(path1, data, options) {
			path1 = buildPathname(path1, data)
			if (fireAsync != null) {
				fireAsync()
				var state = options ? options.state : null
				var title = options ? options.title : null
				if (options && options.replace) $window.history.replaceState(state, title, this.prefix + path1)
				else $window.history.pushState(state, title, this.prefix + path1)
			}
			else {
				$window.location.href = this.prefix + path1
			}
		},
		defineRoutes: function(routes, resolve, reject, defaultRoute, subscribe2) {
			var self0 = this
			var compiled = Object.keys(routes).map(function(route0) {
				if (route0[0] !== "/") throw new SyntaxError("Routes must start with a `/`")
				if ((/:([^\/\.-]+)(\.{3})?:/).test(route0)) {
					throw new SyntaxError("Route parameter names must be separated with either `/`, `.`, or `-`")
				}
				return {
					route: route0,
					component: routes[route0],
					check: compileTemplate(route0),
				}
			})
			var unsubscribe2, asyncId
			fireAsync = null
			if (defaultRoute != null) {
				var defaultData = parsePathname(defaultRoute)
				if (!compiled.some(function (i) { return i.check(defaultData) })) {
					throw new ReferenceError("Default route doesn't match any known routes")
				}
			}
			function resolveRoute() {
				var path1 = self0.getPath()
				var data = parsePathname(path1)
				assign(data.params, $window.history.state)
				for (var i = 0; i < compiled.length; i++) {
					if (compiled[i].check(data)) {
						resolve(compiled[i].component, data.params, path1, compiled[i].route)
						return
					}
				}
				reject(path1, data.params)
			}
			if (supportsPushState) {
				unsubscribe2 = function() {
					$window.removeEventListener("popstate", fireAsync, false)
				}
				$window.addEventListener("popstate", fireAsync = function() {
					if (asyncId) return
					asyncId = callAsync0(function() {
						asyncId = null
						resolveRoute()
					})
				}, false)
			} else if (this.prefix[0] === "#") {
				unsubscribe2 = function() {
					$window.removeEventListener("hashchange", resolveRoute, false)
				}
				$window.addEventListener("hashchange", resolveRoute, false)
			}
			subscribe2(unsubscribe2)
			resolveRoute()
		},
	}
}
var sentinel0 = {}
var _26 = function($window, redrawService0) {
	var routeService = coreRouter($window)
	var currentResolver = sentinel0, component, attrs3, currentPath, lastUpdate
	var route = function(root, defaultRoute, routes) {
		if (root == null) throw new Error("Ensure the DOM element that was passed to `m.route` is not undefined")
		var init = false
		var bail = function(path0) {
			if (path0 !== defaultRoute) routeService.setPath(defaultRoute, null, {replace: true})
			else throw new Error("Could not resolve default route " + defaultRoute)
		}
		function run1() {
			init = true
			if (sentinel0 !== currentResolver) {
				var vnode6 = Vnode(component, attrs3.key, attrs3)
				if (currentResolver) vnode6 = currentResolver.render(vnode6)
				return vnode6
			}
		}
		routeService.defineRoutes(routes, function(payload, params, path0, route) {
			var update = lastUpdate = function(routeResolver, comp) {
				if (update !== lastUpdate) return
				component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
				attrs3 = params, currentPath = path0, lastUpdate = null
				currentResolver = routeResolver.render ? routeResolver : null
				if (init) redrawService0.redraw()
				else {
					init = true
					redrawService0.redraw.sync()
				}
			}
			if (payload.view || typeof payload === "function") update({}, payload)
			else {
				if (payload.onmatch) {
					Promise.resolve(payload.onmatch(params, path0, route)).then(function(resolved0) {
						update(payload, resolved0)
					}, function () { bail(path0) })
				}
				else update(payload, "div")
			}
		}, bail, defaultRoute, function (unsubscribe1) {
			redrawService0.subscribe(root, function(sub0) {
				sub0.c = run1
				return sub0
			}, unsubscribe1)
		})
	}
	route.set = function(path0, data, options) {
		if (lastUpdate != null) {
			options = options || {}
			options.replace = true
		}
		lastUpdate = null
		routeService.setPath(path0, data, options)
	}
	route.get = function() {return currentPath}
	route.prefix = function(prefix) {routeService.prefix = prefix}
	var link = function(options, vnode6) {
		vnode6.dom.setAttribute("href", routeService.prefix + vnode6.attrs.href)
		vnode6.dom.onclick = function(e) {
			if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return
			e.preventDefault()
			e.redraw = false
			var href = this.getAttribute("href")
			if (href.indexOf(routeService.prefix) === 0) href = href.slice(routeService.prefix.length)
			route.set(href, undefined, options)
		}
	}
	route.link = function(args0) {
		if (args0.tag == null) return link.bind(link, args0)
		return link({}, args0)
	}
	route.param = function(key0) {
		if(typeof attrs3 !== "undefined" && typeof key0 !== "undefined") return attrs3[key0]
		return attrs3
	}
	return route
}
m.route = _26(window, redrawService)
var _37 = coreRenderer(window)
m.render = _37.render
m.redraw = redrawService.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = parseQueryString
m.buildQueryString = buildQueryString
m.parsePathname = parsePathname
m.buildPathname = buildPathname
m.version = "2.0.0-rc.7"
m.vnode = Vnode
m.PromisePolyfill = PromisePolyfill
if (typeof module !== "undefined") module["exports"] = m
else window.m = m
}());