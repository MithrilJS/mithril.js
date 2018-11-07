"use strict"

module.exports = function (store) {
	return {
		get: function() { return store },
		toJSON: function() { return store },
		set: function(value) { return store = value }
	}
}
