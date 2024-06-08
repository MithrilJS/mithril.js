"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("event", function() {
	var $window, root, redraw, render, reallyRender
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
		redraw = o.spy()
		reallyRender = vdom($window)
		render = function(dom, vnode) {
			return reallyRender(dom, vnode, redraw)
		}
	})

	function eventSpy(fn) {
		function spy(e) {
			spy.calls.push({
				this: this, type: e.type,
				target: e.target, currentTarget: e.currentTarget,
			})
			if (fn) return fn.apply(this, arguments)
		}
		spy.calls = []
		return spy
	}

	o("handles onclick", function() {
		var spyDiv = eventSpy()
		var spyParent = eventSpy()
		var div = m("div", {onclick: spyDiv})
		var parent = m("div", {onclick: spyParent}, div)
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, parent)
		div.dom.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.dom)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.dom)
		o(spyDiv.calls[0].currentTarget).equals(div.dom)
		o(spyParent.calls.length).equals(1)
		o(spyParent.calls[0].this).equals(parent.dom)
		o(spyParent.calls[0].type).equals("click")
		o(spyParent.calls[0].target).equals(div.dom)
		o(spyParent.calls[0].currentTarget).equals(parent.dom)
		o(redraw.callCount).equals(2)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(e.defaultPrevented).equals(false)
	})

	o("handles onclick returning false", function() {
		var spyDiv = eventSpy(function() { return false })
		var spyParent = eventSpy()
		var div = m("div", {onclick: spyDiv})
		var parent = m("div", {onclick: spyParent}, div)
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, parent)
		div.dom.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.dom)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.dom)
		o(spyDiv.calls[0].currentTarget).equals(div.dom)
		o(spyParent.calls.length).equals(0)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(e.defaultPrevented).equals(true)
	})

	o("handles click EventListener object", function() {
		var spyDiv = eventSpy()
		var spyParent = eventSpy()
		var listenerDiv = {handleEvent: spyDiv}
		var listenerParent = {handleEvent: spyParent}
		var div = m("div", {onclick: listenerDiv})
		var parent = m("div", {onclick: listenerParent}, div)
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, parent)
		div.dom.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(listenerDiv)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.dom)
		o(spyDiv.calls[0].currentTarget).equals(div.dom)
		o(spyParent.calls.length).equals(1)
		o(spyParent.calls[0].this).equals(listenerParent)
		o(spyParent.calls[0].type).equals("click")
		o(spyParent.calls[0].target).equals(div.dom)
		o(spyParent.calls[0].currentTarget).equals(parent.dom)
		o(redraw.callCount).equals(2)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(e.defaultPrevented).equals(false)
	})

	o("handles click EventListener object returning false", function() {
		var spyDiv = eventSpy(function() { return false })
		var spyParent = eventSpy()
		var listenerDiv = {handleEvent: spyDiv}
		var listenerParent = {handleEvent: spyParent}
		var div = m("div", {onclick: listenerDiv})
		var parent = m("div", {onclick: listenerParent}, div)
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, parent)
		div.dom.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(listenerDiv)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.dom)
		o(spyDiv.calls[0].currentTarget).equals(div.dom)
		o(spyParent.calls.length).equals(1)
		o(spyParent.calls[0].this).equals(listenerParent)
		o(spyParent.calls[0].type).equals("click")
		o(spyParent.calls[0].target).equals(div.dom)
		o(spyParent.calls[0].currentTarget).equals(parent.dom)
		o(redraw.callCount).equals(2)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(e.defaultPrevented).equals(false)
	})

	o("removes event", function() {
		var spy = o.spy()
		var vnode = m("a", {onclick: spy})
		var updated = m("a")

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event when null", function() {
		var spy = o.spy()
		var vnode = m("a", {onclick: spy})
		var updated = m("a", {onclick: null})

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event when undefined", function() {
		var spy = o.spy()
		var vnode = m("a", {onclick: spy})
		var updated = m("a", {onclick: undefined})

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event added via addEventListener when null", function() {
		var spy = o.spy()
		var vnode = m("a", {ontouchstart: spy})
		var updated = m("a", {ontouchstart: null})

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("TouchEvents")
		e.initEvent("touchstart", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event added via addEventListener", function() {
		var spy = o.spy()
		var vnode = m("a", {ontouchstart: spy})
		var updated = m("a")

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("TouchEvents")
		e.initEvent("touchstart", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event added via addEventListener when undefined", function() {
		var spy = o.spy()
		var vnode = m("a", {ontouchstart: spy})
		var updated = m("a", {ontouchstart: undefined})

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("TouchEvents")
		e.initEvent("touchstart", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes EventListener object", function() {
		var spy = o.spy()
		var listener = {handleEvent: spy}
		var vnode = m("a", {onclick: listener})
		var updated = m("a")

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes EventListener object when null", function() {
		var spy = o.spy()
		var listener = {handleEvent: spy}
		var vnode = m("a", {onclick: listener})
		var updated = m("a", {onclick: null})

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes EventListener object when undefined", function() {
		var spy = o.spy()
		var listener = {handleEvent: spy}
		var vnode = m("a", {onclick: listener})
		var updated = m("a", {onclick: undefined})

		render(root, vnode)
		render(root, updated)

		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.dom.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("fires onclick only once after redraw", function() {
		var spy = o.spy()
		var div = m("div", {id: "a", onclick: spy})
		var updated = m("div", {id: "b", onclick: spy})
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, div)
		render(root, updated)
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.dom)
		o(spy.args[0].type).equals("click")
		o(spy.args[0].target).equals(div.dom)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(div.dom).equals(updated.dom)
		o(div.dom.attributes["id"].value).equals("b")
	})

	o("fires click EventListener object only once after redraw", function() {
		var spy = o.spy()
		var listener = {handleEvent: spy}
		var div = m("div", {id: "a", onclick: listener})
		var updated = m("div", {id: "b", onclick: listener})
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(root, div)
		render(root, updated)
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(listener)
		o(spy.args[0].type).equals("click")
		o(spy.args[0].target).equals(div.dom)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(div.dom).equals(updated.dom)
		o(div.dom.attributes["id"].value).equals("b")
	})

	o("handles ontransitionend", function() {
		var spy = o.spy()
		var div = m("div", {ontransitionend: spy})
		var e = $window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)

		render(root, div)
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.dom)
		o(spy.args[0].type).equals("transitionend")
		o(spy.args[0].target).equals(div.dom)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
	})

	o("handles transitionend EventListener object", function() {
		var spy = o.spy()
		var listener = {handleEvent: spy}
		var div = m("div", {ontransitionend: listener})
		var e = $window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)

		render(root, div)
		div.dom.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(listener)
		o(spy.args[0].type).equals("transitionend")
		o(spy.args[0].target).equals(div.dom)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
	})

	o("handles changed spy", function() {
		var div1 = m("div", {ontransitionend: function() {}})

		reallyRender(root, [div1], redraw)
		var e = $window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)
		div1.dom.dispatchEvent(e)

		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)

		var replacementRedraw = o.spy()
		var div2 = m("div", {ontransitionend: function() {}})

		reallyRender(root, [div2], replacementRedraw)
		var e = $window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)
		div2.dom.dispatchEvent(e)

		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(replacementRedraw.callCount).equals(1)
		o(replacementRedraw.this).equals(undefined)
		o(replacementRedraw.args.length).equals(0)
	})
})
