import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("mount/redraw", function() {
	var G = setupGlobals({
		initialize() { console.error = o.spy() },
	})

	o("schedules correctly", function() {
		var spy = o.spy()

		var redraw = m.mount(G.root, spy)
		o(spy.callCount).equals(1)
		redraw()
		o(spy.callCount).equals(1)
		G.rafMock.fire()
		o(spy.callCount).equals(2)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("should run a single renderer entry", function() {
		var spy = o.spy()

		var redraw = m.mount(G.root, spy)

		o(spy.callCount).equals(1)

		redraw()
		redraw()
		redraw()

		o(spy.callCount).equals(1)
		G.rafMock.fire()
		o(spy.callCount).equals(2)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("`redraw()` schedules independent handles independently", function() {
		var $document = G.window.document

		var el1 = $document.createElement("div")
		var el2 = $document.createElement("div")
		var el3 = $document.createElement("div")
		var spy1 = o.spy()
		var spy2 = o.spy()
		var spy3 = o.spy()

		var redraw1 = m.mount(el1, spy1)
		var redraw2 = m.mount(el2, spy2)
		var redraw3 = m.mount(el3, spy3)

		redraw1()
		redraw2()
		redraw3()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		redraw1()
		redraw2()
		redraw3()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		G.rafMock.fire()

		o(spy1.callCount).equals(2)
		o(spy2.callCount).equals(2)
		o(spy3.callCount).equals(2)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("should not redraw when mounting another root", function() {
		var $document = G.window.document

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

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("should invoke remove callback on unmount", function() {
		var onabort = o.spy()
		var spy = o.spy(() => m.layout((_, signal) => { signal.onabort = onabort }))

		m.mount(G.root, spy)
		o(spy.callCount).equals(1)
		m.render(G.root, null)

		o(spy.callCount).equals(1)
		o(onabort.callCount).equals(1)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("should stop running after unsubscribe, even if it occurs after redraw is requested", function() {
		var spy = o.spy()

		var redraw = m.mount(G.root, spy)
		o(spy.callCount).equals(1)
		redraw()
		m.render(G.root, null)

		o(spy.callCount).equals(1)
		G.rafMock.fire()
		o(spy.callCount).equals(1)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("`redraw.sync()` redraws independent roots synchronously", function() {
		var $document = G.window.document

		var el1 = $document.createElement("div")
		var el2 = $document.createElement("div")
		var el3 = $document.createElement("div")
		var spy1 = o.spy()
		var spy2 = o.spy()
		var spy3 = o.spy()

		var redraw1 = m.mount(el1, spy1)
		var redraw2 = m.mount(el2, spy2)
		var redraw3 = m.mount(el3, spy3)

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		redraw1.sync()
		redraw2.sync()
		redraw3.sync()

		o(spy1.callCount).equals(2)
		o(spy2.callCount).equals(2)
		o(spy3.callCount).equals(2)

		redraw1.sync()
		redraw2.sync()
		redraw3.sync()

		o(spy1.callCount).equals(3)
		o(spy2.callCount).equals(3)
		o(spy3.callCount).equals(3)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("throws on invalid view", function() {
		o(function() { m.mount(G.root, {}) }).throws(TypeError)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("keeps its place when synchronously unsubscribing previously visited roots", function() {
		var $document = G.window.document

		var calls = []
		var root1 = G.register($document.createElement("div"))
		var root2 = G.register($document.createElement("div"))
		var root3 = G.register($document.createElement("div"))

		var redraw1 = m.mount(root1, () => { calls.push("root1") })
		var redraw2 = m.mount(root2, (isInit) => {
			if (!isInit) m.render(root1, null)
			calls.push("root2")
		})
		var redraw3 = m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		redraw1.sync()
		redraw2.sync()
		redraw3.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root2", "root3",
		])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("keeps its place when synchronously unsubscribing previously visited roots in the face of events", function() {
		var $document = G.window.document
		var calls = []
		var root1 = G.register($document.createElement("div"))
		var root2 = G.register($document.createElement("div"))
		var root3 = G.register($document.createElement("div"))

		var redraw1 = m.mount(root1, () => { calls.push("root1") })
		var redraw2 = m.mount(root2, (isInit) => {
			if (!isInit) { m.render(root1, null); throw new Error("fail") }
			calls.push("root2")
		})
		var redraw3 = m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		redraw1.sync()
		o(() => redraw2.sync()).throws("fail")
		redraw3.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root3",
		])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("keeps its place when synchronously unsubscribing the current root", function() {
		var $document = G.window.document

		var calls = []
		var root1 = G.register($document.createElement("div"))
		var root2 = G.register($document.createElement("div"))
		var root3 = G.register($document.createElement("div"))

		var redraw1 = m.mount(root1, () => { calls.push("root1") })
		var redraw2 = m.mount(root2, (isInit) => {
			if (!isInit) m.render(root2, null)
			calls.push("root2")
		})
		var redraw3 = m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		redraw1.sync()
		o(() => redraw2.sync()).throws(TypeError)
		redraw3.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root3",
		])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("keeps its place when synchronously unsubscribing the current root in the face of an error", function() {
		var $document = G.window.document
		var calls = []
		var root1 = G.register($document.createElement("div"))
		var root2 = G.register($document.createElement("div"))
		var root3 = G.register($document.createElement("div"))

		var redraw1 = m.mount(root1, () => { calls.push("root1") })
		var redraw2 = m.mount(root2, (isInit) => {
			if (!isInit) m.render(root2, null)
			calls.push("root2")
		})
		var redraw3 = m.mount(root3, () => { calls.push("root3") })
		o(calls).deepEquals([
			"root1", "root2", "root3",
		])

		redraw1.sync()
		o(() => redraw2.sync()).throws(TypeError)
		redraw3.sync()
		o(calls).deepEquals([
			"root1", "root2", "root3",
			"root1", "root3",
		])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("throws on invalid `root` DOM node", function() {
		o(function() {
			m.mount(null, () => {})
		}).throws(TypeError)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("renders into `root` synchronously", function() {
		m.mount(G.root, () => m("div"))

		o(G.root.firstChild.nodeName).equals("DIV")

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("mounting null unmounts", function() {
		m.mount(G.root, () => m("div"))

		m.render(G.root, null)

		o(G.root.childNodes.length).equals(0)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("Mounting a second root doesn't cause the first one to redraw", function() {
		var $document = G.window.document

		var root1 = G.register($document.createElement("div"))
		var root2 = G.register($document.createElement("div"))
		var view = o.spy()

		m.mount(root1, view)
		o(view.callCount).equals(1)

		m.mount(root2, () => {})

		o(view.callCount).equals(1)

		G.rafMock.fire()
		o(view.callCount).equals(1)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("redraws on events", function() {
		var $document = G.window.document

		var layout = o.spy()
		var onclick = o.spy()
		var e = $document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		m.mount(G.root, () => m("div", {
			onclick: onclick,
		}, m.layout(() => layout(true), () => layout(false))))

		G.root.firstChild.dispatchEvent(e)

		o(layout.calls.map((c) => c.args[0])).deepEquals([true])

		o(onclick.callCount).equals(1)
		o(onclick.this).equals(G.root.firstChild)
		o(onclick.args[0].type).equals("click")
		o(onclick.args[0].target).equals(G.root.firstChild)

		G.rafMock.fire()

		o(layout.calls.map((c) => c.args[0])).deepEquals([true, false])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("redraws only parent mount point on events", function() {
		var $document = G.window.document

		var layout0 = o.spy()
		var onclick0 = o.spy()
		var layout1 = o.spy()
		var onclick1 = o.spy()

		var root1 = G.register($document.createElement("div"))
		var root2 = G.register($document.createElement("div"))
		var e = $document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		m.mount(root1, () => m("div", {
			onclick: onclick0,
		}, m.layout(() => layout0(true), () => layout0(false))))

		o(layout0.calls.map((c) => c.args[0])).deepEquals([true])

		m.mount(root2, () => m("div", {
			onclick: onclick1,
		}, m.layout(() => layout1(true), () => layout1(false))))

		o(layout1.calls.map((c) => c.args[0])).deepEquals([true])

		root1.firstChild.dispatchEvent(e)
		o(onclick0.callCount).equals(1)
		o(onclick0.this).equals(root1.firstChild)

		G.rafMock.fire()

		o(layout0.calls.map((c) => c.args[0])).deepEquals([true, false])
		o(layout1.calls.map((c) => c.args[0])).deepEquals([true])

		root2.firstChild.dispatchEvent(e)

		o(onclick1.callCount).equals(1)
		o(onclick1.this).equals(root2.firstChild)

		G.rafMock.fire()

		o(layout0.calls.map((c) => c.args[0])).deepEquals([true, false])
		o(layout1.calls.map((c) => c.args[0])).deepEquals([true, false])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("event handlers can skip redraw", function() {
		var $document = G.window.document

		var layout = o.spy()
		var e = $document.createEvent("MouseEvents")

		e.initEvent("click", true, true)

		m.mount(G.root, () => m("div", {
			onclick: () => false,
		}, m.layout(() => layout(true), () => layout(false))))

		G.root.firstChild.dispatchEvent(e)

		o(layout.calls.map((c) => c.args[0])).deepEquals([true])

		G.rafMock.fire()

		o(layout.calls.map((c) => c.args[0])).deepEquals([true])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("redraws when the render function is run", function() {
		var layout = o.spy()

		var redraw = m.mount(G.root, () => m("div", m.layout(() => layout(true), () => layout(false))))

		o(layout.calls.map((c) => c.args[0])).deepEquals([true])

		redraw()

		G.rafMock.fire()

		o(layout.calls.map((c) => c.args[0])).deepEquals([true, false])

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("remounts after `m.render(G.root, null)` is invoked on the mounted root", function() {
		var onabort = o.spy()
		var onCreate = o.spy((_, signal) => { signal.onabort = onabort })
		var onUpdate = o.spy((_, signal) => { signal.onabort = onabort })

		var redraw = m.mount(G.root, () => m("div", m.layout(onCreate, onUpdate)))

		o(onCreate.callCount).equals(1)
		o(onUpdate.callCount).equals(0)
		o(onabort.callCount).equals(0)

		m.render(G.root, null)
		o(onCreate.callCount).equals(1)
		o(onUpdate.callCount).equals(0)
		o(onabort.callCount).equals(1)

		redraw()

		G.rafMock.fire()

		o(onCreate.callCount).equals(2)
		o(onUpdate.callCount).equals(0)
		o(onabort.callCount).equals(1)

		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("propagates mount errors synchronously", function() {
		o(() => m.mount(G.root, () => { throw new Error("foo") })).throws("foo")
	})

	o("propagates redraw errors synchronously", function() {
		var counter = 0

		var redraw = m.mount(G.root, () => {
			switch (++counter) {
				case 1: return null
				case 2: throw new Error("foo")
				case 3: throw new Error("bar")
				case 4: throw new Error("baz")
				default: return null
			}
		})

		o(() => redraw.sync()).throws("foo")
		o(() => redraw.sync()).throws("bar")
		o(() => redraw.sync()).throws("baz")

		o(counter).equals(4)
		o(console.error.calls.map((c) => c.args[0])).deepEquals([])
		o(G.rafMock.queueLength()).equals(0)
	})

	o("lets redraw errors fall through to the scheduler", function() {
		var counter = 0

		var redraw = m.mount(G.root, () => {
			switch (++counter) {
				case 1: return null
				case 2: throw "foo"
				case 3: throw "bar"
				case 4: throw "baz"
				default: return null
			}
		})

		redraw()
		G.rafMock.fire()
		redraw()
		G.rafMock.fire()
		redraw()
		G.rafMock.fire()

		o(counter).equals(4)
		o(console.error.calls.map((c) => c.args[0])).deepEquals(["foo", "bar", "baz"])
		o(G.rafMock.queueLength()).equals(0)
	})
})
