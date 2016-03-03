;(function () { // eslint-disable-line no-extra-semi
	"use strict"

	/* eslint-disable no-extend-native */
	Array.prototype.forEach = Array.prototype.forEach || function (callback) {
		for (var i = 0; i < this.length; i++) {
			callback(this[i], i, this)
		}
	}

	Array.prototype.indexOf = Array.prototype.indexOf || function (item) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === item) return i
		}
		return -1
	}

	Array.prototype.map = Array.prototype.map || function (callback) {
		var results = []
		this.forEach(function (value, i, array) {
			results.push(callback(value, i, array))
		})
		return results
	}

	Array.prototype.filter = Array.prototype.filter || function (callback) {
		var results = []
		this.forEach(function (value, i, array) {
			if (callback(value, i, array)) results.push(value)
		})
		return results
	}

	Object.keys = Object.keys || function (obj) {
		var keys = []
		for (var i in obj) {
			if ({}.hasOwnProperty.call(obj, i)) {
				keys.push(i)
			}
		}
		return keys
	}
	/* eslint-enable no-extend-native */
})()

window.mock = (function () {
	"use strict"

	var window = {}

	window.window = window

	var document = window.document = {
		// FIXME: add document.createRange().createContextualFragment()

		childNodes: [],

		createElement: function (tag) {
			return {
				style: {},
				childNodes: [],
				nodeType: 1,
				nodeName: tag.toUpperCase(),
				appendChild: document.appendChild,
				removeChild: document.removeChild,
				replaceChild: document.replaceChild,
				insertBefore: function (node, reference) {
					node.parentNode = this
					var referenceIndex = this.childNodes.indexOf(reference)

					var index = this.childNodes.indexOf(node)
					if (index > -1) this.childNodes.splice(index, 1)

					if (referenceIndex < 0) this.childNodes.push(node)
					else this.childNodes.splice(referenceIndex, 0, node)
				},

				insertAdjacentHTML: function (position, html) {
					// TODO: accept markup
					if (position === "beforebegin") {
						this.parentNode.insertBefore(
							document.createTextNode(html),
							this)
					} else if (position === "beforeend") {
						this.appendChild(document.createTextNode(html))
					}
				},

				setAttribute: function (name, value) {
					this[name] = value.toString()
				},

				setAttributeNS: function (namespace, name, value) {
					this.namespaceURI = namespace
					this[name] = value.toString()
				},

				getAttribute: function (name) {
					return this[name]
				},

				addEventListener: function () {},
				removeEventListener: function () {}
			}
		},

		createElementNS: function (namespace, tag) {
			var element = document.createElement(tag)
			element.namespaceURI = namespace
			return element
		},

		createTextNode: function (text) {
			return {nodeValue: text.toString()}
		},

		replaceChild: function (newChild, oldChild) {
			var index = this.childNodes.indexOf(oldChild)
			if (index > -1) this.childNodes.splice(index, 1, newChild)
			else this.childNodes.push(newChild)
			newChild.parentNode = this
			oldChild.parentNode = null
		},

		appendChild: function (child) {
			var index = this.childNodes.indexOf(child)
			if (index > -1) this.childNodes.splice(index, 1)
			this.childNodes.push(child)
			child.parentNode = this
		},

		removeChild: function (child) {
			var index = this.childNodes.indexOf(child)
			this.childNodes.splice(index, 1)
			child.parentNode = null
		},

		// getElementsByTagName is only used by JSONP tests, it's not required
		// by Mithril
		getElementsByTagName: function (name) {
			name = name.toLowerCase()
			var out = []

			function traverse(node) {
				if (node.childNodes && node.childNodes.length > 0) {
					node.childNodes.forEach(function (curr) {
						if (curr.nodeName.toLowerCase() === name) {
							out.push(curr)
						}
						traverse(curr)
					})
				}
			}

			traverse(document)
			return out
		}
	}

	document.documentElement = document.createElement("html")

	window.scrollTo = function () {}

	;(function () {
		// This is an actual conforming implementation of the
		// requestAnimationFrame spec, with the nonstandard extension of
		// rAF.$resolve for running the callbacks. It works in Node and the
		// browser.
		// https://html.spec.whatwg.org/multipage/#animation-frames
		//
		// Adding and removing callbacks run in constant time. Please don't
		// modify this unless it actually has an edge case bug. It will break
		// other tests
		var callbacks = []
		var id = 0
		var indices = {}

		function requestAnimationFrame(callback) {
			id++
			indices[id] = callbacks.length
			callbacks.push({
				callback: callback,
				id: id
			})
			return id
		}

		window.cancelAnimationFrame = function (id) {
			var index = indices[id]
			if (index !== 0) {
				indices[id] = 0
				callbacks[index] = undefined
			}
		}

		var nanotime = typeof process === "object" ? function () {
			var time = process.hrtime() // eslint-disable-line no-undef
			return time[0] * 1e9 + time[1]
		} : typeof performance === "object" ? function () {
			return performance.now()
		} : function () {
			// PhantomJS 1 doesn't have the Performance API implemented.
			return +new Date()
		}

		requestAnimationFrame.$resolve = function () {
			var list = callbacks
			callbacks = []
			indices = {}

			for (var i = 0; i < list.length; i++) {
				var data = list[i]
				if (data !== undefined) {
					data.callback.call(data.id, nanotime())
				}
			}
		}

		window.requestAnimationFrame = requestAnimationFrame
	})()

	window.XMLHttpRequest = (function () {
		function Request() {
			this.$headers = {}

			this.$resolve = function (data, status) {
				if (data === undefined) data = this // eslint-disable-line
				this.responseText = JSON.stringify(data)
				this.readyState = 4
				this.status = status || 200
				return this
			}

			this.setRequestHeader = function (key, value) {
				this.$headers[key] = value
			}

			this.open = function (method, url) {
				this.method = method
				this.url = url
			}

			this.send = function () {
				Request.$instances.push(this)
			}
		}

		Request.$instances = []
		return Request
	})()

	var location = window.location = {search: "", pathname: "", hash: ""}

	window.history = {
		$$length: 0,

		pushState: function (data, title, url) {
			window.history.$$length++
			location.pathname = location.search = location.hash = url
		},

		replaceState: function (data, title, url) {
			location.pathname = location.search = location.hash = url
		}
	}

	return window
})()
