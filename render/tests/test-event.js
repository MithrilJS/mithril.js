"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")

o.spec("event", function() {
	var $window, root, onevent, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
		onevent = o.spy()
		var renderer = vdom($window)
		renderer.setEventCallback(onevent)
		render = renderer.render
	})

	o("handles onclick", function() {
		var spy = o.spy()
		var div = {tag: "div", attrs: {onclick: spy}}
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, [div])
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.dom)
		o(spy.args[0].type).equals("click")
		o(spy.args[0].target).equals(div.dom)
		o(onevent.callCount).equals(1)
		o(onevent.this).equals(div.dom)
		o(onevent.args[0].type).equals("click")
		o(onevent.args[0].target).equals(div.dom)
	})
	
	o("removes event", function() {
		var spy = o.spy()
		var vnode = {tag: "a", attrs: {onclick: spy}}
		var updated = {tag: "a", attrs: {}}

		render(root, [vnode])
		render(root, [updated])

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)
		
		o(spy.callCount).equals(0)
	})

	o("fires onclick only once after redraw", function() {
		var spy = o.spy()
		var div = {tag: "div", attrs: {id: "a", onclick: spy}}
		var updated = {tag: "div", attrs: {id: "b", onclick: spy}}
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, [div])
		render(root, [updated])
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.dom)
		o(spy.args[0].type).equals("click")
		o(spy.args[0].target).equals(div.dom)
		o(onevent.callCount).equals(1)
		o(onevent.this).equals(div.dom)
		o(onevent.args[0].type).equals("click")
		o(onevent.args[0].target).equals(div.dom)
		o(div.dom).equals(updated.dom)
		o(div.dom.attributes["id"].nodeValue).equals("b")
	})

	o("handles ontransitionend", function() {
		var spy = o.spy()
		var div = {tag: "div", attrs: {ontransitionend: spy}}
		var e = $window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)

		render(root, [div])
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.dom)
		o(spy.args[0].type).equals("transitionend")
		o(spy.args[0].target).equals(div.dom)
		o(onevent.callCount).equals(1)
		o(onevent.this).equals(div.dom)
		o(onevent.args[0].type).equals("transitionend")
		o(onevent.args[0].target).equals(div.dom)
	})
})
