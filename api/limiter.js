"use strict"

var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

module.exports = function($window, render) {
	var rAF = $window.requestAnimationFrame || $window.setTimeout
	
	var last = 0
	var pending = null
	
	return function(force) {
		var now = new Date()
		
		// Immediately render if:
		// Forced
		// Haven't rendered yet
		// Time since the last render is greater than the frame budget
		if(force || !last || now - last > FRAME_BUDGET) {
			last = now;
			
			return render()
		}
		
		// Redraw already pending, abort
		if(pending !== null) {
			return
		}
		
		// Schedule a redraw for the next tick
		pending = rAF(function() {
			render()
			
			last = new Date()
			pending = null
		}, FRAME_BUDGET - (now - last))
	}
}
