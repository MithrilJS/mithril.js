"use strict"

var o = require("ospec")
var browserMock = require("../../test-utils/browserMock")
var throttleMocker = require("../../test-utils/throttleMock")
var m = require("../../render/hyperscript")
var coreRenderer = require("../../render/render")
var apiMountRedraw = require("../mount-redraw")
var apiRouter = require("../router")

o.spec("obsolete onmatch rejection", function() {
	var $window, root, throttle, route, realError, errorSpy

	function deferred() {
		var resolve, reject
		var promise = new Promise(function(a, b) { resolve = a; reject = b })
		return {promise: promise, resolve: resolve, reject: reject}
	}

	function settle() {
		return new Promise(function(resolve) { setTimeout(resolve, 20) }).then(function() {
			throttle.fire()
		})
	}

	o.beforeEach(function() {
		$window = browserMock()
		root = $window.document.body
		throttle = throttleMocker()
		route = apiRouter($window, apiMountRedraw(coreRenderer($window), throttle.schedule, console))
		realError = console.error
		errorSpy = console.error = o.spy()
	})

	o.afterEach(function() {
		console.error = realError
	})

	function setup(old, next) {
		$window.location.href = "#!/old"
		route(root, "/home", {
			"/home": {view: function() { return m("p", "home") }},
			"/old": {onmatch: function() { return old.promise }},
			"/next": next || {view: function() { return m("p", "next") }},
		})
	}

	o("does not replace an already resolved newer route", function() {
		var old = deferred()
		var error = new Error("old load failed")
		setup(old)
		return settle().then(function() {
			route.set("/next")
			return settle()
		}).then(function() {
			o(route.get()).equals("/next")
			old.reject(error)
			return settle()
		}).then(function() {
			o(route.get()).equals("/next")
			o(root.firstChild.firstChild.nodeValue).equals("next")
			o($window.location.hash).equals("#!/next")
			o(errorSpy.callCount).equals(1)
			o(errorSpy.args[0]).equals(error)
		})
	})

	o("does not cancel a pending newer route", function() {
		var old = deferred()
		var next = deferred()
		setup(old, {onmatch: function() { return next.promise }})
		return settle().then(function() {
			route.set("/next")
			return settle()
		}).then(function() {
			old.reject(new Error("old load failed"))
			return settle()
		}).then(function() {
			o($window.location.hash).equals("#!/next")
			next.resolve({view: function() { return m("p", "loaded") }})
			return settle()
		}).then(function() {
			o(route.get()).equals("/next")
			o(root.firstChild.firstChild.nodeValue).equals("loaded")
		})
	})

	o("preserves a route.set before the new resolver runs", function() {
		var old = deferred()
		setup(old)
		return settle().then(function() {
			route.set("/next")
			old.reject(new Error("old load failed"))
			return settle()
		}).then(function() {
			o(route.get()).equals("/next")
			o($window.location.hash).equals("#!/next")
		})
	})

	o("does not cancel a newer navigation to the same path", function() {
		var old = deferred()
		var next = deferred()
		var calls = 0
		$window.location.href = "#!/old"
		route(root, "/home", {
			"/home": {view: function() { return m("p", "home") }},
			"/old": {onmatch: function() { return ++calls === 1 ? old.promise : next.promise }},
		})
		return settle().then(function() {
			route.set("/old")
			return settle()
		}).then(function() {
			o(calls).equals(2)
			old.reject(new Error("first load failed"))
			return settle()
		}).then(function() {
			next.resolve({view: function() { return m("p", "reloaded") }})
			return settle()
		}).then(function() {
			o(route.get()).equals("/old")
			o(root.firstChild.firstChild.nodeValue).equals("reloaded")
			o($window.location.hash).equals("#!/old")
		})
	})

	o("still redirects a current rejected resolver to the fallback", function() {
		var old = deferred()
		setup(old)
		return settle().then(function() {
			old.reject(new Error("current load failed"))
			return settle()
		}).then(function() {
			o(route.get()).equals("/home")
			o(root.firstChild.firstChild.nodeValue).equals("home")
			o(errorSpy.callCount).equals(1)
		})
	})
})
