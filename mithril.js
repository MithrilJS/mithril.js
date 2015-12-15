;(function (global, factory) { // eslint-disable-line
	"use strict"
	/* eslint-disable no-undef */
	var m = factory(typeof window !== "undefined" ? window : {})
	if (typeof module === "object" && module != null && module.exports) {
		module.exports = m
	} else if (typeof define === "function" && define.amd) {
		define(function () { return m })
	} else {
		global.m = m
	}
	/* eslint-enable no-undef */
})(this, function (window, undefined) { // eslint-disable-line
	"use strict"

	var VERSION = "v0.2.1"

	// Save these two.
	var type = {}.toString
	var hasOwn = {}.hasOwnProperty

	function isFunction(object) {
		return typeof object === "function"
	}

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]"
	}

	function noop() {}

	function forEach(list, f, inst) {
		for (var i = 0; i < list.length; i++) {
			f.call(inst, list[i], i)
		}
	}

	function forOwn(obj, f, inst) {
		for (var prop in obj) {
			if (hasOwn.call(obj, prop)) {
				if (f.call(inst, obj[prop], prop)) break
			}
		}
	}

	var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/ // eslint-disable-line max-len

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

	// self invoking function needed because of the way mocks work
	function initialize(window) {
		$document = window.document
		$location = window.location
		$cancelAnimationFrame = window.cancelAnimationFrame ||
			window.clearTimeout
		$requestAnimationFrame = window.requestAnimationFrame ||
			window.setTimeout
	}

	initialize(window)

	// testing API
	m.deps = function (mock) {
		initialize(window = mock || window)
		return window
	}

	m.version = function () {
		return VERSION
	}

	/**
	* @typedef {String} Tag
	* A string that looks like -> div.classname#id[param=one][param2=two]
	* Which describes a DOM node
	*/

	function checkForAttrs(pairs) {
		return pairs != null && isObject(pairs) &&
			!("tag" in pairs || "view" in pairs || "subtree" in pairs)
	}

	function parseSelector(tag, cell) {
		var classes = []
		var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
		var match
		while ((match = parser.exec(tag)) != null) {
			if (match[1] === "" && match[2] != null) {
				cell.tag = match[2]
			} else if (match[1] === "#") {
				cell.attrs.id = match[2]
			} else if (match[1] === ".") {
				classes.push(match[2])
			} else if (match[3][0] === "[") {
				var pair = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/.exec(match[3])
				cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
			}
		}

		return classes
	}

	function assignAttrs(target, attrs, classAttr, classes) {
		var hasClass = false
		if (hasOwn.call(attrs, classAttr)) {
			var value = attrs[classAttr]
			if (value != null && value !== "") {
				hasClass = true
				classes.push(value)
			}
		}

		forOwn(attrs, function (value, attr) {
			target[attr] = attr === classAttr && hasClass ? "" : value
		})

		if (classes.length) {
			target[classAttr] = classes.join(" ")
		}
	}

	function parameterize(component) {
		var args = []
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i])
		}

		var originalCtrl = component.controller || noop

		function Ctrl() {
			return originalCtrl.apply(this, args) || this
		}

		if (originalCtrl !== noop) {
			Ctrl.prototype = originalCtrl.prototype
		}

		var originalView = component.view || noop

		function view(ctrl) {
			var rest = [ctrl].concat(args)
			for (var i = 1; i < arguments.length; i++) {
				rest.push(arguments[i])
			}

			return originalView.apply(component, rest)
		}

		view.$original = originalView
		var output = {controller: Ctrl, view: view}

		if (args[0] && args[0].key != null) {
			output.attrs = {key: args[0].key}
		}

		return output
	}

	m.component = parameterize

	/**
	* @param {Tag} The DOM node tag
	* @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	* @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
	*                      or splat (optional)
	*/
	function m(tag, pairs) {
		// The arguments are passed directly like this to delay array
		// allocation.
		if (isObject(tag)) return parameterize.apply(null, arguments)

		if (!isString(tag)) {
			throw new TypeError("selector in m(selector, attrs, children) " +
				"should be a string")
		}

		// Degenerate case frequently trips people up. Check for it here so that
		// people know it doesn't work.
		if (!tag) {
			throw new TypeError("selector cannot be an empty string")
		}

		var hasAttrs = checkForAttrs(pairs)

		var args = []
		for (var i = hasAttrs ? 2 : 1; i < arguments.length; i++) {
			args.push(arguments[i])
		}

		var children

		if (args.length === 1 && isArray(args[0])) {
			children = args[0]
		} else {
			children = args
		}

		var cell = {
			tag: "div",
			attrs: {},
			children: children
		}

		assignAttrs(
			cell.attrs,
			hasAttrs ? pairs : {},
			hasAttrs && "class" in pairs ? "class" : "className",
			parseSelector(tag, cell)
		)

		return cell
	}

	function forKeys(list, f, inst) {
		for (var i = 0; i < list.length; i++) {
			var attrs = list[i]
			attrs = attrs && attrs.attrs
			if (attrs && attrs.key != null && f.call(inst, attrs, i)) {
				break
			}
		}
	}

	// This function was causing deopts in Chrome.
	function dataToString(data) {
		// data.toString() might throw or return null if data is the return
		// value of Console.log in some versions of Firefox
		try {
			if (data != null && data.toString() != null) {
				return data
			}
		} catch (e) {
			// Swallow all errors here.
		}

		return ""
	}

	function flatten(list) {
		// recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list)
				// check current index again while there is an array at this
				// index.
				i--
			}
		}

		return list
	}

	function insertNode(parent, node, index) {
		parent.insertBefore(node, parent.childNodes[index] || null)
	}

	// the below recursively manages creation/diffing/removal of DOM elements
	// based on comparison between `data` and `cached`
	//
	// the diff algorithm can be summarized as this:
	// 1) compare `data` and `cached`
	// 2) if they are different, copy `data` to `cached` and update the DOM
	//    based on what the difference is
	// 3) recursively apply this algorithm for every array and for the
	//    children of every virtual element
	//
	// the `cached` data structure is essentially the same as the previous
	// redraw's `data` data structure, with a few additions:
	// - `cached` always has a property called `nodes`, which is a list of
	//    DOM elements that correspond to the data represented by the
	//    respective virtual element
	// - in order to support attaching `nodes` as a property of `cached`,
	//    `cached` is *always* a non-primitive object, i.e. if the data was
	//    a string, then cached is a String instance. If data was `null` or
	//    `undefined`, cached is `new String("")`
	// - `cached also has a `configContext` property, which is the state
	//    storage object exposed by config(element, isInitialized, context)
	// - when `cached` is an Object, it represents a virtual element; when
	//    it's an Array, it represents a list of elements; when it's a
	//    String, Number or Boolean, it represents a text node
	//
	// `parentElement` is a DOM element used for W3C DOM API calls
	// `parentTag` is only used for handling a corner case for textarea
	// values
	// `parentCache` is used to remove nodes in some multi-node cases
	// `parentIndex` and `index` are used to figure out the offset of nodes.
	// They're artifacts from before arrays started being flattened and are
	// likely refactorable
	// `data` and `cached` are, respectively, the new and old nodes being
	// diffed
	// `shouldReattach` is a flag indicating whether a parent node was
	// recreated (if so, and if this node is reused, then this node must
	// reattach itself to the new parent)
	// `editable` is a flag that indicates whether an ancestor is
	// contenteditable
	// `namespace` indicates the closest HTML namespace as it cascades down
	// from an ancestor
	// `configs` is a list of config functions to run after the topmost
	// `build` call finishes running
	//
	// there's logic that relies on the assumption that null and undefined
	// data are equivalent to empty strings
	// - this prevents lifecycle surprises from procedural helpers that mix
	//   implicit and explicit return statements (e.g.
	//   function foo() {if (cond) return m("div")}
	// - it simplifies diffing code

	function Builder(
		parentElement,
		parentTag,
		parentCache,
		parentIndex,
		data,
		cached,
		shouldReattach,
		index,
		editable,
		namespace,
		configs
	) {
		this.parentElement = parentElement
		this.parentTag = parentTag
		this.parentCache = parentCache
		this.parentIndex = parentIndex
		this.data = data
		this.cached = cached
		this.shouldReattach = shouldReattach
		this.index = index
		this.editable = editable
		this.namespace = namespace
		this.configs = configs
	}

	Builder.prototype.build = function () {
		this.data = dataToString(this.data)
		if (this.data.subtree === "retain") return this.cached
		this.makeCache()

		if (isArray(this.data)) {
			return this.buildArray()
		} else if (this.data != null && isObject(this.data)) {
			return this.buildObject()
		} else if (isFunction(this.data)) {
			return this.cached
		} else {
			return this.handleTextNode()
		}
	}

	Builder.prototype.makeCache = function () {
		if (this.cached != null) {
			if (type.call(this.cached) === type.call(this.data)) {
				return
			}

			if (this.parentCache && this.parentCache.nodes) {
				var offset = this.index - this.parentIndex
				var end = offset +
					(isArray(this.data) ? this.data : this.cached.nodes).length

				clear(
					this.parentCache.nodes.slice(offset, end),
					this.parentCache.slice(offset, end))
			} else if (this.cached.nodes) {
				clear(this.cached.nodes, this.cached)
			}
		}

		this.cached = new this.data.constructor()
		// if constructor creates a virtual dom element, use a blank object as
		// the base cached node instead of copying the virtual el (#277)
		if (this.cached.tag) this.cached = {}
		this.cached.nodes = []
	}

	var DELETION = 1
	var INSERTION = 2
	var MOVE = 3

	function buildArrayKeys(data) {
		var guid = 0
		forKeys(data, function () {
			forEach(data, function (attrs) {
				attrs = attrs && attrs.attrs
				if (attrs && attrs.key == null) {
					attrs.key = "__mithril__" + guid++
				}
			})
			return true
		})
	}

	Builder.prototype.buildArrayChild = function (child, cached, count) {
		return new Builder(
			this.parentElement,
			this.parentTag,
			this.cached,
			this.index,
			child,
			cached,
			this.shouldReattach,
			this.index + count || count,
			this.editable,
			this.namespace,
			this.configs
		).build()
	}

	Builder.prototype.buildArray = function () {
		this.data = flatten(this.data)
		var nodes = []
		var intact = this.cached.length === this.data.length
		var subArrayCount = 0

		// keys algorithm:
		// sort elements without recreating them if keys are present
		//
		// 1) create a map of all existing keys, and mark all for deletion
		// 2) add new keys to map and mark them for addition
		// 3) if key exists in new list, change action from deletion to a move
		// 4) for each key, handle its corresponding action as marked in
		//    previous steps
		var existing = {}
		var shouldMaintainIdentities = false
		forKeys(this.cached, function (attrs, i) {
			shouldMaintainIdentities = true
			existing[attrs.key] = {
				action: DELETION,
				index: i
			}
		})

		buildArrayKeys(this.data)
		if (shouldMaintainIdentities) {
			this.diffKeys(existing)
		}
		// end key algorithm

		// don't change: faster than forEach
		var cacheCount = 0
		for (var i = 0, len = this.data.length; i < len; i++) {
			// diff each item in the array
			var item = this.buildArrayChild(
				this.data[i],
				this.cached[cacheCount],
				subArrayCount
			)

			if (item !== undefined) {
				intact = intact && item.nodes.intact
				subArrayCount += getSubArrayCount(item)
				this.cached[cacheCount++] = item
			}
		}

		if (!intact) this.diffArray(nodes)

		return this.cached
	}

	Builder.prototype.diffKeys = function (existing) {
		var keysDiffer = this.data.length !== this.cached.length

		if (!keysDiffer) {
			forKeys(this.data, function (attrs, i) {
				var cachedCell = this[i] // eslint-disable-line no-invalid-this
				return keysDiffer = cachedCell &&
					cachedCell.attrs &&
					cachedCell.attrs.key !== attrs.key
			}, this.cached)
		}

		if (keysDiffer) {
			this.handleKeysDiffer(existing)
		}
	}

	// Simple `this` helper
	function thisPush(value) {
		this.push(value) // eslint-disable-line no-invalid-this
	}

	Builder.prototype.handleKeysDiffer = function (existing) {
		forKeys(this.data, function (key, i) {
			key = key.key
			if (existing[key]) {
				existing[key] = {
					action: MOVE,
					index: i,
					from: existing[key].index,
					element: this[existing[key].index] || // eslint-disable-line
						$document.createElement("div")
				}
			} else {
				existing[key] = {
					action: INSERTION,
					index: i
				}
			}
		}, this.cached.nodes)

		var actions = []
		forOwn(existing, thisPush, actions)

		var changes = actions.sort(sortChanges)
		var newCached = new Array(this.cached.length)
		newCached.nodes = this.cached.nodes.slice()

		forEach(changes, function (change) {
			/* eslint-disable no-invalid-this */
			var index = change.index

			switch (change.action) {
			case DELETION:
				clear(this.cached[index].nodes, this.cached[index])
				newCached.splice(index, 1)
				break

			case INSERTION:
				var dummy = $document.createElement("div")
				dummy.key = this.data[index].attrs.key
				insertNode(this.parentElement, dummy, index)
				newCached.splice(index, 0, {
					attrs: {key: this.data[index].attrs.key},
					nodes: [dummy]
				})
				newCached.nodes[index] = dummy
				break

			case MOVE:
				var changeElement = change.element
				var maybeChanged = this.parentElement.childNodes[index]
				if (maybeChanged !== changeElement && changeElement !== null) {
					this.parentElement.insertBefore(
						changeElement,
						maybeChanged || null
					)
				}
				newCached[index] = this.cached[change.from]
				newCached.nodes[index] = changeElement
			}
			/* eslint-enable no-invalid-this */
		}, this)

		this.cached = newCached
	}

	// diffs the array itself
	Builder.prototype.diffArray = function (nodes) {
		// update the list of DOM nodes by collecting the nodes from each item
		for (var i = 0; i < this.data.length; i++) {
			var cached = this.cached[i]
			if (cached != null) {
				nodes.push.apply(nodes, cached.nodes)
			}
		}

		// remove items from the end of the array if the new array is shorter
		// than the old one. if errors ever happen here, the issue is most
		// likely a bug in the construction of the `cached` data structure
		// somewhere earlier in the program
		forEach(this.cached.nodes, function (node, i) {
			/* eslint-disable no-invalid-this */
			if (node.parentNode != null && nodes.indexOf(node) < 0) {
				clear([node], [this[i]])
			}
			/* eslint-enable no-invalid-this */
		}, this.cached)

		if (this.data.length < this.cached.length) {
			this.cached.length = this.data.length
		}

		this.cached.nodes = nodes
	}

	Builder.prototype.initAttrs = function () {
		var dataAttrs = this.data.attrs = this.data.attrs || {}
		this.cached.attrs = this.cached.attrs || {}

		var dataAttrKeys = Object.keys(this.data.attrs)
		this.maybeRecreateObject(dataAttrKeys)

		return dataAttrKeys.length > +("key" in dataAttrs)
	}

	Builder.prototype.buildObject = function () {
		var views = []
		var controllers = []

		this.markViews(views, controllers)

		if (!this.data.tag && controllers.length) {
			throw new Error("Component template must return a virtual " +
				"element, not an array, string, etc.")
		}

		var hasKeys = this.initAttrs()

		if (isString(this.data.tag)) {
			return new ObjectBuilder(
				this,
				hasKeys,
				views,
				controllers
			).build()
		}
	}

	Builder.prototype.markViews = function (views, controllers) {
		var cached = this.cached && this.cached.controllers
		while (this.data.view != null) {
			this.checkView(cached, controllers, views)
		}
	}

	var forcing = false
	var pendingRequests = 0

	Builder.prototype.checkView = function (cached, controllers, views) {
		var view = this.data.view.$original || this.data.view
		var controller = getController(
			this.cached.views,
			view,
			cached,
			this.data.controller
		)

		// Faster to coerce to number and check for NaN
		var key = +(this.data && this.data.attrs && this.data.attrs.key)

		if (pendingRequests === 0 || forcing ||
				cached && cached.indexOf(controller) > -1) {
			this.data = this.data.view(controller)
		} else {
			this.data = {tag: "placeholder"}
		}

		if (this.data.subtree === "retain") return this.cached
		if (key === key) { // eslint-disable-line no-self-compare
			(this.data.attrs = this.data.attrs || {}).key = key
		}
		updateLists(views, controllers, view, controller)
	}

	var unloaders = []

	function updateLists(views, controllers, view, controller) {
		views.push(view)
		var idx = controllers.push(controller) - 1
		unloaders[idx] = {
			views: views,
			view: view,
			controller: controller,
			controllers: controllers,
			handler: function (ev) {
				var i = this.controllers.indexOf(this.controller)
				this.controllers.splice(i, 1)
				i = this.views.indexOf(this.view)
				this.views.splice(i, 1)
				var unload = this.controller && this.controller.onunload
				if (type.call(unload) === "[object Function]") {
					this.controller.onunload(ev)
				}
			}
		}
	}

	function getController(views, view, cached, controller) {
		var index = m.redraw.strategy() === "diff" && views ?
			views.indexOf(view) :
			-1

		if (index > -1) {
			return cached[index]
		} else if (typeof controller === "function") {
			return new controller()
		} else {
			return {}
		}
	}

	function unloadSingleController(controller) {
		if (controller.unload) {
			controller.onunload({preventDefault: noop})
		}
	}

	Builder.prototype.maybeRecreateObject = function (dataAttrKeys) {
		// if an element is different enough from the one in cache, recreate it
		if (this.elemIsDifferentEnough(dataAttrKeys)) {
			if (this.cached.nodes.length) clear(this.cached.nodes)
			if (this.cached.configContext &&
					isFunction(this.cached.configContext.onunload)) {
				this.cached.configContext.onunload()
			}

			if (this.cached.controllers) {
				forEach(this.cached.controllers, unloadSingleController)
			}
		}
	}

	// shallow array compare, sorts
	function arraySortCompare(a, b) {
		a.sort()
		b.sort()
		var len = a.length
		if (len !== b.length) return false
		for (var i = 0; i < len; i++) {
			if (a[i] !== b[i]) return false
		}
		return true
	}

	Builder.prototype.elemIsDifferentEnough = function (dataAttrKeys) {
		var data = this.data
		var cached = this.cached
		if (data.tag !== cached.tag) return true
		if (!arraySortCompare(dataAttrKeys, Object.keys(cached.attrs))) {
			return true
		}

		if (data.attrs.id !== cached.attrs.id) return true
		if (data.attrs.key !== cached.attrs.key) return true

		if (m.redraw.strategy() === "all") {
			return !cached.configContext || cached.configContext.retain !== true
		} else if (m.redraw.strategy() === "diff") {
			return cached.configContext && cached.configContext.retain === false
		} else {
			return false
		}
	}

	function getObjectNamespace(builder) {
		var data = builder.data

		return data.attrs.xmlns ? data.attrs.xmlns :
			data.tag === "svg" ? "http://www.w3.org/2000/svg" :
			data.tag === "math" ? "http://www.w3.org/1998/Math/MathML" :
			builder.namespace
	}

	function ObjectBuilder(builder, hasKeys, views, controllers) {
		this.builder = builder
		this.hasKeys = hasKeys
		this.views = views
		this.controllers = controllers
		this.namespace = getObjectNamespace(builder)
	}

	ObjectBuilder.prototype.buildNewNode = function () {
		var node = this.createNode()
		this.builder.cached = this.reconstruct(
			node,
			this.createAttrs(node),
			this.buildChildren(node)
		)
		return node
	}

	ObjectBuilder.prototype.build = function () {
		var builder = this.builder
		var isNew = builder.cached.nodes.length === 0
		var node = isNew ? this.buildNewNode() : this.buildUpdatedNode()
		if (isNew || builder.shouldReattach && node != null) {
			insertNode(builder.parentElement, node, builder.index)
		}
		builder.scheduleConfigs(node, isNew)
		return builder.cached
	}

	ObjectBuilder.prototype.createNode = function () {
		var data = this.builder.data
		if (this.namespace === undefined) {
			if (data.attrs.is) {
				return $document.createElement(data.tag, data.attrs.is)
			} else {
				return $document.createElement(data.tag)
			}
		} else if (data.attrs.is) {
			return $document.createElementNS(this.namespace, data.tag,
				data.attrs.is)
		} else {
			return $document.createElementNS(this.namespace, data.tag)
		}
	}

	ObjectBuilder.prototype.createAttrs = function (node) {
		var data = this.builder.data
		if (this.hasKeys) {
			return setAttributes(node, data.tag, data.attrs, {}, this.namespace)
		} else {
			return data.attrs
		}
	}

	ObjectBuilder.prototype.makeChild = function (node, shouldReattach) {
		var builder = this.builder
		return new Builder(
			node,
			builder.data.tag,
			undefined,
			undefined,
			builder.data.children,
			builder.cached.children,
			shouldReattach,
			0,
			builder.data.attrs.contenteditable ? node : builder.editable,
			this.namespace,
			builder.configs
		).build()
	}

	ObjectBuilder.prototype.buildChildren = function (node) {
		var data = this.builder.data
		if (data.children != null && data.children.length !== 0) {
			return this.makeChild(node, true)
		} else {
			return data.children
		}
	}

	ObjectBuilder.prototype.reconstruct = function (node, attrs, children) {
		var data = this.builder.data
		var cached = {
			tag: data.tag,
			attrs: attrs,
			children: children,
			nodes: [node]
		}

		this.unloadCachedControllers(cached)

		if (cached.children && !cached.children.nodes) {
			cached.children.nodes = []
		}

		// edge case: setting value on <select> doesn't work before children
		// exist, so set it again after children have been created
		if (data.tag === "select" && "value" in data.attrs) {
			setAttributes(node, data.tag, {value: data.attrs.value}, {},
				this.namespace)
		}
		return cached
	}

	function unloadSingleCachedController(controller) {
		if (controller.onunload && controller.onunload.$old) {
			controller.onunload = controller.onunload.$old
		}

		if (pendingRequests && controller.onunload) {
			var onunload = controller.onunload
			controller.onunload = noop
			controller.onunload.$old = onunload
		}
	}

	ObjectBuilder.prototype.unloadCachedControllers = function (cached) {
		if (this.controllers.length) {
			cached.views = this.views
			cached.controllers = this.controllers
			forEach(this.controllers, unloadSingleCachedController)
		}
	}

	ObjectBuilder.prototype.buildUpdatedNode = function () {
		var builder = this.builder
		var node = builder.cached.nodes[0]
		if (this.hasKeys) {
			setAttributes(
				node,
				builder.data.tag,
				builder.data.attrs,
				builder.cached.attrs,
				this.namespace
			)
		}

		builder.cached.children = this.makeChild(node, false)
		builder.cached.nodes.intact = true

		if (this.controllers.length) {
			builder.cached.views = this.views
			builder.cached.controllers = this.controllers
		}

		return node
	}

	Builder.prototype.scheduleConfigs = function (node, isNew) {
		var data = this.data
		var cached = this.cached
		// schedule configs to be called. They are called after `build` finishes
		// running
		var config = data.attrs.config
		if (isFunction(config)) {
			var context = cached.configContext = cached.configContext || {}

			// bind
			this.configs.push(function () {
				return config.call(data, node, !isNew, context, cached)
			})
		}
	}

	Builder.prototype.handleTextNode = function () {
		if (this.cached.nodes.length === 0) {
			return this.handleNonexistentNodes()
		} else if (this.cached.valueOf() !== this.data.valueOf() ||
				this.shouldReattach) {
			return this.reattachNodes()
		} else {
			this.cached.nodes.intact = true
			return this.cached
		}
	}

	Builder.prototype.handleNonexistentNodes = function () {
		var nodes
		if (this.data.$trusted) {
			nodes = injectHTML(this.parentElement, this.index, this.data)
		} else {
			nodes = [$document.createTextNode(this.data)]
			if (!voidElements.test(this.parentElement.nodeName)) {
				insertNode(this.parentElement, nodes[0], this.index)
			}
		}

		var cached

		if (typeof this.data === "string" ||
				typeof this.data === "number" ||
				typeof this.data === "boolean") {
			cached = new this.data.constructor(this.data)
		} else {
			cached = this.data
		}

		cached.nodes = nodes

		return cached
	}

	Builder.prototype.reattachNodes = function () {
		var nodes = this.cached.nodes
		if (!this.editable || this.editable !== $document.activeElement) {
			if (this.data.$trusted) {
				clear(nodes, this.cached)
				nodes = injectHTML(this.parentElement, this.index, this.data)
			} else if (this.parentTag === "textarea") {
				// <textarea> uses `value` instead of `nodeValue`.
				this.parentElement.value = this.data
			} else if (this.editable) {
				// contenteditable nodes use `innerHTML` instead of `nodeValue`.
				this.editable.innerHTML = this.data
			} else {
				// was a trusted string
				if (nodes[0].nodeType === 1 ||
					nodes.length > 1 ||
					(nodes[0].nodeValue.trim && !nodes[0].nodeValue.trim())
				) {
					clear(this.cached.nodes, this.cached)
					nodes = [$document.createTextNode(this.data)]
				}

				this.injectTextNode(nodes[0])
			}
		}

		this.cached = new this.data.constructor(this.data)
		this.cached.nodes = nodes
		return this.cached
	}

	// This function was causing deopts in Chrome.
	Builder.prototype.injectTextNode = function (first) {
		try {
			insertNode(this.parentElement, first, this.index)
			first.nodeValue = this.data
		} catch (e) {
			// IE erroneously throws error when appending an empty text node
			// after a null
		}
	}

	m.startComputation = function () { pendingRequests++ }
	m.endComputation = function () {
		if (pendingRequests > 1) {
			pendingRequests--
		} else {
			pendingRequests = 0
			m.redraw()
		}
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			// fix offset of next element if item was a trusted string w/ more
			// than one HTML element. the first clause in the regexp matches
			// elements the second clause (after the pipe) matches text nodes
			var match = item.match(/<[^\/]|\>\s*[^<]/g)
			if (match != null) return match.length
		} else if (isArray(item)) {
			return item.length
		} else {
			return 1
		}
	}

	function sortChanges(a, b) {
		return a.action - b.action || a.index - b.index
	}

	function shouldSetAttrDirectly(attr) {
		return attr !== "list" &&
			attr !== "style" &&
			attr !== "form" &&
			attr !== "type" &&
			attr !== "width" &&
			attr !== "height"
	}

	function trySetAttribute(attr, dataAttr, cachedAttr, node, namespace, tag) {
		if (attr === "config" || attr === "key") {
			// `config` and `key` aren't real attributes
			return
		} else if (isFunction(dataAttr) && attr.slice(0, 2) === "on") {
			// hook event handlers to the auto-redrawing system
			node[attr] = autoredraw(dataAttr, node)
		} else if (attr === "style" && dataAttr != null && isObject(dataAttr)) {
			// handle `style: {...}`
			forOwn(dataAttr, function (value, rule) {
				if (cachedAttr == null || cachedAttr[rule] !== value) {
					node.style[rule] = value
				}
			})

			for (var rule in cachedAttr) {
				if (hasOwn.call(cachedAttr, rule)) {
					if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
				}
			}
		} else if (namespace != null) {
			// handle SVG
			if (attr === "href") {
				node.setAttributeNS("http://www.w3.org/1999/xlink", "href",
					dataAttr)
			} else {
				node.setAttribute(attr === "className" ? "class" : attr,
					dataAttr)
			}
		} else if (attr in node && shouldSetAttrDirectly(attr)) {
			// handle cases that are properties (but ignore cases where we
			// should use setAttribute instead):
			//
			// - list and form are typically used as strings, but are DOM
			//   element references in js
			// - when using CSS selectors (e.g. `m("[style='']")`), style is
			//   used as a string, but it's an object in js
			//
			// #348
			// don't set the value if not needed otherwise cursor placement
			// breaks in Chrome
			if (tag !== "input" || node[attr] !== dataAttr) {
				node[attr] = dataAttr
			}
		} else {
			node.setAttribute(attr, dataAttr)
		}
	}

	function trySetSingle(attr, data, cached, node, namespace, tag) {
		try {
			trySetAttribute(attr, data, cached, node, namespace, tag)
		} catch (e) {
			// swallow IE's invalid argument errors to mimic HTML's
			// fallback-to-doing-nothing-on-invalid-attributes behavior
			if (e.message.indexOf("Invalid argument") < 0) throw e
		}
	}

	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		forOwn(dataAttrs, function (dataAttr, attr) {
			var cachedAttr = cachedAttrs[attr]
			if (!(attr in cachedAttrs) || (cachedAttr !== dataAttr)) {
				cachedAttrs[attr] = dataAttr
				trySetSingle(attr, dataAttr, cachedAttr, node, namespace, tag)
			} else if (attr === "value" && tag === "input" &&
					// #348: dataAttr may not be a string, so use loose
					// comparison
					node.value != dataAttr) { // eslint-disable-line eqeqeq
				node.value = dataAttr
			}
		})

		return cachedAttrs
	}

	function clearSingle(node) {
		try {
			node.parentNode.removeChild(node)
		} catch (e) {
			/* eslint-disable max-len */
			// ignore if this fails due to order of events (see
			// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
			/* eslint-enable max-len */
		}
	}

	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i >= 0; i--) {
			var node = nodes[i]
			if (node != null && node.parentNode) {
				clearSingle(nodes[i])
				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}

		// release memory if nodes is an array. This check should fail if nodes
		// is a NodeList (see loop above)
		if (nodes.length) nodes.length = 0
	}

	function maybeCallControllerOnunload(controller) {
		if (isFunction(controller.onunload)) {
			controller.onunload({preventDefault: noop})
		}
	}

	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload()
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			forEach(cached.controllers, maybeCallControllerOnunload)
		}
		if (cached.children) {
			if (isArray(cached.children)) {
				forEach(cached.children, unload)
			} else if (cached.children.tag) {
				unload(cached.children)
			}
		}
	}

	var insertAdjacentBeforeEnd = (function () {
		try {
			$document.createRange().createContextualFragment("x")
			return function (parent, data) {
				parent.appendChild(
					$document.createRange().createContextualFragment(data))
			}
		} catch (e) {
			return function (parent, data) {
				parent.insertAdjacentHTML("beforeend", data)
			}
		}
	})()

	function injectHTML(parent, index, data) {
		var nextSibling = parent.childNodes[index]

		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1
			var placeholder = $document.createElement("span")

			if (isElement) {
				parent.insertBefore(placeholder, nextSibling || null)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parent.removeChild(placeholder)
			} else {
				nextSibling.insertAdjacentHTML("beforebegin", data)
			}
		} else {
			insertAdjacentBeforeEnd(parent, data)
		}

		var nodes = []
		while (parent.childNodes[index] !== nextSibling) {
			nodes.push(parent.childNodes[index])
			index++
		}

		return nodes
	}
	function autoredraw(callback, object) {
		return function (e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {
				return callback.call(object, e)
			} finally {
				endFirstComputation()
			}
		}
	}

	var html
	var documentNode = {
		appendChild: function (node) {
			if (html === undefined) {
				html = $document.createElement("html")
			}

			if ($document.documentElement &&
					$document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			} else {
				$document.appendChild(node)
			}

			this.childNodes = $document.childNodes
		},

		insertBefore: function (node) {
			this.appendChild(node)
		},

		childNodes: []
	}

	var nodeCache = []
	var cellCache = {}

	function voidCall(func) {
		func()
	}

	m.render = function (root, cell, forceRecreation) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render exists.")
		}

		var configs = []
		var id = getCellCacheKey(root)
		var isDocumentRoot = root === $document
		var node

		if (isDocumentRoot || root === $document.documentElement) {
			node = documentNode
		} else {
			node = root
		}

		if (isDocumentRoot && cell.tag !== "html") {
			cell = {tag: "html", attrs: {}, children: cell}
		}

		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)

		cellCache[id] = new Builder(
			// parentElement
			node,
			// parentTag
			null,
			// parentCache
			undefined,
			// parentIndex
			undefined,
			// data
			cell,
			// cached
			cellCache[id],
			// shouldReattach
			false,
			// index
			0,
			// editable
			null,
			// namespace
			undefined,
			// configs
			configs
		).build()

		forEach(configs, voidCall)
	}

	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function (value) {
		value = new String(value) // eslint-disable-line no-new-wrappers
		value.$trusted = true
		return value
	}

	function gettersetter(store) {
		function prop() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function () {
			return store
		}

		return prop
	}

	function isPromise(object) {
		return object != null && (isObject(object) || isFunction(object)) &&
				isFunction(object.then)
	}

	function simpleResolve(p, callback) {
		if (p.then) {
			return p.then(callback)
		} else {
			return callback()
		}
	}

	function propify(promise) {
		var prop = m.prop()
		promise.then(prop)

		prop.then = function (resolve, reject) {
			return promise.then(function () {
				return resolve(prop())
			}, reject)
		}

		prop.catch = function (reject) {
			return promise.then(function () {
				return prop()
			}, reject)
		}

		prop.finally = function (callback) {
			return promise.then(function (value) {
				return simpleResolve(callback(), function () {
					return value
				})
			}, function (reason) {
				return simpleResolve(callback(), function () {
					throw reason
				})
			})
		}

		return prop
	}

	m.prop = function (store) {
		if (isPromise(store)) {
			return propify(store)
		} else {
			return gettersetter(store)
		}
	}

	var roots = []
	var components = []
	var controllers = []
	var computePreRedrawHook = null
	var computePostRedrawHook = null
	var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms
	var topComponent

	function initComponent(component, root, index, isPrevented) {
		var isNullComponent = component === null

		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			component = topComponent = component || {controller: noop}
			var controller = new (component.controller || noop)()
			// controllers may call m.mount recursively (via m.route redirects,
			// for example). this conditional ensures only the last recursive
			// m.mount call is applied
			if (component === topComponent) {
				controllers[index] = controller
				components[index] = component
			}

			endFirstComputation()

			if (isNullComponent) {
				removeRootElement(root, index)
			}

			return controllers[index]
		}

		if (isNullComponent) {
			removeRootElement(root, index)
		}
	}

	function callUnloaderHandler(unloader) {
		if (unloader.controller != null) {
			unloader.handler(this) // eslint-disable-line no-invalid-this
			unloader.controller.onunload = null
		}
	}

	function setPreventedUnloader(unloader) {
		unloader.controller.onunload = unloader.handler
	}

	m.mount = m.module = function (root, component) {
		if (!root) {
			throw new Error("Please ensure the DOM element exists before " +
				"rendering a template into it.")
		}

		var index = roots.indexOf(root)
		if (index < 0) index = roots.length

		var isPrevented = false

		var ev = {
			preventDefault: function () {
				isPrevented = true
				computePreRedrawHook = computePostRedrawHook = null
			}
		}

		forEach(unloaders, callUnloaderHandler, ev)

		if (isPrevented) {
			forEach(unloaders, setPreventedUnloader)
		} else {
			unloaders = []
		}

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(ev)
		}

		return initComponent(component, root, index, isPrevented)
	}

	function removeRootElement(root, index) {
		roots.splice(index, 1)
		controllers.splice(index, 1)
		components.splice(index, 1)
		reset(root)
		nodeCache.splice(getCellCacheKey(root), 1)
	}

	// lastRedrawId is a positive number if a second redraw is requested before
	// the next animation frame, or 0 if it's the first redraw and not an event
	// handler
	var lastRedrawId = 0
	var lastRedrawCallTime = 0

	function actuallyPerformRedraw() {
		if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
		lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
	}

	// when setTimeout:
	// only reschedule redraw if time between now and previous redraw is bigger
	// than a frame, otherwise keep currently scheduled timeout
	//
	// when rAF:
	// always reschedule redraw
	var performRedraw = $requestAnimationFrame ===
			window.requestAnimationFrame ?
		actuallyPerformRedraw :
		function () {
			if (+new Date() - lastRedrawCallTime > FRAME_BUDGET) {
				actuallyPerformRedraw()
			}
		}

	var redrawing = false

	function resetLastRedrawId() {
		lastRedrawId = 0
	}

	function attemptRedraw(force) {
		if (lastRedrawId && !force) {
			performRedraw()
		} else {
			redraw()
			lastRedrawId = $requestAnimationFrame(resetLastRedrawId,
				FRAME_BUDGET)
		}
	}

	m.redraw = function (force) {
		if (redrawing) return
		redrawing = true
		if (force) forcing = true
		try {
			attemptRedraw(force)
		} finally {
			redrawing = forcing = false
		}
	}

	m.redraw.strategy = m.prop()

	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}

		for (var i = 0; i < roots.length; i++) {
			var root = roots[i]
			var component = components[i]
			var controller = controllers[i]
			if (controller != null) {
				m.render(
					root,
					component.view ?
						component.view(controller, [controller]) :
						""
				)
			}
		}

		// after rendering within a routed context, we need to scroll back to
		// the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}

		lastRedrawId = null
		lastRedrawCallTime = new Date()
		m.redraw.strategy("diff")
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		} else {
			m.endComputation()
		}
	}

	m.withAttr = function (prop, withAttrCallback, callbackThis) {
		return function (e) {
			/* eslint-disable no-invalid-this */
			e = e || event
			var currentTarget = e.currentTarget || this
			var _this = callbackThis || this
			var targetProp

			if (prop in currentTarget) {
				targetProp = currentTarget[prop]
			} else {
				targetProp = currentTarget.getAttribute(prop)
			}

			withAttrCallback.call(_this, targetProp)
			/* eslint-enable no-invalid-this */
		}
	}

	// routing
	var modes = {
		pathname: "",
		hash: "#",
		search: "?"
	}

	var redirect = noop
	var isDefaultRoute = false
	var routeParams, currentRoute

	function historyListener() {
		var path = $location[m.route.mode]
		if (m.route.mode === "pathname") path += $location.search
		if (currentRoute !== normalizeRoute(path)) redirect(path)
	}

	function runHistoryListener(listener) {
		window[listener] = historyListener
		computePreRedrawHook = setScroll
		window[listener]()
	}

	function getRouteBase() {
		return (m.route.mode === "pathname" ? "" : $location.pathname) +
			modes[m.route.mode]
	}

	function windowPushState() {
		window.history.pushState(null,
			$document.title,
			modes[m.route.mode] + currentRoute)
	}

	function windowReplaceState() {
		window.history.replaceState(null,
			$document.title,
			modes[m.route.mode] + currentRoute)
	}

	function computeAndLaunchRedirect(shouldReplaceHistoryEntry) {
		if (window.history.pushState) {
			computePreRedrawHook = setScroll
			computePostRedrawHook = shouldReplaceHistoryEntry ?
				windowReplaceState :
				windowPushState
			redirect(modes[m.route.mode] + currentRoute)
		} else {
			$location[m.route.mode] = currentRoute
			redirect(modes[m.route.mode] + currentRoute)
		}
	}

	function routeTo(route, params, shouldReplaceHistoryEntry) {
		if (arguments.length < 3 && typeof params !== "object") {
			shouldReplaceHistoryEntry = params
			params = null
		}

		var oldRoute = currentRoute

		currentRoute = route
		var args = params || {}
		var queryIndex = currentRoute.indexOf("?")
		var queryString, currentPath

		if (queryIndex >= 0) {
			var paramsObj = parseQueryString(currentRoute.slice(queryIndex + 1))
			forOwn(args, function (value, key) {
				paramsObj[key] = args[key]
			})
			queryString = buildQueryString(paramsObj)
			currentPath = currentRoute.slice(0, queryIndex)
		} else {
			queryString = buildQueryString(params)
			currentPath = currentRoute
		}

		if (queryString) {
			var delimiter = currentPath.indexOf("?") === -1 ? "?" : "&"
			currentRoute = currentPath + delimiter + queryString
		}

		return computeAndLaunchRedirect(shouldReplaceHistoryEntry ||
			oldRoute === route)
	}

	m.route = function (root, arg1, arg2, vdom) {
		if (arguments.length === 0) {
			// m.route()
			return currentRoute
		} else if (arguments.length === 3 && isString(arg1)) {
			// m.route(el, defaultRoute, routes)
			redirect = function (source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) {
						throw new Error("Ensure the default route matches " +
							"one of the routes defined in m.route")
					}

					isDefaultRoute = true
					m.route(arg1, true)
					isDefaultRoute = false
				}
			}

			runHistoryListener(
				m.route.mode === "hash" ? "onhashchange" : "onpopstate")
		} else if (root.addEventListener || root.attachEvent) {
			// config: m.route
			root.href = getRouteBase() + vdom.attrs.href
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive)
				root.addEventListener("click", routeUnobtrusive)
			} else {
				root.detachEvent("onclick", routeUnobtrusive)
				root.attachEvent("onclick", routeUnobtrusive)
			}
		} else if (isString(root)) {
			// m.route(route, params, shouldReplaceHistoryEntry)
			return routeTo.apply(this, arguments)
		}
	}

	m.route.param = function (key) {
		if (!routeParams) {
			throw new Error("You must call m.route(element, defaultRoute, " +
				"routes) before calling m.route.param()")
		}

		if (key) {
			return routeParams[key]
		} else {
			return routeParams
		}
	}

	m.route.mode = "search"

	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}

	function routeByValue(root, router, path) {
		var queryStart = path.indexOf("?")

		if (queryStart >= 0) {
			routeParams = parseQueryString(
				path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		} else {
			routeParams = {}
		}

		// Get all routes and check if there's an exact match for the current
		// path
		var keys = Object.keys(router)
		var index = keys.indexOf(path)

		if (index >= 0) {
			m.mount(root, router[keys[index]])
			return true
		}

		for (var route in router) {
			if (hasOwn.call(router, route)) {
				if (route === path) {
					m.mount(root, router[route])
					return true
				}

				var matcher = new RegExp("^" +
					route.replace(/:[^\/]+?\.{3}/g, "(.*?)")
						.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

				if (matcher.test(path)) {
					/* eslint-disable no-loop-func */
					path.replace(matcher, function () {
						var values = []
						for (var i = 1, end = arguments.length - 2; i < end;) {
							values.push(arguments[i++])
						}

						var keys = route.match(/:[^\/]+/g) || []
						forEach(keys, function (key, i) {
							key = key.replace(/:|\./g, "")
							routeParams[key] = decodeURIComponent(values[i])
						})
					})
					/* eslint-enable no-loop-func */
					m.mount(root, router[route])
					return true
				}
			}
		}
	}

	function routeUnobtrusive(e) {
		e = e || event

		if (e.ctrlKey || e.metaKey || e.which === 2) return

		if (e.preventDefault) {
			e.preventDefault()
		} else {
			e.returnValue = false
		}

		var currentTarget = e.currentTarget || e.srcElement

		var args

		if (m.route.mode === "pathname" && currentTarget.search) {
			args = parseQueryString(currentTarget.search.slice(1))
		} else {
			args = {}
		}

		while (currentTarget && currentTarget.nodeName.toUpperCase() !== "A") {
			currentTarget = currentTarget.parentNode
		}

		m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length),
			args)
	}

	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) {
			$location.hash = $location.hash
		} else {
			window.scrollTo(0, 0)
		}
	}

	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []
		forOwn(object, function (value, prop) {
			var key = prefix ? prefix + "[" + prop + "]" : prop

			if (value === null) {
				str.push(encodeURIComponent(key))
			} else if (isObject(value)) {
				str.push(buildQueryString(value, key))
			} else if (isArray(value)) {
				var keys = []
				duplicates[key] = duplicates[key] || {}
				/* eslint-disable-line no-loop-func  */
				forEach(value, function (item) {
					if (!duplicates[key][item]) {
						duplicates[key][item] = true
						keys.push(encodeURIComponent(key) + "=" +
							encodeURIComponent(item))
					}
				})
				/* eslint-enable-line no-loop-func  */
				str.push(keys.join("&"))
			} else if (value !== undefined) {
				str.push(encodeURIComponent(key) + "=" +
					encodeURIComponent(value))
			}
		})
		return str.join("&")
	}

	function parseQueryPair(string) {
		/* eslint-disable no-invalid-this */
		var pair = string.split("=")
		var key = decodeURIComponent(pair[0])
		var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
		if (this[key] != null) {
			if (!isArray(this[key])) this[key] = [this[key]]
			this[key].push(value)
		} else {
			this[key] = value
		}
		/* eslint-enable no-invalid-this */
	}

	function parseQueryString(str) {
		if (str === "" || str == null) return {}
		if (str.charAt(0) === "?") str = str.slice(1)

		var pairs = str.split("&")
		var params = {}
		forEach(pairs, parseQueryPair, params)

		return params
	}

	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString

	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	// Promiz.mithril.js | Zolmeister | MIT
	// a modified version of Promiz.js, which does not conform to Promises/A+
	// for two reasons:
	//
	// 1) `then` callbacks are called synchronously (because setTimeout is too
	// 	  slow, and the setImmediate polyfill is too big
	// 2) throwing subclasses of Error cause the error to be bubbled up instead
	//    of triggering rejection (because the spec does not account for the
	//    important use case of default browser error handling, i.e. message w/
	//    line number)
	var RESOLVING = 1
	var REJECTING = 2
	var RESOLVED = 3
	var REJECTED = 4

	function Deferred(onSuccess, onFailure) {
		var self = this
		var promiseValue
		var next = []
		var func = push

		function coerce(value, next, error) {
			if (isPromise(value)) {
				return value.then(function (value) {
					coerce(value, next, error)
				}, function (e) {
					coerce(e, error, error)
				})
			} else {
				return next(promiseValue = value)
			}
		}

		function resolve(deferred) {
			deferred.resolve(promiseValue)
		}

		function reject(deferred) {
			deferred.reject(promiseValue)
		}

		function push(deferred) {
			next.push(deferred)
		}

		function init(promise) {
			if (func !== reject) promise(promiseValue)
			return promise
		}

		self.resolve = function (value) {
			if (func === push) {
				fire(RESOLVING, value, self)
			}
			return this
		}

		self.reject = function (value) {
			if (func === push) {
				fire(REJECTING, value, self)
			}
			return this
		}

		self.promise = function (value) {
			if (arguments.length) coerce(value, noop, noop)
			return func !== reject ? promiseValue : undefined
		}

		self.promise.then = function (onSuccess, onFailure) {
			var deferred = new Deferred(onSuccess, onFailure)
			func(deferred)
			return init(deferred.promise)
		}

		self.promise.catch = function (callback) {
			return self.promise.then(null, callback)
		}

		self.promise.finally = function (callback) {
			function _callback() {
				var p = new Deferred().resolve(callback()).promise
				if (func !== reject) p(promiseValue)
				return p
			}

			return self.promise.then(function () {
				return _callback().then(function () {
					return promiseValue
				})
			}, function () {
				_callback().then(function () {
					throw promiseValue
				})
			})
		}

		function run(callback) {
			func = callback
			forEach(next, callback)
			// Clear these (which hold all the extra references)
			finish = fire = null // eslint-disable-line no-func-assign
		}

		function finish(value, state) {
			coerce(value, function () {
				run(state === RESOLVED ? resolve : reject)
			}, function () {
				run(reject)
			})
		}

		function doThen(value, deferred) {
			// count protects against abuse calls from spec checker
			var count = 0

			try {
				return value.then(function (value) {
					if (count++) return
					fire(RESOLVING, value, deferred)
				}, function (value) {
					if (count++) return
					fire(REJECTING, value, deferred)
				})
			} catch (e) {
				m.deferred.onerror(e)
				return fire(REJECTING, e, deferred)
			}
		}

		function notThennable(value, state, deferred) {
			try {
				if (state === RESOLVING && isFunction(onSuccess)) {
					value = onSuccess(value)
				} else if (state === REJECTING && isFunction(onFailure)) {
					value = onFailure(value)
					state = RESOLVING
				}
			} catch (e) {
				m.deferred.onerror(e)
				return finish(e, REJECTED)
			}

			if (value === deferred) {
				return finish(TypeError(), REJECTED)
			} else {
				return finish(value, state === RESOLVING ? RESOLVED : REJECTED)
			}
		}

		function fire(state, value, deferred) {
			// check if it's a thenable
			var thenable
			try {
				thenable = isPromise(value)
			} catch (e) {
				m.deferred.onerror(e)
				return fire(REJECTING, e, deferred)
			}

			if (state === REJECTING) {
				m.deferred.onerror(value)
			}

			if (thenable) {
				return doThen(value, deferred)
			} else {
				return notThennable(value, state, deferred)
			}
		}
	}

	m.deferred = function () {
		return new Deferred()
	}

	m.deferred.prototype = Deferred.prototype
	m.deferred.prototype.constructor = m.deferred

	function isNativeError(e) {
		return e instanceof EvalError ||
			e instanceof RangeError ||
			e instanceof ReferenceError ||
			e instanceof SyntaxError ||
			e instanceof TypeError ||
			e instanceof URIError
	}

	m.deferred.onerror = function (e) {
		if (isNativeError(e)) {
			pendingRequests = 0
			throw e
		}
	}

	m.sync = function (args) {
		var deferred = new Deferred()
		var outstanding = args.length
		var results = new Array(outstanding)
		var method = "resolve"

		function synchronizer(pos, resolved) {
			return function (value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding === 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false))
			})
		} else {
			deferred.resolve([])
		}

		return deferred.promise
	}

	function identity(value) {
		return value
	}

	function generateCallbackKey() {
		return "mithril_callback_" + new Date().getTime() + "_" +
			(Math.round(Math.random() * 1e16)).toString(36)
	}

	function getJsonp(options) {
		var callbackKey = generateCallbackKey()
		var script = $document.createElement("script")

		window[callbackKey] = function (resp) {
			script.parentNode.removeChild(script)

			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			})

			window[callbackKey] = undefined
		}

		script.onerror = function () {
			script.parentNode.removeChild(script)

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: '{"error": "Error making jsonp request"}'
				}
			})

			window[callbackKey] = undefined

			return false
		}

		script.onload = function () {
			return false
		}

		script.src = options.url +
			(options.url.indexOf("?") > 0 ? "&" : "?") +
			(options.callbackKey ? options.callbackKey : "callback") +
			"=" + callbackKey +
			"&" + buildQueryString(options.data || {})

		$document.body.appendChild(script)
	}

	function runXhr(options) {
		var xhr = new window.XMLHttpRequest()

		xhr.open(options.method, options.url, true, options.user,
			options.password)

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					options.onload({type: "load", target: xhr})
				} else {
					options.onerror({type: "error", target: xhr})
				}
			}
		}

		if (options.serialize === JSON.stringify &&
				options.data &&
				options.method !== "GET") {
			xhr.setRequestHeader("Content-Type",
				"application/json; charset=utf-8")
		}

		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}

		if (isFunction(options.config)) {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data

		if (options.method === "GET" || !options.data) {
			data = ""
		} else {
			data = options.data
		}

		if (data && (!isString(data) && data.constructor !== window.FormData)) {
			throw new Error("Request data should be either be a string or " +
				"FormData. Check the `serialize` option in `m.request`")
		}

		xhr.send(data)
		return xhr
	}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			return getJsonp(options)
		} else {
			return runXhr(options)
		}
	}

	function bindData(xhrOptions, data, serialize) {
		if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
			var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&"
			var querystring = buildQueryString(data)
			xhrOptions.url += querystring ? prefix + querystring : ""
		} else {
			xhrOptions.data = serialize(data)
		}
		return xhrOptions
	}

	function parameterizeUrl(url, data) {
		var tokens = url.match(/:[a-z]\w+/gi)
		if (tokens && data) {
			forEach(tokens, function (token) {
				var key = token.slice(1)
				url = url.replace(token, data[key])
				delete data[key]
			})
		}
		return url
	}

	function defaultExtract(jsonp) {
		return jsonp.responseText
	}

	m.request = function (options) {
		if (options.background !== true) m.startComputation()
		var deferred = new Deferred()

		var serialize = identity
		var deserialize = identity
		var extract = defaultExtract

		if (!options.dataType || options.dataType.toLowerCase() !== "jsonp") {
			serialize = options.serialize || JSON.stringify
			deserialize = options.deserialize || JSON.parse
			extract = options.extract || function (xhr) {
				if (xhr.responseText.length === 0 &&
						deserialize === JSON.parse) {
					return null
				} else {
					return xhr.responseText
				}
			}
		}

		options.serialize = serialize
		options.deserialize = deserialize

		options.method = (options.method || "GET").toUpperCase()
		options.url = parameterizeUrl(options.url, options.data)
		options = bindData(options, options.data, serialize)
		options.onload = options.onerror = function (ev) {
			ev = ev || event
			var doSuccess = ev.type === "load"
			var unwrap

			if (doSuccess) {
				unwrap = options.unwrapSuccess
			} else {
				unwrap = options.unwrapError
			}

			try {
				var response = (unwrap || identity)(
					deserialize(extract(ev.target, options)), ev.target)
				if (doSuccess) {
					if (isArray(response) && options.type) {
						forEach(response, function (res, i) {
							response[i] = new options.type(res)
						})
					} else if (options.type) {
						response = new options.type(response)
					}
					deferred.resolve(response)
				} else {
					deferred.reject(response)
				}
			} catch (e) {
				deferred.reject(e)
			} finally {
				if (options.background !== true) m.endComputation()
			}
		}

		ajax(options)
		deferred.promise(options.initialValue)
		return deferred.promise
	}

	return m
})
