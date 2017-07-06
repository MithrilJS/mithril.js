"use strict"

module.exports = function(attrName, callback, context) {
	return function(e) {
		callback.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
	}
}
