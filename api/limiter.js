var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

module.exports = function($window, render) {
	var rAF = $window.requestAnimationFrame || $window.setTimeout
	var cAF = $window.cancelAnimationFrame || $window.clearTimeout
	
	var last = 0
	var pending
	
	return function() {
		var now = new Date()
		
		// First render, OR if the time since the last render is greater
		// than the frame budget
		// just immediately render
		if(!last || now - last > FRAME_BUDGET) {
			last = now;
			
			return render()
		}
		
		// Redraw already pending, abort
		if(pending) {
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
