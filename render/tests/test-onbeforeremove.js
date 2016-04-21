"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("onbeforeremove", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		render = vdom($window).render
	})

	o("does not call onbeforeremove when creating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", attrs: {onbeforeremove: create}}
		
		render(root, [vnode])
		
		o(create.callCount).equals(0)
	})
	o("does not call onbeforeremove when updating", function() {
		var create = o.spy()
		var update = o.spy()
		var vnode = {tag: "div", attrs: {onbeforeremove: create}}
		var updated = {tag: "div", attrs: {onbeforeremove: update}}
		
		render(root, [vnode])
		render(root, [updated])
		
		o(create.callCount).equals(0)
		o(update.callCount).equals(0)
	})
	o("calls onbeforeremove when removing element", function(done) {
		var vnode = {tag: "div", attrs: {onbeforeremove: remove}}
		
		render(root, [vnode])
		render(root, [])
		
		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)
			
			callAsync(function() {
				o(root.childNodes.length).equals(1)
				
				complete()
						
				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing text", function(done) {
		var vnode = {tag: "#", attrs: {onbeforeremove: remove}, children: "a"}
		
		render(root, [vnode])
		render(root, [])
		
		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)
			
			callAsync(function() {
				o(root.childNodes.length).equals(1)
				
				complete()
						
				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing fragment", function(done) {
		var vnode = {tag: "[", attrs: {onbeforeremove: remove}, children: [{tag: "div"}]}
		
		render(root, [vnode])
		render(root, [])
		
		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)
			
			callAsync(function() {
				o(root.childNodes.length).equals(1)
				
				complete()
						
				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls onbeforeremove when removing html", function(done) {
		var vnode = {tag: "<", attrs: {onbeforeremove: remove}, children: "a"}
		
		render(root, [vnode])
		render(root, [])
		
		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)
			
			callAsync(function() {
				o(root.childNodes.length).equals(1)
				
				complete()
						
				o(root.childNodes.length).equals(0)

				done()
			})
		}
	})
	o("calls remove after onbeforeremove resolves", function(done) {
		var spy = o.spy()
		var vnode = {tag: "<", attrs: {onbeforeremove: remove, onremove: spy}, children: "a"}
		
		render(root, [vnode])
		render(root, [])
		
		function remove(node, complete) {
			o(node).equals(vnode)
			o(root.childNodes.length).equals(1)
			o(root.firstChild).equals(vnode.dom)
			
			callAsync(function() {
				o(root.childNodes.length).equals(1)
				o(spy.callCount).equals(0)
				
				complete()
						
				o(root.childNodes.length).equals(0)
				o(spy.callCount).equals(1)

				done()
			})
		}
	})
	o("does not set onbeforeremove as an event handler", function() {
		var remove = o.spy()
		var vnode = {tag: "div", attrs: {onbeforeremove: remove}, children: []}
		
		render(root, [vnode])
		
		o(vnode.dom.onbeforeremove).equals(undefined)
		o(vnode.dom.attributes["onbeforeremove"]).equals(undefined)
	})
})