"use strict"

var Vnode = require("../render/vnode")

module.exports = function(render, schedule, console) {
	var subscriptions = []
	var pending = false
	var offset = -1

	function sync() {
		for (offset = 0; offset < subscriptions.length; offset += 2) {
			try { render(subscriptions[offset], Vnode(subscriptions[offset + 1]), redraw) }
			catch (e) { console.error(e) }
		}
		offset = -1
	}

	function redraw() {
		if (!pending) {
			pending = true
			schedule(function() {
				pending = false
				sync()
			})
		}
	}

	redraw.sync = sync

	function mount(root, component) {
		if (component != null && component.view == null && typeof component !== "function") {
			throw new TypeError("m.mount expects a component, not a vnode.")
		}

		var index = subscriptions.indexOf(root)
		if (index >= 0) {
			subscriptions.splice(index, 2)
			if (index <= offset) offset -= 2
			render(root, [])
		}

		if (component != null) {
			subscriptions.push(root, component)
			render(root, Vnode(component), redraw)
		}
	}

	return {mount: mount, redraw: redraw}
}
