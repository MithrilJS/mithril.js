"use strict"

var coreRenderer = require("../render/render")

function throttle(callback) {
	var pending = null
	return function() {
		if (pending === null) {
			pending = requestAnimationFrame(function() {
				pending = null
				callback()
			})
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
	var rendering = false

	function subscribe(key, callback) {
		unsubscribe(key)
		callbacks.push(key, callback)
	}
	function unsubscribe(key) {
		var index = callbacks.indexOf(key)
		if (index > -1) callbacks.splice(index, 2)
	}
	function sync() {
		if (rendering) throw new Error("Nested m.redraw.sync() call")
		rendering = true
		for (var i = 1; i < callbacks.length; i+=2) try {callbacks[i]()} catch (e) {if (typeof console !== "undefined") console.error(e)}
		rendering = false
	}

	var redraw = (throttleMock || throttle)(sync)
	redraw.sync = sync
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
}
