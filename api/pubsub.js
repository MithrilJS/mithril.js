"use strict"

module.exports = function() {
	var callbacks = []
	function unsubscribe(callback) {
		var index = callbacks.indexOf(callback)
		if (index > -1) callbacks.splice(index, 1)
	}
    function publish() {
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i].apply(this, arguments)
        }
    }
	return {subscribe: callbacks.push.bind(callbacks), unsubscribe: unsubscribe, publish: publish}
}
