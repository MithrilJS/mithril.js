if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(item) {
		for (var i = 0; i < this.length; i++) {
			if (this[i] === item) return i
		}
		return -1
	}
}
if (!Array.prototype.map) {
	Array.prototype.map = function(callback) {
		var results = []
		for (var i = 0; i < this.length; i++) {
			results[i] = callback(this[i], i, this)
		}
		return results
	}
}
if (!Array.prototype.filter) {
	Array.prototype.filter = function(callback) {
		var results = []
		for (var i = 0; i < this.length; i++) {
			if (callback(this[i], i, this)) results.push(this[i])
		}
		return results
	}
}
if (!Object.keys) {
	Object.keys = function() {
		var keys = []
		for (var i in this) keys.push(i)
		return keys
	}
}

// no tabs or newlines: output not as pretty, but avoids creating a bunch of
// whitespace text nodes, which makes creating the vdom faster/simpler
// make this an option?
var _serialize = function _serialize(el) {
	var tag = el.nodeName.toLowerCase();
	var openTagStart = '<' + tag + _serializeAttrs(el);
	var openTagEnd, innerHTML, closeTag;
	if (el.childNodes.length > 0) {
		openTagEnd = '>';
		innerHTML = _serializeChildren(el.childNodes);
		closeTag = '</' + tag + '>';
	}
	else {
		openTagEnd = ' />';
		innerHTML = '';
		closeTag = '';
	}
	el._innerHTML = innerHTML;
	el._outerHTML = openTagStart + openTagEnd + innerHTML + closeTag;
};

var _serializeAttrs = function _serializeAttrs(el) {
	var attrs = [];
	var k, v;
	for (k in el.attributes) {
		v = el.attributes[k];
		// do not include event handlers
		if (typeof v !== 'function') {
			attrs.push(k + '=' + '"' + (v == null ? '' : v.toString()) + '"');
		}
	}
	return attrs.length > 0 ? (' ' + attrs.join(' ')) : '';;
};

var _serializeChildren = function _serializeChildren(childNodes) {
	return childNodes.map(function(el){
		return el.outerHTML;
	}).join('');
};

var mock = {}
mock.window = (function() {
	var window = {}
	window.document = {}
	window.document.childNodes = []
	window.document.createElement = function(tag) {
		return {
			attributes: {},
			style: {},
			childNodes: [],
			nodeType: 1,
			nodeName: tag.toUpperCase(),
			appendChild: window.document.appendChild,
			removeChild: window.document.removeChild,
			replaceChild: window.document.replaceChild,
			_outerHTML: '',
			_innerHTML: '',
			get outerHTML() {
				_serialize(this);
				return this._outerHTML;
			},
			get innerHTML() {
				_serialize(this);
				return this._innerHTML;
			},
			insertBefore: function(node, reference) {
				node.parentNode = this
				var referenceIndex = this.childNodes.indexOf(reference)
				var index = this.childNodes.indexOf(node)
				if (index > -1) this.childNodes.splice(index, 1)
				if (referenceIndex < 0) this.childNodes.push(node)
				else this.childNodes.splice(referenceIndex, 0, node)
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
				var val = value && value.toString && value.toString() || null
				this[name] = val;
				this.attributes[name] = val;
			},
			setAttributeNS: function(namespace, name, value) {
				var val = value && value.toString && value.toString() || null
				this.namespaceURI = namespace;
				this[name] = val;
				this.attributes[name] = val;
			},
			getAttribute: function(name, value) {
				return this.attributes[name]
			},
			addEventListener: function () {},
			removeEventListener: function () {}
		}
	}
	window.document.createElementNS = function(namespace, tag) {
		var element = window.document.createElement(tag)
		element.namespaceURI = namespace
		return element
	}
	window.document.createTextNode = function(text) {
		var s = text.toString();
		return {
			nodeValue: s,
			outerHTML: s,
			innerHTML: s
		};
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
	//getElementsByTagName is only used by JSONP tests, it's not required by Mithril
	window.document.getElementsByTagName = function(name){
		name = name.toLowerCase();
		var out = [];

		var traverse = function(node){
			if(node.childNodes && node.childNodes.length > 0){
				node.childNodes.map(function(curr){
					if(curr.nodeName.toLowerCase() === name)
						out.push(curr);
					traverse(curr);
				});
			}
		};

		traverse(window.document);
		return out;
	}
	window.scrollTo = function() {}
	window.cancelAnimationFrame = function() {}
	window.requestAnimationFrame = function(callback) {
		window.requestAnimationFrame.$callback = callback
		return window.requestAnimationFrame.$id++
	}
	window.requestAnimationFrame.$id = 1
	window.requestAnimationFrame.$resolve = function() {
		if (window.requestAnimationFrame.$callback) {
			var callback = window.requestAnimationFrame.$callback
			window.requestAnimationFrame.$callback = null
			callback()
		}
	}
	window.XMLHttpRequest = (function() {
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
	}())
	window.location = {search: "", pathname: "", hash: ""},
	window.history = {}
	window.history.$$length = 0
	window.history.pushState = function(data, title, url) {
		window.history.$$length++
		window.location.pathname = window.location.search = window.location.hash = url
	},
	window.history.replaceState = function(data, title, url) {
		window.location.pathname = window.location.search = window.location.hash = url
	}
	return window
}())