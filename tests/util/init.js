"use strict"

var o = require("ospec")
var init = require("../../src/std/init")
var domMock = require("../../test-utils/domMock")
var render = require("../../src/core/render")

o.spec("m.init", () => {
	o("works", () => {
		var onabort = o.spy()
		var initializer = o.spy((signal) => { signal.onabort = onabort })
		var $window = domMock()

		render($window.document.body, init(initializer))
		o(initializer.callCount).equals(0)
		o(onabort.callCount).equals(0)

		return Promise.resolve()
			.then(() => {
				o(initializer.callCount).equals(1)
				o(onabort.callCount).equals(0)
				render($window.document.body, init(initializer))
			})
			.then(() => {
				o(initializer.callCount).equals(1)
				o(onabort.callCount).equals(0)
				render($window.document.body, null)

				o(initializer.callCount).equals(1)
				o(onabort.callCount).equals(1)
			})
	})
})
