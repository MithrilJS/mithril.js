"use strict"

var coreRenderer = require("../render/render")

function throttle(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var delay = 16
	var last = 0, pending = null
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
	return function() {
		var elapsed = Date.now() - last
		if (pending === null) {
			pending = timeout(function() {
				pending = null
				callback()
				last = Date.now()
			}, delay - elapsed)
		}
	}
}

module.exports = function($window, throttleMock) {
	var _throttle = throttleMock || throttle
	var renderService = coreRenderer($window)
	renderService.setEventCallback(function(e) {
		if (e.redraw !== false) redraw()
	})

	var callbacks = []
	function subscribe(key, callback) {
		unsubscribe(key)
		callbacks.push(key, _throttle(callback))
	}
	function unsubscribe(key) {
		var index = callbacks.indexOf(key)
		if (index > -1) callbacks.splice(index, 2)
	}
	function redraw() {
		for (var i = 1; i < callbacks.length; i += 2) {
			callbacks[i]()
		}
	}
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
}
