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
	var renderService = coreRenderer($window)
	renderService.setEventCallback(function(e) {
		if (e.redraw === false) e.redraw = undefined
		else redraw()
	})

	var callbacks = []
	var rendering = 0
	var afterRenderCallbacks = []

	function subscribe(key, callback) {
		unsubscribe(key)
		callbacks.push(key, callback)
	}
	function unsubscribe(key) {
		var index = callbacks.indexOf(key)
		if (index > -1) callbacks.splice(index, 2)
	}
	function sync() {
		// [0] Required by: test-redraw > the callback passed to redraw() is called when all roots have been redrawn
		rendering++ // [0]
		for (var i = 1; i < callbacks.length; i+=2) try {callbacks[i]()} catch (e) {/*noop*/}
		processAfterRenderCallbacks() // [0]
		rendering-- // [0]
	}
	var throttledSync = (throttleMock || throttle)(sync)
	var redraw = function(afterRenderCallback) {
		if (rendering) {
			afterRenderCallbacks.push(sync)
			if (afterRenderCallback) afterRenderCallbacks.push(afterRenderCallback)
		} else {
			if (afterRenderCallback) afterRenderCallbacks.push(afterRenderCallback)
			throttledSync()
		}
	}
	function render() {
		rendering++
		renderService.render.apply(renderService, arguments)
		processAfterRenderCallbacks()
		rendering--
	}
	function processAfterRenderCallbacks() {
		while (afterRenderCallbacks.length) {
			try { afterRenderCallbacks.shift()() } catch (e) { console.error(e) }
		}
	}

	redraw.sync = sync
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: render}
}
