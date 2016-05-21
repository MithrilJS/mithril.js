"use strict"

module.exports = function(store) {
	return function() {
		if (arguments.length > 0) store = arguments[0]
		return store
	}
}