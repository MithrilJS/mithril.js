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