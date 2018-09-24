"use strict"

var o = require("../../ospec/ospec")
var censor = require("../../util/censor")

o.spec("censor", function() {
	o("returns empty objects unmodified", function() {
		var attrs = {}

		o(censor(attrs)).equals(attrs)
	})

	o("returns non-empty objects without lifecycle methods unmodified", function() {
		var attrs = {foo: 1, bar: 2, onevent: function () {}}

		o(censor(attrs)).equals(attrs)
	})

	o("strips methods from objects with key", function() {
		var attrs = {foo: 1, bar: 2, key: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})

	o("strips methods from objects with oninit", function() {
		var attrs = {foo: 1, bar: 2, oninit: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})

	o("strips methods from objects with oncreate", function() {
		var attrs = {foo: 1, bar: 2, oncreate: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})

	o("strips methods from objects with onbeforeupdate", function() {
		var attrs = {foo: 1, bar: 2, onbeforeupdate: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})

	o("strips methods from objects with onupdate", function() {
		var attrs = {foo: 1, bar: 2, onupdate: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})

	o("strips methods from objects with onbeforeremove", function() {
		var attrs = {foo: 1, bar: 2, onbeforeremove: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})

	o("strips methods from objects with onremove", function() {
		var attrs = {foo: 1, bar: 2, onremove: "foo"}
		var censored = censor(attrs)

		o(censored).notEquals(attrs)
		o(censored).deepEquals({foo: 1, bar: 2})
	})
})
