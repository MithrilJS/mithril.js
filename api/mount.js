"use strict"

var Vnode = require("../render/vnode")

module.exports = function(redrawService) {
	return function(root, component) {
		if (component === null) {
			redrawService.render(root, [])
			redrawService.unsubscribe(root)
			return
		}
		
		if (component.view == null && typeof component !== "function") throw new Error("m.mount(element, component) expects a component, not a vnode")
		
		var run = function() {
			redrawService.render(root, Vnode(component))
		}
		redrawService.subscribe(root, run)
		redrawService.redraw()
	}
}
