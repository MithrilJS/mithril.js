"use strict"

var callAsync = require("../test-utils/callAsync")

module.exports = function debouncedAsync(f) {
	var ref
	return function() {
		if (ref != null) return
		ref = callAsync(function(){
			ref = null
			f()
		})
	}
}
