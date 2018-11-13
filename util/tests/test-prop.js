"use strict"

var o = require("../../ospec/ospec")
var prop = require("../../util/prop")

o.spec("prop", function() {
	o("works", function() {
		var p = prop(1)

		o(p.get()).equals(1)
		o(p.toJSON()).equals(1)
		o(p.set(2)).equals(2)
		o(p.get()).equals(2)
		o(p.toJSON()).equals(2)
	})
})
