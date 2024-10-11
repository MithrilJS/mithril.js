import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("event", function() {
	var redraw
	var G = setupGlobals({initialize() { redraw = o.spy() }})

	function render(dom, vnode) {
		return m.render(dom, vnode, redraw)
	}

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
		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(G.root, parent)
		div.d.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.d)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.d)
		o(spyDiv.calls[0].currentTarget).equals(div.d)
		o(spyParent.calls.length).equals(1)
		o(spyParent.calls[0].this).equals(parent.d)
		o(spyParent.calls[0].type).equals("click")
		o(spyParent.calls[0].target).equals(div.d)
		o(spyParent.calls[0].currentTarget).equals(parent.d)
		o(redraw.callCount).equals(2)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(e.defaultPrevented).equals(false)
	})

	o("handles onclick asynchronously returning", function() {
		var promise
		var spyDiv = eventSpy(() => promise = Promise.resolve())
		var spyParent = eventSpy()
		var div = m("div", {onclick: spyDiv})
		var parent = m("div", {onclick: spyParent}, div)
		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(G.root, parent)
		div.d.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.d)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.d)
		o(spyDiv.calls[0].currentTarget).equals(div.d)
		o(spyParent.calls.length).equals(1)
		o(spyParent.calls[0].this).equals(parent.d)
		o(spyParent.calls[0].type).equals("click")
		o(spyParent.calls[0].target).equals(div.d)
		o(spyParent.calls[0].currentTarget).equals(parent.d)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(e.defaultPrevented).equals(false)

		return promise.then(() => {
			o(redraw.callCount).equals(2)
			o(redraw.this).equals(undefined)
			o(redraw.args.length).equals(0)
		})
	})

	o("handles onclick returning false", function() {
		var spyDiv = eventSpy((e) => { m.capture(e); return false })
		var spyParent = eventSpy()
		var div = m("div", {onclick: spyDiv})
		var parent = m("div", {onclick: spyParent}, div)
		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(G.root, parent)
		div.d.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.d)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.d)
		o(spyDiv.calls[0].currentTarget).equals(div.d)
		o(spyParent.calls.length).equals(0)
		o(redraw.callCount).equals(0)
		o(e.defaultPrevented).equals(true)
	})

	o("handles onclick asynchronously returning false", function() {
		var promise
		var spyDiv = eventSpy((e) => { m.capture(e); return promise = Promise.resolve(false) })
		var spyParent = eventSpy()
		var div = m("div", {onclick: spyDiv})
		var parent = m("div", {onclick: spyParent}, div)
		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(G.root, parent)
		div.d.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.d)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.d)
		o(spyDiv.calls[0].currentTarget).equals(div.d)
		o(spyParent.calls.length).equals(0)
		o(redraw.callCount).equals(0)
		o(e.defaultPrevented).equals(true)

		return promise.then(() => {
			o(redraw.callCount).equals(0)
		})
	})

	o("handles onclick returning false in child then bubbling to parent and not returning false", function() {
		var spyDiv = eventSpy(() => false)
		var spyParent = eventSpy()
		var div = m("div", {onclick: spyDiv})
		var parent = m("div", {onclick: spyParent}, div)
		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(G.root, parent)
		div.d.dispatchEvent(e)

		o(spyDiv.calls.length).equals(1)
		o(spyDiv.calls[0].this).equals(div.d)
		o(spyDiv.calls[0].type).equals("click")
		o(spyDiv.calls[0].target).equals(div.d)
		o(spyDiv.calls[0].currentTarget).equals(div.d)
		o(spyParent.calls.length).equals(1)
		o(redraw.callCount).equals(1)
		o(e.defaultPrevented).equals(false)
	})

	o("removes event", function() {
		var spy = o.spy()
		var vnode = m("a", {onclick: spy})
		var updated = m("a")

		render(G.root, vnode)
		render(G.root, updated)

		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.d.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event when null", function() {
		var spy = o.spy()
		var vnode = m("a", {onclick: spy})
		var updated = m("a", {onclick: null})

		render(G.root, vnode)
		render(G.root, updated)

		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.d.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event when undefined", function() {
		var spy = o.spy()
		var vnode = m("a", {onclick: spy})
		var updated = m("a", {onclick: undefined})

		render(G.root, vnode)
		render(G.root, updated)

		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		vnode.d.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event added via addEventListener when null", function() {
		var spy = o.spy()
		var vnode = m("a", {ontouchstart: spy})
		var updated = m("a", {ontouchstart: null})

		render(G.root, vnode)
		render(G.root, updated)

		var e = G.window.document.createEvent("TouchEvents")
		e.initEvent("touchstart", true, true)
		vnode.d.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event added via addEventListener", function() {
		var spy = o.spy()
		var vnode = m("a", {ontouchstart: spy})
		var updated = m("a")

		render(G.root, vnode)
		render(G.root, updated)

		var e = G.window.document.createEvent("TouchEvents")
		e.initEvent("touchstart", true, true)
		vnode.d.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("removes event added via addEventListener when undefined", function() {
		var spy = o.spy()
		var vnode = m("a", {ontouchstart: spy})
		var updated = m("a", {ontouchstart: undefined})

		render(G.root, vnode)
		render(G.root, updated)

		var e = G.window.document.createEvent("TouchEvents")
		e.initEvent("touchstart", true, true)
		vnode.d.dispatchEvent(e)

		o(spy.callCount).equals(0)
	})

	o("fires onclick only once after redraw", function() {
		var spy = o.spy()
		var div = m("div", {id: "a", onclick: spy})
		var updated = m("div", {id: "b", onclick: spy})
		var e = G.window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)

		render(G.root, div)
		render(G.root, updated)
		div.d.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.d)
		o(spy.args[0].type).equals("click")
		o(spy.args[0].target).equals(div.d)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(div.d).equals(updated.d)
		o(div.d.attributes["id"].value).equals("b")
	})

	o("handles ontransitionend", function() {
		var spy = o.spy()
		var div = m("div", {ontransitionend: spy})
		var e = G.window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)

		render(G.root, div)
		div.d.dispatchEvent(e)

		o(spy.callCount).equals(1)
		o(spy.this).equals(div.d)
		o(spy.args[0].type).equals("transitionend")
		o(spy.args[0].target).equals(div.d)
		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
	})

	o("handles changed spy", function() {
		var div1 = m("div", {ontransitionend: function() {}})

		m.render(G.root, [div1], redraw)
		var e = G.window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)
		div1.d.dispatchEvent(e)

		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)

		var replacementRedraw = o.spy()
		var div2 = m("div", {ontransitionend: function() {}})

		m.render(G.root, [div2], replacementRedraw)
		var e = G.window.document.createEvent("HTMLEvents")
		e.initEvent("transitionend", true, true)
		div2.d.dispatchEvent(e)

		o(redraw.callCount).equals(1)
		o(redraw.this).equals(undefined)
		o(redraw.args.length).equals(0)
		o(replacementRedraw.callCount).equals(1)
		o(replacementRedraw.this).equals(undefined)
		o(replacementRedraw.args.length).equals(0)
	})
})