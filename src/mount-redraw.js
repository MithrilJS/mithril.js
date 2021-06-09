import "./render.js"
import {Vnode} from "./vnode.js"
import m from "./m.js"

var subscriptions = []
var pending = false
var offset = -1

function sync() {
	for (offset = 0; offset < subscriptions.length; offset += 2) {
		try { m.render(subscriptions[offset], Vnode(subscriptions[offset + 1]), m.redraw) }
		catch (e) { console.error(e) }
	}
	offset = -1
}

m.redraw = function() {
	if (!pending) {
		pending = true
		requestAnimationFrame(function() {
			pending = false
			sync()
		})
	}
}

m.redraw.sync = sync

m.mount = function(root, component) {
	if (component != null && component.view == null && typeof component !== "function") {
		throw new TypeError("m.mount expects a component, not a vnode.")
	}

	var index = subscriptions.indexOf(root)
	if (index >= 0) {
		subscriptions.splice(index, 2)
		if (index <= offset) offset -= 2
		m.render(root, [])
	}

	if (component != null) {
		subscriptions.push(root, component)
		m.render(root, Vnode(component), m.redraw)
	}
}
