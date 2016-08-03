"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var m = require("../../test-utils/hyperscript").m
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
		var div = m("div", {onclick: spy})
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

	o("fires onclick only once after redraw", function() {
		var spy = o.spy()
		var div = m("div", {id: "a", onclick: spy})
		var updated = m("div", {id: "b", onclick: spy})
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
		var div = m("div", {ontransitionend: spy})
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
