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

	o("reducer can return HALT to prevent child updates", function() {
		var count = 0
		var action = stream()
		var store = stream.scan(function (arr, value) {
			switch (typeof value) {
				case "number":
					return arr.concat(value)
				default:
					return stream.HALT
			}
		}, [], action)
		var child = store.map(function (p) {
			count++
			return p
		})
		var result

		action(7)
		action("11")
		action(undefined)
		action({a: 1})

		result = child()

		// check we got the expect result
		o(result[0]).equals(7)

		// check child received minimum # of updates
		o(count).equals(2)
	})

})
