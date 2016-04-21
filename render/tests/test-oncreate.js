"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("oncreate", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("calls oncreate when creating element", function() {
		var callback = o.spy()
		var vnode = {tag: "div", attrs: {oncreate: callback}}
		
		render(root, [vnode])
		
		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oncreate when creating text", function() {
		var callback = o.spy()
		var vnode = {tag: "#", attrs: {oncreate: callback}, children: "a"}
		
		render(root, [vnode])
		
		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oncreate when creating fragment", function() {
		var callback = o.spy()
		var vnode = {tag: "[", attrs: {oncreate: callback}, children: []}
		
		render(root, [vnode])
		
		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oncreate when creating html", function() {
		var callback = o.spy()
		var vnode = {tag: "<", attrs: {oncreate: callback}, children: "a"}
		
		render(root, [vnode])
		
		o(callback.callCount).equals(1)
		o(callback.this).equals(vnode)
		o(callback.args[0]).equals(vnode)
	})
	o("calls oncreate when replacing keyed", function() {
		var createDiv = o.spy()
		var createA = o.spy()
		var vnode = {tag: "div", key: 1, attrs: {oncreate: createDiv}}
		var updated = {tag: "a", key: 1, attrs: {oncreate: createA}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(createDiv.callCount).equals(1)
		o(createDiv.this).equals(vnode)
		o(createDiv.args[0]).equals(vnode)
		o(createA.callCount).equals(1)
		o(createA.this).equals(updated)
		o(createA.args[0]).equals(updated)
	})
	o("does not call oncreate when noop", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", attrs: {oncreate: create}}
		var updated = {tag: "div", attrs: {oncreate: update}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(create.callCount).equals(1)
		o(create.this).equals(vnode)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when updating attr", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", attrs: {oncreate: create}}
		var updated = {tag: "div", attrs: {oncreate: update, id: "a"}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(create.callCount).equals(1)
		o(create.this).equals(vnode)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when updating children", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", attrs: {oncreate: create}, children: [{tag: "a"}]}
		var updated = {tag: "div", attrs: {oncreate: update}, children: [{tag: "b"}]}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(create.callCount).equals(1)
		o(create.this).equals(vnode)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when updating keyed", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", key: 1, attrs: {oncreate: create}}
		var otherVnode = {tag: "a", key: 2}
		var updated = {tag: "div", key: 1, attrs: {oncreate: update}}
		var otherUpdated = {tag: "a", key: 2}
		
		render(root, [vnode, otherVnode])
		render(root, [otherUpdated, updated])
		
		o(create.callCount).equals(1)
		o(create.this).equals(vnode)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(0)
	})
	o("does not call oncreate when removing", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", attrs: {oncreate: create}}
		
		render(root, [vnode])
		render(root, [])
		
		o(create.callCount).equals(1)
		o(create.this).equals(vnode)
		o(create.args[0]).equals(vnode)
	})
	o("calls oncreate when recycling", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", key: 1, attrs: {oncreate: create}}
		var updated = {tag: "div", key: 1, attrs: {oncreate: update}}
		
		render(root, [vnode])
		render(root, [])
		render(root, [updated])
		
		o(vnode.dom).equals(updated.dom)
		o(create.callCount).equals(1)
		o(create.this).equals(vnode)
		o(create.args[0]).equals(vnode)
		o(update.callCount).equals(1)
		o(update.this).equals(updated)
		o(update.args[0]).equals(updated)
	})
	o("calls oncreate at the same step as onupdate", function() {
		var create = o.spy()
		var update = o.spy()
		var callback = o.spy()
		var vnode = {tag: "div", attrs: {onupdate: create}, children: []}
		var updated = {tag: "div", attrs: {onupdate: update}, children: [{tag: "a", attrs: {oncreate: callback}}]}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(create.callCount).equals(0)
		o(update.callCount).equals(1)
		o(update.this).equals(updated)
		o(update.args[0]).equals(updated)
		o(callback.callCount).equals(1)
		o(callback.this).equals(updated.children[0])
		o(callback.args[0]).equals(updated.children[0])
	})
	o("calls oncreate after full DOM creation", function() {
		var created = false
		var vnode = {tag: "div", children: [
			{tag: "a", attrs: {oncreate: create}, children: [
				{tag: "b"}
			]}
		]}
		
		render(root, [vnode])
		
		function create(vnode) {
			created = true
			
			o(vnode.dom.parentNode).notEquals(null)
			o(vnode.dom.childNodes.length).equals(1)
		}
		o(created).equals(true)
	})
	o("does not set oncreate as an event handler", function() {
		var create = o.spy()
		var vnode = {tag: "div", attrs: {oncreate: create}, children: []}
		
		render(root, [vnode])
		
		o(vnode.dom.oncreate).equals(undefined)
		o(vnode.dom.attributes["oncreate"]).equals(undefined)
	})
	o("calls oncreate on recycle", function() {
		var create = o.spy()
		var vnodes = [{tag: "div", key: 1, attrs: {oncreate: create}}]
		var temp = []
		var updated = [{tag: "div", key: 1, attrs: {oncreate: create}}]
		
		render(root, vnodes)
		render(root, temp)
		render(root, updated)
		
		o(create.callCount).equals(2)
	})
})