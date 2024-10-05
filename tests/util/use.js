"use strict"

var o = require("ospec")
var use = require("../../src/std/use")
var domMock = require("../../test-utils/domMock")
var render = require("../../src/core/render")
var m = require("../../src/core/hyperscript")

o.spec("m.use", () => {
	o("works with empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })
		var $window = domMock()

		render($window.document.body, use([], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		render($window.document.body, use([], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(0)

		render($window.document.body, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)
	})

	o("works with equal non-empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })
		var $window = domMock()

		render($window.document.body, use([1], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		render($window.document.body, use([1], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(0)

		render($window.document.body, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)
	})

	o("works with non-equal same-length non-empty arrays", () => {
		var onabort = o.spy()
		var initializer = o.spy((_, signal) => { signal.onabort = onabort })
		var $window = domMock()

		render($window.document.body, use([1], m.layout(initializer)))
		o(initializer.callCount).equals(1)
		o(onabort.callCount).equals(0)

		render($window.document.body, use([2], m.layout(initializer)))
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(1)

		render($window.document.body, null)
		o(initializer.callCount).equals(2)
		o(onabort.callCount).equals(2)
	})
})
