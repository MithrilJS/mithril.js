"use strict"

var Vnode = require("../render/vnode")

module.exports = function(redrawService) {
	return function(root, component) {
		if (component === null) {
			redrawService.unsubscribe(root)
		} else if (component.view == null && typeof component !== "function") {
			throw new Error("m.mount(element, component) expects a component, not a vnode")
		} else {
			redrawService.subscribe(root, function() { return Vnode(component) })
		}
	}
}
