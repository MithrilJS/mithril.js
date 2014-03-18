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
			setAttribute: function(name, value) {
				this[name] = value.toString()
			},
			getAttribute: function(name, value) {
				return this[name]
			},
		}
	}
	window.document.createTextNode = function(text) {
		return {nodeValue: text.toString()}
	}
	window.document.documentElement = null
	window.document.replaceChild = function(newChild, oldChild) {
		var index = this.childNodes.indexOf(oldChild)
		if (index > -1) this.childNodes.splice(index, 1, newChild)
		else this.childNodes.push(newChild)
		newChild.parentNode = this
		oldChild.parentNode = null
	}
	window.document.appendChild = function(child) {
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