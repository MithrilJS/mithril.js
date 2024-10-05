import o from "ospec"

import callAsync from "../../test-utils/callAsync.js"

o.spec("callAsync", function() {
	o("works", function(done) {
		var count = 0
		callAsync(function() {
			o(count).equals(1)
			done()
		})
		count++
	})
	o("gets called before setTimeout", function(done) {
		var timeout
		callAsync(function() {
			clearTimeout(timeout)
			done()
		})
		timeout = setTimeout(function() {
			throw new Error("callAsync was called too slow")
		}, 5)
	})
})
