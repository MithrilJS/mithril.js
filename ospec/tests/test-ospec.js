"use strict"

var callAsync = require("../../test-utils/callAsync")
var o = require("../ospec")

new function(o) {
	o = o.new()

	o.spec("ospec", function() {
		o("skipped", function() {
			o(1).equals(1)
		})
		o.only(".only()", function() {
			o(2).equals(2)
		})
	})

	o.run()
}(o)

o.spec("ospec", function() {
	o.spec("sync", function() {
		var a = 0, b = 0

		o.before(function() {a = 1})
		o.after(function() {a = 0})

		o.beforeEach(function() {b = 1})
		o.afterEach(function() {b = 0})

		o("assertions", function() {
			var spy = o.spy()
			spy(a)

			o(a).equals(b)
			o(a).notEquals(2)
			o({a: [1, 2], b: 3}).deepEquals({a: [1, 2], b: 3})
			o([{a: 1, b: 2}, {c: 3}]).deepEquals([{a: 1, b: 2}, {c: 3}])

			var values = ["a", "", 1, 0, true, false, null, undefined, Date(0), ["a"], [], function() {return arguments}.call(), new Uint8Array(), {a: 1}, {}]
			for (var i = 0; i < values.length; i++) {
				for (var j = 0; j < values.length; j++) {
					if (i === j) o(values[i]).deepEquals(values[j])
					else o(values[i]).notDeepEquals(values[j])
				}
			}

			o(spy.callCount).equals(1)
			o(spy.args.length).equals(1)
			o(spy.args[0]).equals(1)
		})
	})
	o.spec("async", function() {
		var a = 0, b = 0

		o.before(function(done) {
			callAsync(function() {
				a = 1
				done()
			})
		})
		o.after(function(done) {
			callAsync(function() {
				a = 0
				done()
			})
		})

		o.beforeEach(function(done) {
			callAsync(function() {
				b = 1
				done()
			})
		})
		o.afterEach(function(done) {
			callAsync(function() {
				b = 0
				done()
			})
		})

		o("async hooks", function(done) {
			callAsync(function() {
				var spy = o.spy()
				spy(a)

				o(a).equals(b)
				o(a).equals(1)("a and b should be initialized")

				done()
			})
		})
	})
})
