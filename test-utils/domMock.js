/* global setTimeout, clearTimeout */

/*
Known limitations:
- `option.selected` can't be set/read when the option doesn't have a `select` parent
- `element.attributes` is just a map of attribute names => Attr objects stubs
- ...

*/

/*
options:
- spy:(f: Function) => Function
*/

export default function domMock($window, options) {
	options = options || {}
	var spy = options.spy || ((f) => f)
	var spymap = new Map()

	// This way I'm not also implementing a partial `URL` polyfill. Based on the
	// regexp at https://urlregex.com/, but adapted to allow relative URLs and
	// care only about HTTP(S) URLs.
	var urlHash = "#[?!/+=&;%@.\\w_-]*"
	var urlQuery = "\\?[!/+=&;%@.\\w_-]*"
	var urlPath = "/[+~%/.\\w_-]*"
	var urlRelative = urlPath + "(?:" + urlQuery + ")?(?:" + urlHash + ")?"
	var urlDomain = "https?://[A-Za-z0-9][A-Za-z0-9.-]+[A-Za-z0-9]"
	var validURLRegex = new RegExp(
		"^" + urlDomain + "(" + urlRelative + ")?$|" +
		"^" + urlRelative + "$|" +
		"^" + urlQuery + "(?:" + urlHash + ")?$|" +
		"^" + urlHash + "$"
	)

	var hasOwn = {}.hasOwnProperty
	var registerSpies = () => {}
	var getSpies

	if (options.spy) {
		registerSpies = (element, spies) => {
			var prev = spymap.get(element)
			if (prev) {
				Object.assign(prev, spies)
			} else {
				spymap.set(element, spies)
			}
		}

		getSpies = (element) => {
			if (element == null || typeof element !== "object") throw new Error("Element expected")
			return spymap.get(element)
		}
	}

	function isModernEvent(type) {
		return type === "transitionstart" || type === "transitionend" || type === "animationstart" || type === "animationend"
	}
	function dispatchEvent(e) {
		var stopped = false
		e.stopImmediatePropagation = function() {
			e.stopPropagation()
			stopped = true
		}
		e.currentTarget = this
		const record = this._events.get(e.type)
		if (record != null) {
			for (var i = 0; i < record.handlers.length; i++) {
				var useCapture = record.options[i].capture
				if (useCapture && e.eventPhase < 3 || !useCapture && e.eventPhase > 1) {
					var handler = record.handlers[i]
					if (typeof handler === "function") try {handler.call(this, e)} catch(e) {console.error(e)}
					else try {handler.handleEvent(e)} catch(e) {console.error(e)}
					if (stopped) return
				}
			}
		}
		// this is inaccurate. Normally the event fires in definition order, including legacy events
		// this would require getters/setters for each of them though and we haven't gotten around to
		// adding them since it would be at a high perf cost or would entail some heavy refactoring of
		// the mocks (prototypes instead of closures).
		if (e.eventPhase > 1 && typeof this["on" + e.type] === "function" && !isModernEvent(e.type)) {
			try {
				this["on" + e.type](e)
			} catch (e) {
				console.error(e)
			}
		}
	}

	class Attr {
		constructor(namespaceURI, value) {
			this.namespaceURI = namespaceURI
			// this is the correct kind of conversion, passing a Symbol throws in browsers too.
			this._value = `${value}`
		}
		get value() { return this._value }
		set value(value) { this._value = `${value}` }
		get nodeValue() { return this._value }
		set nodeValue(value) { this._value = `${value}` }
	}

	var declListTokenizer = /;|"(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*'/g
	/**
	 * This will split a semicolon-separated CSS declaration list into an array of
	 * individual declarations, ignoring semicolons in strings.
	 *
	 * Comments are also stripped.
	 *
	 * @param {string} declList
	 * @return {string[]}
	 */
	function splitDeclList(declList) {
		var indices = [], res = [], match

		// remove comments, preserving comments in strings.
		declList = declList.replace(
			/("(?:\\.|[^"\n])*"|'(?:\\.|[^'\n])*')|\/\*[\s\S]*?\*\//g,
			function(m, str){
				return str || ""
			}
		)
		/*eslint-disable no-cond-assign*/
		while (match = declListTokenizer.exec(declList)) {
			if (match[0] === ";") indices.push(match.index)
		}
		/*eslint-enable no-cond-assign*/
		for (var i = indices.length; i--;){
			res.unshift(declList.slice(indices[i] + 1))
			declList = declList.slice(0, indices[i])
		}
		res.unshift(declList)
		return res
	}
	function camelCase(string) {
		return string.replace(/-[a-z]/g, (match) => match[1].toUpperCase())
	}

	class CSSStyleDeclarationHandler {
		constructor(element) {
			this.element = element
			this.style = new Map()
			this.raws = new Set()
			this.cssText = undefined
		}

		preventExtensions() {
			return false
		}

		_setCSSText(value) {
			var buf = []
			if (typeof value === "string") {
				for (var key of this.style.keys()) this.style.set(key, "")
				const rules = splitDeclList(value)
				for (let i = 0; i < rules.length; i++) {
					const rule = rules[i]
					const colonIndex = rule.indexOf(":")
					if (colonIndex > -1) {
						const rawKey = rule.slice(0, colonIndex).trim()
						const key = camelCase(rawKey)
						const value = rule.slice(colonIndex + 1).trim()
						if (key !== "cssText") {
							this.style.set(rawKey, value)
							this.style.set(key, value)
							this.raws.add(rawKey)
							buf.push(rawKey + ": " + value + ";")
						}
					}
				}
				this.element.setAttribute("style", this.cssText = buf.join(" "))
			}
		}

		_getCSSText() {
			if (this.cssText != null) return this.cssText
			const result = []
			for (const key of this.raws) {
				result.push(`${key}: ${this.style.get(key)};`)
			}
			return this.cssText = result.join(" ")
		}

		get(target, key) {
			if (typeof key !== "string") return Reflect.get(target, key)
			if (Reflect.has(target, key)) return Reflect.get(target, key)
			const value = this.style.get(key)
			if (value !== undefined) return value
			switch (key) {
				case "cssText": return this._getCSSText()
				case "cssFloat": return this.style.get("float")
				default: return ""
			}
		}

		set(target, key, value) {
			if (typeof key !== "string") return Reflect.set(target, key)
			if (Reflect.has(target, key)) return Reflect.set(target, key)
			if (value == null) value = ""
			switch (key) {
				case "cssText": this._setCSSText(value); return true
				case "cssFloat": key = "float"; break
			}
			if (value === "") {
				this.style.delete(key)
				this.style.delete(camelCase(key))
				this.raws.add(key)
			} else {
				this.style.set(key, value)
				this.style.set(camelCase(key), value)
				this.raws.add(key)
			}
			this.cssText = undefined
			return true
		}
	}

	class CSSStyleDeclaration {
		constructor(element) {
			return new Proxy(this, new CSSStyleDeclarationHandler(element))
		}

		getPropertyValue(key) {
			return this[key]
		}

		removeProperty(key) {
			this[key] = this[camelCase(key)] = ""
		}

		setProperty(key, value) {
			this[key] = this[camelCase(key)] = value
		}
	}

	class ChildNode {
		constructor(nodeType, nodeName) {
			this.nodeType = nodeType
			this.nodeName = nodeName
			this.parentNode = null
		}

		remove() {
			if (this == null || typeof this !== "object" || !("nodeType" in this)) {
				throw new TypeError("Failed to execute 'remove', this is not of type 'ChildNode'")
			}
			var parent = this.parentNode
			if (parent == null) return
			var index = parent.childNodes.indexOf(this)
			if (index < 0) {
				throw new TypeError("BUG: child linked to parent, parent doesn't contain child")
			}
			parent.childNodes.splice(index, 1)
			this.parentNode = null
		}

		after(child) {
			if (this == null || typeof this !== "object" || !("nodeType" in this)) {
				throw new TypeError("Failed to execute 'remove', this is not of type 'ChildNode'")
			}
			if (child == null || typeof child !== "object" || !("nodeType" in child)) {
				throw new TypeError("Failed to execute 'remove', parameter is not of type 'ChildNode'")
			}
			var parent = this.parentNode
			if (parent == null) return
			var index = parent.childNodes.indexOf(this)
			if (index < 0) {
				throw new TypeError("BUG: child linked to parent, parent doesn't contain child")
			}
			child.remove()
			parent.childNodes.splice(index + 1, 0, child)
			child.parentNode = parent
		}

		get nextSibling() {
			if (this.parentNode == null) return null
			var index = this.parentNode.childNodes.indexOf(this)
			if (index < 0) throw new TypeError("Parent's childNodes is out of sync")
			return this.parentNode.childNodes[index + 1] || null
		}
	}

	class Text extends ChildNode {
		constructor(value) {
			super(3, "#text")
			this._value = `${value}`
		}

		get childNodes() {
			return []
		}

		get firstChild() {
			return null
		}

		get nodeValue() {
			return this._value
		}

		set nodeValue(value) {
			this._value = `${value}`
		}
	}

	class Element extends ChildNode {
		constructor(nodeName, ns) {
			if (ns == null) ns = "http://www.w3.org/1999/xhtml"
			super(1, nodeName)
			this._style = new CSSStyleDeclaration(this)
			this.namespaceURI = ns
			this.parentNode = null
			this.childNodes = []
			this.attributes = {}
			this.ownerDocument = $window.document
			this.onclick = null
			this._events = new Map()
		}

		appendChild(child) {
			var ancestor = this
			while (ancestor !== child && ancestor !== null) ancestor = ancestor.parentNode
			if (ancestor === child) throw new Error("Node cannot be inserted at the specified point in the hierarchy")

			if (child.nodeType == null) throw new Error("Argument is not a DOM element")

			var index = this.childNodes.indexOf(child)
			if (index > -1) this.childNodes.splice(index, 1)
			this.childNodes.push(child)
			if (child.parentNode != null && child.parentNode !== this) child.parentNode.removeChild(child)
			child.parentNode = this
		}

		removeChild(child) {
			if (child == null || typeof child !== "object" || !("nodeType" in child)) {
				throw new TypeError("Failed to execute removeChild, parameter is not of type 'Node'")
			}
			var index = this.childNodes.indexOf(child)
			if (index > -1) {
				this.childNodes.splice(index, 1)
				child.parentNode = null
			}
			else throw new TypeError("Failed to execute 'removeChild', child not found in parent")
		}

		insertBefore(child, refNode) {
			var ancestor = this
			while (ancestor !== child && ancestor !== null) ancestor = ancestor.parentNode
			if (ancestor === child) throw new Error("Node cannot be inserted at the specified point in the hierarchy")

			if (child.nodeType == null) throw new Error("Argument is not a DOM element")

			var refIndex = this.childNodes.indexOf(refNode)
			var index = this.childNodes.indexOf(child)
			if (refNode !== null && refIndex < 0) throw new TypeError("Invalid argument")
			if (index > -1) {
				this.childNodes.splice(index, 1)
				child.parentNode = null
			}
			if (refNode === null) this.appendChild(child)
			else {
				if (index !== -1 && refIndex > index) refIndex--
				this.childNodes.splice(refIndex, 0, child)
				if (child.parentNode != null && child.parentNode !== this) child.parentNode.removeChild(child)
				child.parentNode = this
			}
		}

		prepend(child) {
			this.insertBefore(child, this.firstChild)
		}

		hasAttribute(name) {
			return name in this.attributes
		}

		getAttribute(name) {
			if (this.attributes[name] == null) return null
			return this.attributes[name].value
		}

		setAttribute(name, value) {
			value = `${value}`
			if (hasOwn.call(this.attributes, name)) {
				this.attributes[name].value = value
			} else {
				this.attributes[name] = new Attr(null, value)
			}
		}

		setAttributeNS(ns, name, value) {
			if (hasOwn.call(this.attributes, name)) {
				this.attributes[name].namespaceURI = ns
				this.attributes[name].value = value
			} else {
				this.attributes[name] = new Attr(ns, value)
			}
		}

		removeAttribute(name) {
			delete this.attributes[name]
		}

		removeAttributeNS(ns, name) {
			// Namespace is ignored for now
			delete this.attributes[name]
		}

		contains(child) {
			while (child != null) {
				if (child === this) return true
				child = child.parentNode
			}
			return false
		}

		get firstChild() {
			return this.childNodes[0] || null
		}

		get nextSibling() {
			if (this.parentNode == null) return null
			var index = this.parentNode.childNodes.indexOf(this)
			if (index < 0) throw new TypeError("Parent's childNodes is out of sync")
			return this.parentNode.childNodes[index + 1] || null
		}

		// eslint-disable-next-line accessor-pairs
		set textContent(value) {
			this.childNodes = []
			if (value !== "") this.appendChild($window.document.createTextNode(value))
		}

		get style() {
			return this._style
		}

		set style(value) {
			this.style.cssText = value
		}

		get className() {
			if (this.namespaceURI === "http://www.w3.org/2000/svg") throw new Error("Cannot get property className of SVGElement")
			else return this.getAttribute("class")
		}

		set className(value) {
			if (this.namespaceURI === "http://www.w3.org/2000/svg") throw new Error("Cannot set property className of SVGElement")
			else this.setAttribute("class", value)
		}

		focus() {
			activeElement = this
		}

		blur() {
			if (activeElement === this) activeElement = null
		}

		addEventListener(type, handler, options) {
			if (arguments.length > 2) {
				if (typeof options === "object" && options != null) throw new TypeError("NYI: addEventListener options")
				else if (typeof options !== "boolean") throw new TypeError("boolean expected for useCapture")
				else options = {capture: options}
			} else {
				options = {capture: false}
			}
			const record = this._events.get(type)
			if (record == null) {
				this._events.set(type, {handlers: [handler], options: [options]})
			} else {
				for (var i = 0; i < record.handlers.length; i++) {
					if (record.handlers[i] === handler && record.options[i].capture === options.capture) {
						return
					}
				}
				record.handlers.push(handler)
				record.options.push(options)
			}
		}

		removeEventListener(type, handler, options) {
			if (arguments.length > 2) {
				if (typeof options === "object" && options != null) throw new TypeError("NYI: addEventListener options")
				else if (typeof options !== "boolean") throw new TypeError("boolean expected for useCapture")
				else options = {capture: options}
			} else {
				options = {capture: false}
			}
			const record = this._events.get(type)
			if (record != null) {
				for (var i = 0; i < record.handlers.length; i++) {
					if (record.handlers[i] === handler && record.options[i].capture === options.capture) {
						record.handlers.splice(i, 1)
						record.options.splice(i, 1)
						break
					}
				}
			}
		}

		dispatchEvent(e) {
			var parents = []
			if (this.parentNode != null) {
				var parent = this.parentNode
				do {
					parents.push(parent)
					parent = parent.parentNode
				} while (parent != null)
			}
			e.target = this
			var prevented = false
			e.preventDefault = function() {
				prevented = true
			}
			Object.defineProperty(e, "defaultPrevented", {
				configurable: true,
				get: function () { return prevented }
			})
			var stopped = false
			e.stopPropagation = function() {
				stopped = true
			}
			Object.defineProperty(e, "cancelBubble", {
				configurable: true,
				get: function () { return stopped }
			})
			e.eventPhase = 1
			try {
				for (var i = parents.length - 1; 0 <= i; i--) {
					dispatchEvent.call(parents[i], e)
					if (stopped) {
						return
					}
				}
				e.eventPhase = 2
				dispatchEvent.call(this, e)
				if (stopped) {
					return
				}
				e.eventPhase = 3
				for (var i = 0; i < parents.length; i++) {
					dispatchEvent.call(parents[i], e)
					if (stopped) {
						return
					}
				}
			} finally {
				e.eventPhase = 0
				if (!prevented) {
					if (this.nodeName === "INPUT" && this.attributes["type"] != null && this.attributes["type"].value === "checkbox" && e.type === "click") {
						this.checked = !this.checked
					}
				}
			}
		}
	}

	class HTMLAnchorElement extends Element {
		constructor() {
			super("A", null)
		}

		get href() {
			if (this.namespaceURI === "http://www.w3.org/2000/svg") {
				var val = this.hasAttribute("href") ? this.attributes.href.value : ""
				return {baseVal: val, animVal: val}
			} else if (this.namespaceURI === "http://www.w3.org/1999/xhtml") {
				if (!this.hasAttribute("href")) return ""
				// HACK: if it's valid already, there's nothing to implement.
				var value = this.attributes.href.value
				if (validURLRegex.test(encodeURI(value))) return value
			}
			return "[FIXME implement]"
		}

		set href(value) {
			// This is a readonly attribute for SVG, todo investigate MathML which may have yet another IDL
			if (this.namespaceURI !== "http://www.w3.org/2000/svg") this.setAttribute("href", value)
		}
	}

	class HTMLInputElement extends Element {
		constructor() {
			super("INPUT", null)
			this._checked = undefined
			this._value = ""

			registerSpies(this, {
				valueSetter: this._valueSetter = spy(this._setValue),
			})
		}

		_setValue(v) {
			this._value = v === null ? "" : `${v}`
		}

		get checked() {
			return this._checked === undefined ? this.hasAttribute("checked") : this._checked
		}

		set checked(value) {
			this._checked = Boolean(value)
		}

		get value() {
			return this._value
		}

		set value(value) {
			this._valueSetter(value)
		}

		get valueAsDate() {
			if (this.getAttribute("type") !== "date") return null
			return new Date(this._value).getTime()
		}

		set valueAsDate(v) {
			if (this.getAttribute("type") !== "date") throw new Error("invalid state")
			var time = new Date(v).getTime()
			this._valueSetter(isNaN(time) ? "" : new Date(time).toUTCString())
		}

		get valueAsNumber() {
			switch (this.getAttribute("type")) {
				case "date": return new Date(this._value).getTime()
				case "number": return new Date(this._value).getTime()
				default: return NaN
			}
		}

		set valueAsNumber(v) {
			v = Number(v)
			if (!isNaN(v) && !isFinite(v)) throw new TypeError("infinite value")
			switch (this.getAttribute("type")) {
				case "date": this._valueSetter(isNaN(v) ? "" : new Date(v).toUTCString()); break;
				case "number": this._valueSetter(`${v}`); break;
				default: throw new Error("invalid state")
			}
		}

		get type() {
			var type = this.getAttribute("type")
			if (type != null && (/^(?:radio|button|checkbox|color|date|datetime|datetime-local|email|file|hidden|month|number|password|range|research|search|submit|tel|text|url|week|image)$/).test(type)) {
				return type
			} else {
				return "text"
			}
		}

		set type(value) {
			this.setAttribute("type", value)
		}
	}

	class HTMLTextAreaElement extends Element {
		constructor() {
			super("TEXTAREA", null)
			this._value = undefined

			registerSpies(this, {
				valueSetter: this._valueSetter = spy(this._setValue),
			})
		}

		_setValue(v) {
			this._value = v === null ? "" : `${v}`
		}

		get value() {
			if (this._value === undefined && this.firstChild) {
				return this.firstChild.nodeValue
			} else {
				return this._value
			}
		}

		set value(value) {
			this._valueSetter(value)
		}
	}

	class HTMLCanvasElement extends Element {
		constructor() {
			super("CANVAS", null)
		}

		get width() {
			const value = this.getAttribute("width")
			// eslint-disable-next-line radix
			return value != null ? Math.floor(parseInt(value) || 0) : 300
		}

		set width(value) {
			this.setAttribute("width", Math.floor(Number(value) || 0).toString())
		}

		get height() {
			const value = this.getAttribute("height")
			// eslint-disable-next-line radix
			return value != null ? Math.floor(parseInt(value) || 0) : 300
		}

		set height(value) {
			this.setAttribute("height", Math.floor(Number(value) || 0).toString())
		}
	}

	function pushOptions(options, element) {
		for (const child of element.childNodes) {
			if (child.nodeName === "OPTION") {
				options.push(child)
			} else if (child.nodeName === "OPTGROUP") {
				pushOptions(options, child)
			}
		}
	}

	function getOptions(element) {
		const options = []
		pushOptions(options, element)
		return options
	}

	function getOptionValue(element) {
		const value = element.getAttribute("value")
		if (value != null) return value
		const child = element.firstChild
		if (child != null) return child.nodeValue
		return ""
	}

	class HTMLSelectElement extends Element {
		constructor() {
			super("SELECT", null)
			// this._selectedValue = undefined
			this._selectedIndex = 0

			registerSpies(this, {
				valueSetter: this._valueSetter = spy(this._setValue)
			})
		}

		_setValue(value) {
			if (value === null) {
				this._selectedIndex = -1
			} else {
				var options = getOptions(this)
				var stringValue = `${value}`
				for (var i = 0; i < options.length; i++) {
					if (getOptionValue(options[i]) === stringValue) {
						// this._selectedValue = stringValue
						this._selectedIndex = i
						return
					}
				}
				// this._selectedValue = stringValue
				this._selectedIndex = -1
			}
		}

		get selectedIndex() {
			if (getOptions(this).length) {
				return this._selectedIndex
			} else {
				return -1
			}
		}

		set selectedIndex(value) {
			var options = getOptions(this)
			if (value >= 0 && value < options.length) {
				// this._selectedValue = getOptionValue(options[selectedIndex])
				this._selectedIndex = value
			} else {
				// this._selectedValue = ""
				this._selectedIndex = -1
			}
		}

		get value() {
			if (this.selectedIndex > -1) {
				return getOptionValue(getOptions(this)[this.selectedIndex])
			}
			return ""
		}

		set value(value) {
			this._valueSetter(value)
		}
	}

	class HTMLOptionElement extends Element {
		constructor() {
			super("OPTION", null)
			registerSpies(this, {
				valueSetter: this._valueSetter = spy(this._setValue)
			})
		}

		_setValue(value) {
			this.setAttribute("value", value)
		}

		get value() {
			return getOptionValue(this)
		}

		set value(value) {
			this._valueSetter(value)
		}

		// TODO? handle `selected` without a parent (works in browsers)
		get selected() {
			var index = getOptions(this.parentNode).indexOf(this)
			return index === this.parentNode.selectedIndex
		}

		set selected(value) {
			if (value) {
				var index = getOptions(this.parentNode).indexOf(this)
				if (index > -1) this.parentNode.selectedIndex = index
			} else {
				this.parentNode.selectedIndex = 0
			}
		}
	}

	var activeElement = null
	var delay = 16, last = 0
	Object.assign($window, {
		window: $window,
		requestAnimationFrame(callback) {
			var elapsed = performance.now() - last
			return setTimeout(() => {
				last = performance.now()
				try {
					callback()
				} catch (e) {
					console.error(e)
				}
			}, delay - elapsed)
		},
		cancelAnimationFrame: clearTimeout,
		document: {
			defaultView: $window,
			createElement: function(tag) {
				if (!tag) throw new Error("Tag must be provided")
				tag = `${tag}`.toUpperCase()

				switch (tag) {
					case "A": return new HTMLAnchorElement()
					case "INPUT": return new HTMLInputElement()
					case "TEXTAREA": return new HTMLTextAreaElement()
					case "CANVAS": return new HTMLCanvasElement()
					case "SELECT": return new HTMLSelectElement()
					case "OPTION": return new HTMLOptionElement()
					default: return new Element(tag, null)
				}
			},
			createElementNS: function(ns, tag, is) {
				var element = this.createElement(tag, is)
				element.nodeName = tag
				element.namespaceURI = ns
				return element
			},
			createTextNode: function(text) {
				return new Text(text)
			},
			createEvent: function() {
				return {
					eventPhase: 0,
					initEvent: function(type) {this.type = type}
				}
			},
			get activeElement() {
				return activeElement
			},
		},
	})

	$window.document.documentElement = new Element("HTML", null)
	$window.document.documentElement.appendChild($window.document.head = new Element("HEAD", null))
	$window.document.documentElement.appendChild($window.document.body = new Element("BODY", null))

	if (options.spy) $window.__getSpies = getSpies
}
