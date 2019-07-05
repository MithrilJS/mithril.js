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
	var subscriptions = []
	var rendering = false

	function run(sub) {
		var vnode = sub.c(sub)
		if (vnode !== sub) renderService.render(sub.k, vnode)
	}
	function subscribe(key, callback, onremove) {
		var sub = {k: key, c: callback, r: onremove}
		unsubscribe(key)
		subscriptions.push(sub)
		var vnode = sub.c(sub)
		if (vnode !== sub) renderService.render(sub.k, vnode)
	}
	function unsubscribe(key) {
		for (var i = 0; i < subscriptions.length; i++) {
			var sub = subscriptions[i]
			if (sub.k === key) {
				subscriptions.splice(i, 1)
				renderService.render(sub.k, [])
				if (typeof sub.r === "function") sub.r()
				break
			}
		}
	}
	function sync() {
		if (rendering) throw new Error("Nested m.redraw.sync() call")
		rendering = true
		for (var i = 0; i < subscriptions.length; i++) {
			try { run(subscriptions[i]) }
			catch (e) { if (typeof console !== "undefined") console.error(e) }
		}
		rendering = false
	}

	var redraw = (throttleMock || throttle)(sync)
	redraw.sync = sync
	renderService.setRedraw(redraw)
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: renderService.render}
}
