"use strict"

var throttle = require("../api/throttle")

module.exports = function(root, renderer, pubsub, callback) {
	var run = throttle(callback)
	if (renderer != null) {
		renderer.setEventCallback(function(e) {
			if (typeof e.redraw === "function") e.redraw.call(null)
			else if (e.redraw !== false) pubsub.publish()
		})
	}

	if (pubsub != null) {
		if (root.redraw) pubsub.unsubscribe(root.redraw)
		pubsub.subscribe(run)
	}

	return root.redraw = run
}
