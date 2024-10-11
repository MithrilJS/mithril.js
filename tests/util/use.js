import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("m.use", () => {
	var G = setupGlobals()

	o("works with empty arrays", () => {
		var onabort = o.spy()
		var create = o.spy((_, signal) => { signal.onabort = onabort })
		var update = o.spy((_, signal) => { signal.onabort = onabort })

		m.render(G.root, m.use([], m.layout(create, update)))
		o(create.callCount).equals(1)
		o(update.callCount).equals(0)
		o(onabort.callCount).equals(0)

		m.render(G.root, m.use([], m.layout(create, update)))
		o(create.callCount).equals(1)
		o(update.callCount).equals(1)
		o(onabort.callCount).equals(0)

		m.render(G.root, null)
		o(create.callCount).equals(1)
		o(update.callCount).equals(1)
		o(onabort.callCount).equals(1)
	})

	o("works with equal non-empty arrays", () => {
		var onabort = o.spy()
		var create = o.spy((_, signal) => { signal.onabort = onabort })
		var update = o.spy((_, signal) => { signal.onabort = onabort })

		m.render(G.root, m.use([1], m.layout(create, update)))
		o(create.callCount).equals(1)
		o(update.callCount).equals(0)
		o(onabort.callCount).equals(0)

		m.render(G.root, m.use([1], m.layout(create, update)))
		o(create.callCount).equals(1)
		o(update.callCount).equals(1)
		o(onabort.callCount).equals(0)

		m.render(G.root, null)
		o(create.callCount).equals(1)
		o(update.callCount).equals(1)
		o(onabort.callCount).equals(1)
	})

	o("works with non-equal same-length non-empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })

		m.render(G.root, m.use([1], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		m.render(G.root, m.use([2], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)

		m.render(G.root, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(2)
	})
})
