"use strict"

var o = require("../../ospec/ospec")
var prop = require("../../util/prop")

o.spec("prop", function() {
	o("works", function() {
		var store = prop(1)
		var initialValue = store()
		store(2)
		var newValue = store()

		o(initialValue).equals(1)
		o(newValue).equals(2)
	})
})
