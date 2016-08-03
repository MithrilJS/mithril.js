"use strict"

/**
 * This is modeled after Bluebird's scheduler. It solves for quite a few edge
 * cases, and should help alleviate most of the flakiness issues. It also speeds
 * up the suite a bit.
 */

module.exports = (function () {
	// The scheduler for NodeJS/io.js is setImmediate for recent versions of
	// node because of macrotask semantics (i.e. don't starve the event loop).
	if (typeof process !== "undefined" &&
			/^\[object process\]/i.test({}.toString.call(process))) {
		var version = process.versions.node.split(".").map(Number)
		var isRecent = version[0] === 0 && version[1] > 10 || version[0] > 0

		return isRecent ? setImmediate : process.nextTick
	}

	if (typeof Promise === "function") {
		var p = Promise.resolve()

		return function (fn) {
			p.then(fn)
		}
	}

	if (typeof MutationObserver !== "undefined") {
		// Using 2 mutation observers to batch multiple updates into one.
		var div = document.createElement("div")
		var opts = {attributes: true}
		var toggleScheduled = false
		var div2 = document.createElement("div")
		var o2 = new MutationObserver(function() {
			div.classList.toggle("foo")
			toggleScheduled = false
		})
		o2.observe(div2, opts)

		function scheduleToggle() {
			if (toggleScheduled) return
			toggleScheduled = true
			div2.classList.toggle("foo")
		}

		return function (fn) {
			var o = new MutationObserver(function() {
				o.disconnect()
				fn()
			})
			o.observe(div, opts)
			scheduleToggle()
		}
	}

	return typeof setImmediate === "function" ? setImmediate : setTimeout
})()
