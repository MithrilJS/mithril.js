"use strict"

var ts = Date.now || function() {
	return new Date().getTime()
}

module.exports = function(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var time = 16
	var last = 0, pending = null
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
	return function(synchronous) {
		var now = ts()
		if (synchronous === true || last === 0 || now - last >= time) {
			last = now
			callback()
		}
		else if (pending === null) {
			pending = timeout(function() {
				pending = null
				callback()
				last = ts()
			}, time - (now - last))
		}
	}
}
