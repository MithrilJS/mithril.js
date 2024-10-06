import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"
import use from "../../src/std/use.js"

o.spec("m.use", () => {
	o("works with empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })
		var $window = domMock()

		m.render($window.document.body, use([], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		m.render($window.document.body, use([], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(0)

		m.render($window.document.body, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)
	})

	o("works with equal non-empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })
		var $window = domMock()

		m.render($window.document.body, use([1], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		m.render($window.document.body, use([1], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(0)

		m.render($window.document.body, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)
	})

	o("works with non-equal same-length non-empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })
		var $window = domMock()

		m.render($window.document.body, use([1], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		m.render($window.document.body, use([2], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)

		m.render($window.document.body, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(2)
	})
})
