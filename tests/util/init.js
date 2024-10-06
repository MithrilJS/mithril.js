import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import init from "../../src/std/init.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("m.init", () => {
	o("works", async () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort })
		var $window = domMock()

		m.render($window.document.body, init(initializer))
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		m.render($window.document.body, init(initializer))

		await Promise.resolve()
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)
		m.render($window.document.body, null)

		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(1)
	})
})
