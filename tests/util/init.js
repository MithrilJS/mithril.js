import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("m.init", () => {
	var G = setupGlobals()

	o("works when returning `undefined`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return undefined })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(1)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(1)
	})

	o("works when resolving to `undefined`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return Promise.resolve(undefined) })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(1)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(1)
	})

	o("works when returning `null`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return null })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(1)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(1)
	})

	o("works when resolving to `null`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return Promise.resolve(null) })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(1)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(1)
	})

	o("works when returning `true`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return true })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(1)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(1)
	})

	o("works when resolving to `true`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return Promise.resolve(true) })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(1)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(1)
	})

	o("works when returning `false`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return false })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(0)
	})

	o("works when resolving to `false`", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort; return Promise.resolve(false) })
		var redraw = o.spy()

		m.render(G.window.document.body, m.init(initializer), redraw)
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, m.init(initializer), redraw)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		o(redraw.callCount).equals(0)
		m.render(G.window.document.body, null, redraw)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
		o(redraw.callCount).equals(0)
	})
})
