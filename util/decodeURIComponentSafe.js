"use strict"

module.exports = function(str) {
	try {
		return decodeURIComponent(str)
	} catch(err) {
		return str
	}
}
