"use strict"

var throttle = require("../api/throttle")

module.exports = function(root, renderer, pubsub, callback) {
	var run = throttle(callback)
	if (renderer != null) {
		renderer.setEventCallback(function(result) {
			if (result !== false) pubsub.publish()
		})
	}

	if (pubsub != null) {
		if (root.redraw) pubsub.unsubscribe(root.redraw)
		pubsub.subscribe(run)
	}

	return root.redraw = run
}
