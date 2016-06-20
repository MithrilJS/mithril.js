"use strict"

var parseURL = require("../test-utils/parseURL")

module.exports = function() {
	var protocol = "http:"
	var hostname = "localhost"
	var port = ""
	var pathname = "/"
	var search = ""
	var hash = ""

	var past = [], future = []

	function getURL() {
		if (protocol === "file:") return protocol + "//" + pathname + search + hash
		return protocol + "//" + hostname + prefix(":", port) + pathname + search + hash
	}
	function setURL(value) {
		var data = parseURL(value, {protocol: protocol, hostname: hostname, port: port, pathname: pathname})
		var isNew = false
		if (data.protocol != null && data.protocol !== protocol) protocol = data.protocol, isNew = true
		if (data.hostname != null && data.hostname !== hostname) hostname = data.hostname, isNew = true
		if (data.port != null && data.port !== port) port = data.port, isNew = true
		if (data.pathname != null && data.pathname !== pathname) pathname = data.pathname, isNew = true
		if (data.search != null && data.search !== search) search = data.search, isNew = true
		if (data.hash != null && data.hash !== hash) {
			hash = data.hash
			if (!isNew) hashchange()
		}
		return isNew
	}

	function prefix(prefix, value) {
		if (value === "") return ""
		return (value.charAt(0) !== prefix ? prefix : "") + value
	}
	function hashchange() {
		if (typeof $window.onhashchange === "function") $window.onhashchange({type: "hashchange"})
	}
	function popstate() {
		if (typeof $window.onpopstate === "function") $window.onpopstate({type: "popstate"})
	}
	function unload() {
		if (typeof $window.onunload === "function") $window.onunload({type: "unload"})
	}
	var $window = {
		location: {
			get protocol() {
				return protocol
			},
			get hostname() {
				return hostname
			},
			get port() {
				return port
			},
			get pathname() {
				return pathname
			},
			get search() {
				return search
			},
			get hash() {
				return hash
			},
			get origin() {
				if (protocol === "file:") return "null"
				return protocol + "//" + hostname + prefix(":", port)
			},
			get host() {
				if (protocol === "file:") return ""
				return hostname + prefix(":", port)
			},
			get href() {
				return getURL()
			},

			set protocol(value) {
				throw new Error("Protocol is read-only")
			},
			set hostname(value) {
				unload()
				past.push({url: getURL(), isNew: true})
				future = []
				hostname = value
			},
			set port(value) {
				if (protocol === "file:") throw new Error("Port is read-only under `file://` protocol")
				unload()
				past.push({url: getURL(), isNew: true})
				future = []
				port = value
			},
			set pathname(value) {
				if (protocol === "file:") throw new Error("Pathname is read-only under `file://` protocol")
				unload()
				past.push({url: getURL(), isNew: true})
				future = []
				pathname = prefix("/", value)
			},
			set search(value) {
				unload()
				past.push({url: getURL(), isNew: true})
				future = []
				search = prefix("?", value)
			},
			set hash(value) {
				var oldHash = hash
				past.push({url: getURL(), isNew: false})
				future = []
				hash = prefix("#", value)
				if (oldHash != hash) hashchange()
			},

			set origin(value) {
				//origin is writable but ignored
			},
			set host(value) {
				//host is writable but ignored in Chrome
			},
			set href(value) {
				var url = getURL()
				var isNew = setURL(value)
				if (isNew) {
					setURL(url)
					unload()
					setURL(value)
				}
				past.push({url: url, isNew: isNew})
				future = []
			},
		},
		history: {
			pushState: function(data, title, url) {
				past.push({url: getURL(), isNew: false})
				future = []
				setURL(url)
			},
			replaceState: function(data, title, url) {
				future = []
				setURL(url)
			},
			back: function() {
				var entry = past.pop()
				if (entry != null) {
					if (entry.isNew) unload()
					future.push({url: getURL(), isNew: false})
					setURL(entry.url)
					if (!entry.isNew) popstate()
				}
			},
			forward: function() {
				var entry = future.pop()
				if (entry != null) {
					if (entry.isNew) unload()
					past.push({url: getURL(), isNew: false})
					setURL(entry.url)
					if (!entry.isNew) popstate()
				}
			},
		},
		onpopstate: null,
		onhashchange: null,
		onunload: null,
	}
	return $window
}
