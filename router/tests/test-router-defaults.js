"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var Router = require("../../router/router")

o.spec("core router defaults", function() {
	o("as expected", function () {
		var router = new Router(pushStateMock())

		o(router.prefix).equals("#!")
		o(router.usePushState).equals(true)
	})
})