"use strict"

module.exports = function() {
	var queue = []
	return {
		throttle: function(fn) {
			var pending = false
			return function() {
				if (!pending) {
					queue.push(function(){
						pending = false
						fn()
					})
					pending = true
				}
			}
		},
		fire: function() {
			var tasks = queue
			queue = []
			tasks.forEach(function(fn) {fn()})
		},
		queueLength: function(){
			return queue.length
		}
	}
}
