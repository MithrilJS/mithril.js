"use strict"

module.exports = function(attrName, callback, context, shouldRedraw) {
	if(shouldRedraw === undefined) shouldRedraw = true;
	return function(e) {
		e.redraw = shouldRedraw;
		callback.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
	}
}
