"use strict"

var o = require("../../ospec/ospec")
var stream = require("../stream")

o.spec("scan", function() {
	o("defaults to seed", function() {
		var parent = stream()
		var child = stream.scan(function(out, p) {
			return out - p
		}, 123, parent)
		o(child()).equals(123)
	})

	o("accumulates values as expected", function() {
		var parent = stream()
		var child = stream.scan(function(arr, p) {
			return arr.concat(p)
		}, [], parent)

		parent(7)
		parent("11")
		parent(undefined)
		parent({a: 1})
		var result = child()

		// deepEquals fails on arrays?
		o(result[0]).equals(7)
		o(result[1]).equals("11")
		o(result[2]).equals(undefined)
		o(result[3]).deepEquals({a: 1})
	})
})
