(function (global) { // eslint-disable-line max-statements
	"use strict"

	/* eslint-disable no-extend-native */
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function (item) {
			for (var i = 0; i < this.length; i++) {
				if (this[i] === item) return i
			}
			return -1
		}
	}

	if (!Array.prototype.map) {
		Array.prototype.map = function (callback) {
			var results = []
			for (var i = 0; i < this.length; i++) {
				results[i] = callback(this[i], i, this)
			}
			return results
		}
	}

	if (!Array.prototype.filter) {
		Array.prototype.filter = function (callback) {
			var results = []
			for (var i = 0; i < this.length; i++) {
				if (callback(this[i], i, this)) results.push(this[i])
			}
			return results
		}
	}

	if (!Object.keys) {
		Object.keys = function () {
			var keys = []
			for (var i in this) if ({}.hasOwnProperty.call(this, i)) {
				keys.push(i)
			}
			return keys
		}
	}
	/* eslint-enable no-extend-native */

	var window = global.mock = {window: window}
	window.window = window
	window.document = {}
	window.document.childNodes = []
	window.document.createElement = function (tag) {
		return {
			style: {},
			childNodes: [],
			nodeType: 1,
			nodeName: tag.toUpperCase(),
			appendChild: window.document.appendChild,
			removeChild: window.document.removeChild,
			replaceChild: window.document.replaceChild,

			insertBefore: function (node, reference) {
				node.parentNode = this
				var referenceIndex = this.childNodes.indexOf(reference)
				var index = this.childNodes.indexOf(node)
				if (index > -1) this.childNodes.splice(index, 1)
				if (referenceIndex < 0) this.childNodes.push(node)
				else this.childNodes.splice(referenceIndex, 0, node)
			},

			insertAdjacentHTML: function (position, html) {
				// todo: accept markup
				if (position === "beforebegin") {
					this.parentNode.insertBefore(
						window.document.createTextNode(html),
						this)
				} else if (position === "beforeend") {
					this.appendChild(window.document.createTextNode(html))
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
	}
	window.document.createElementNS = function (namespace, tag) {
		var element = window.document.createElement(tag)
		element.namespaceURI = namespace
		return element
	}
	window.document.createTextNode = function (text) {
		return {nodeValue: text.toString()}
	}
	window.document.documentElement = window.document.createElement("html")
	window.document.replaceChild = function (newChild, oldChild) {
		var index = this.childNodes.indexOf(oldChild)
		if (index > -1) this.childNodes.splice(index, 1, newChild)
		else this.childNodes.push(newChild)
		newChild.parentNode = this
		oldChild.parentNode = null
	}
	window.document.appendChild = function (child) {
		var index = this.childNodes.indexOf(child)
		if (index > -1) this.childNodes.splice(index, 1)
		this.childNodes.push(child)
		child.parentNode = this
	}
	window.document.removeChild = function (child) {
		var index = this.childNodes.indexOf(child)
		this.childNodes.splice(index, 1)
		child.parentNode = null
	}
	// getElementsByTagName is only used by JSONP tests, it's not required by
	// Mithril
	window.document.getElementsByTagName = function (name){
		name = name.toLowerCase()
		var out = []

		function traverse(node) {
			if (node.childNodes && node.childNodes.length > 0){
				node.childNodes.map(function (curr){
					if (curr.nodeName.toLowerCase() === name) {
						out.push(curr)
					}
					traverse(curr)
				})
			}
		}

		traverse(window.document)
		return out
	}
	window.scrollTo = function () {}
	window.cancelAnimationFrame = function () {}
	window.requestAnimationFrame = function (callback) {
		window.requestAnimationFrame.$callback = callback
		return window.requestAnimationFrame.$id++
	}
	window.requestAnimationFrame.$id = 1
	window.requestAnimationFrame.$resolve = function () {
		if (window.requestAnimationFrame.$callback) {
			var callback = window.requestAnimationFrame.$callback
			window.requestAnimationFrame.$callback = null
			callback()
		}
	}

	window.XMLHttpRequest = (function () {
		function XMLHttpRequest() {
			this.$headers = {}
			this.setRequestHeader = function (key, value) {
				this.$headers[key] = value
			}
			this.open = function (method, url) {
				this.method = method
				this.url = url
			}
			this.send = function () {
				this.responseText = JSON.stringify(this)
				this.readyState = 4
				this.status = 200
				XMLHttpRequest.$instances.push(this)
			}
		}
		XMLHttpRequest.$instances = []
		return XMLHttpRequest
	})()

	window.location = {search: "", pathname: "", hash: ""}

	window.history = {}
	window.history.$$length = 0

	window.history.pushState = function (data, title, url) {
		window.history.$$length++
		window.location.pathname =
		window.location.search =
		window.location.hash = url
	}

	window.history.replaceState = function (data, title, url) {
		window.location.pathname =
		window.location.search =
		window.location.hash = url
	}
})(this)
