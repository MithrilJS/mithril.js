"use strict"

// Low-priority TODO: remove the dependency on the renderer here.
var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var throttleMocker = require("../../test-utils/throttleMock")
var mountRedraw = require("../../api/mount-redraw")
var h = require("../../render/hyperscript")

o.spec("mount/redraw", function() {
	var root, m, throttleMock, consoleMock, $document, errors
	o.beforeEach(function() {
		var $window = domMock()
		consoleMock = {error: o.spy()}
		throttleMock = throttleMocker()
		root = $window.document.body
		m = mountRedraw(throttleMock.schedule, consoleMock)
		$document = $window.document
		errors = []
	})

	o.afterEach(function() {
		o(consoleMock.error.calls.map(function(c) {
			return c.args[0]
		})).deepEquals(errors)
		o(throttleMock.queueLength()).equals(0)
	})

	o("shouldn't error if there are no renderers", function() {
		m.redraw()
		throttleMock.fire()
	})

	o("schedules correctly", function() {
		var spy = o.spy()

		m.mount(root, spy)
		o(spy.callCount).equals(1)
		m.redraw()
		o(spy.callCount).equals(1)
		throttleMock.fire()
		o(spy.callCount).equals(2)
	})

	o("should run a single renderer entry", function() {
		var spy = o.spy()

		m.mount(root, spy)

		o(spy.callCount).equals(1)

		m.redraw()
		m.redraw()
		m.redraw()

		o(spy.callCount).equals(1)
		throttleMock.fire()
		o(spy.callCount).equals(2)
	})

	o("should run all renderer entries", function() {
		var el1 = $document.createElement("div")
		var el2 = $document.createElement("div")
		var el3 = $document.createElement("div")
		var spy1 = o.spy()
		var spy2 = o.spy()
		var spy3 = o.spy()

		m.mount(el1, spy1)
		m.mount(el2, spy2)
		m.mount(el3, spy3)

		m.redraw()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		m.redraw()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		throttleMock.fire()

		o(spy1.callCount).equals(2)
		o(spy2.callCount).equals(2)
		o(spy3.callCount).equals(2)
	})

	o("should not redraw when mounting another root", function() {
		var el1 = $document.createElement("div")
		var el2 = $document.createElement("div")
		var el3 = $document.createElement("div")
		var spy1 = o.spy()
		var spy2 = o.spy()
		var spy3 = o.spy()

		m.mount(el1, spy1)
		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(0)
		o(spy3.callCount).equals(0)

		m.mount(el2, spy2)
		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(0)

		m.mount(el3, spy3)
		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)
	})

	o("should stop running after mount null", function() {
		var spy = o.spy()

		m.mount(root, spy)
		o(spy.callCount).equals(1)
		m.mount(root, null)

		m.redraw()

		o(spy.callCount).equals(1)
		throttleMock.fire()
		o(spy.callCount).equals(1)
	})

	o("should stop running after mount undefined", function() {
		var spy = o.spy()

		m.mount(root, spy)
		o(spy.callCount).equals(1)
		m.mount(root, undefined)

		m.redraw()

		o(spy.callCount).equals(1)
		throttleMock.fire()
		o(spy.callCount).equals(1)
	})

	o("should stop running after mount no arg", function() {
		var spy = o.spy()

		m.mount(root, spy)
		o(spy.callCount).equals(1)
		m.mount(root)

		m.redraw()

		o(spy.callCount).equals(1)
		throttleMock.fire()
		o(spy.callCount).equals(1)
	})

	o("should invoke remove callback on unmount", function() {
		var onabort = o.spy()
		var spy = o.spy(() => h.layout((_, signal) => { signal.onabort = onabort }))

		m.mount(root, spy)
		o(spy.callCount).equals(1)
		m.mount(root)

		o(spy.callCount).equals(1)
		o(onabort.callCount).equals(1)
	})

	o("should stop running after unsubscribe, even if it occurs after redraw is requested", function() {
		var spy = o.spy()

		m.mount(root, spy)
		o(spy.callCount).equals(1)
		m.redraw()
		m.mount(root)

		o(spy.callCount).equals(1)
		throttleMock.fire()
		o(spy.callCount).equals(1)
	})

	o("does nothing on invalid unmount", function() {
		var spy = o.spy()

		m.mount(root, spy)
		o(spy.callCount).equals(1)

		m.mount(null)
		m.redraw()
		throttleMock.fire()
		o(spy.callCount).equals(2)
	})

	o("redraw.sync() redraws all roots synchronously", function() {
		var el1 = $document.createElement("div")
		var el2 = $document.createElement("div")
		var el3 = $document.createElement("div")
		var spy1 = o.spy()
		var spy2 = o.spy()
		var spy3 = o.spy()

		m.mount(el1, spy1)
		m.mount(el2, spy2)
		m.mount(el3, spy3)

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		m.redraw.sync()

		o(spy1.callCount).equals(2)
		o(spy2.callCount).equals(2)
		o(spy3.callCount).equals(2)

		m.redraw.sync()

		o(spy1.callCount).equals(3)
		o(spy2.callCount).equals(3)
		o(spy3.callCount).equals(3)
	})


	o("throws on invalid view", function() {
		o(function() { m.mount(root, {}) }).throws(TypeError)
	})

	o("skips roots that were synchronously unsubscribed before they were visited", function() {
		var calls = []
		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var root3 = $document.createElement("div")

		m.mount(root1, () => h.layout((_, __, isInit) => {
			if (!isInit) m.mount(root2, null)
			calls.push("root1")
		}))
		m.mount(root2, () => { calls.push("root2") })
		m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		m.redraw.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root3",
		])
	})

	o("keeps its place when synchronously unsubscribing previously visited roots", function() {
		var calls = []
		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var root3 = $document.createElement("div")

		m.mount(root1, () => { calls.push("root1") })
		m.mount(root2, () => h.layout((_, __, isInit) => {
			if (!isInit) m.mount(root1, null)
			calls.push("root2")
		}))
		m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		m.redraw.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root2", "root3",
		])
	})

	o("keeps its place when synchronously unsubscribing previously visited roots in the face of errors", function() {
		errors = ["fail"]
		var calls = []
		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var root3 = $document.createElement("div")

		m.mount(root1, () => { calls.push("root1") })
		m.mount(root2, () => h.layout((_, __, isInit) => {
			if (!isInit) { m.mount(root1, null); throw "fail" }
			calls.push("root2")
		}))
		m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		m.redraw.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root3",
		])
	})

	o("keeps its place when synchronously unsubscribing the current root", function() {
		var calls = []
		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var root3 = $document.createElement("div")

		m.mount(root1, () => { calls.push("root1") })
		m.mount(root2, () => h.layout((_, __, isInit) => {
			if (!isInit) try { m.mount(root2, null) } catch (e) { calls.push([e.constructor, e.message]) }
			calls.push("root2")
		}))
		m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		m.redraw.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", [TypeError, "Node is currently being rendered to and thus is locked."], "root2", "root3",
		])
	})

	o("keeps its place when synchronously unsubscribing the current root in the face of an error", function() {
		errors = [
			[TypeError, "Node is currently being rendered to and thus is locked."],
		]
		var calls = []
		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var root3 = $document.createElement("div")

		m.mount(root1, () => { calls.push("root1") })
		m.mount(root2, () => h.layout((_, __, isInit) => {
			if (!isInit) try { m.mount(root2, null) } catch (e) { throw [e.constructor, e.message] }
			calls.push("root2")
		}))
		m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		m.redraw.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root3",
		])
	})

	o("throws on invalid `root` DOM node", function() {
		o(function() {
			m.mount(null, () => {})
		}).throws(TypeError)
	})

	o("renders into `root` synchronously", function() {
		m.mount(root, () => h("div"))

		o(root.firstChild.nodeName).equals("DIV")
	})

	o("mounting null unmounts", function() {
		m.mount(root, () => h("div"))

		m.mount(root, null)

		o(root.childNodes.length).equals(0)
	})

	o("Mounting a second root doesn't cause the first one to redraw", function() {
		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var view = o.spy()

		m.mount(root1, view)
		o(view.callCount).equals(1)

		m.mount(root2, () => {})

		o(view.callCount).equals(1)

		throttleMock.fire()
		o(view.callCount).equals(1)
	})

	o("redraws on events", function() {
		var layout = o.spy()
		var onclick = o.spy()
		var e = $document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		m.mount(root, () => h("div", {
			onclick: onclick,
		}, h.layout(layout)))

		root.firstChild.dispatchEvent(e)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])

		o(onclick.callCount).equals(1)
		o(onclick.this).equals(root.firstChild)
		o(onclick.args[0].type).equals("click")
		o(onclick.args[0].target).equals(root.firstChild)

		throttleMock.fire()

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, false])
	})

	o("redraws several mount points on events", function() {
		var layout0 = o.spy()
		var onclick0 = o.spy()
		var layout1 = o.spy()
		var onclick1 = o.spy()

		var root1 = $document.createElement("div")
		var root2 = $document.createElement("div")
		var e = $document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		m.mount(root1, () => h("div", {
			onclick: onclick0,
		}, h.layout(layout0)))

		o(layout0.calls.map((c) => c.args[2])).deepEquals([true])

		m.mount(root2, () => h("div", {
			onclick: onclick1,
		}, h.layout(layout1)))

		o(layout1.calls.map((c) => c.args[2])).deepEquals([true])

		root1.firstChild.dispatchEvent(e)
		o(onclick0.callCount).equals(1)
		o(onclick0.this).equals(root1.firstChild)

		throttleMock.fire()

		o(layout0.calls.map((c) => c.args[2])).deepEquals([true, false])
		o(layout1.calls.map((c) => c.args[2])).deepEquals([true, false])

		root2.firstChild.dispatchEvent(e)

		o(onclick1.callCount).equals(1)
		o(onclick1.this).equals(root2.firstChild)

		throttleMock.fire()

		o(layout0.calls.map((c) => c.args[2])).deepEquals([true, false, false])
		o(layout1.calls.map((c) => c.args[2])).deepEquals([true, false, false])
	})

	o("event handlers can skip redraw", function() {
		var layout = o.spy()
		var e = $document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		m.mount(root, () => h("div", {
			onclick: () => false,
		}, h.layout(layout)))

		root.firstChild.dispatchEvent(e)

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])

		throttleMock.fire()

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])
	})

	o("redraws when the render function is run", function() {
		var layout = o.spy()

		m.mount(root, () => h("div", h.layout(layout)))

		o(layout.calls.map((c) => c.args[2])).deepEquals([true])

		m.redraw()

		throttleMock.fire()

		o(layout.calls.map((c) => c.args[2])).deepEquals([true, false])
	})

	o("emits errors correctly", function() {
		errors = ["foo", "bar", "baz"]
		var counter = -1

		m.mount(root, () => {
			var value = errors[counter++]
			if (value != null) throw value
			return null
		})

		m.redraw()
		throttleMock.fire()
		m.redraw()
		throttleMock.fire()
		m.redraw()
		throttleMock.fire()
	})
})
