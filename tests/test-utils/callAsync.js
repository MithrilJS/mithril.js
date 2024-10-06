import o from "ospec"

import {callAsync, clearPending, waitAsync} from "../../test-utils/callAsync.js"

o.spec("callAsync", function() {
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
	o("gets cleared", function(done) {
		callAsync(function() {
			clearTimeout(timeout)
			done(new Error("should never have been called"))
		})
		const timeout = setTimeout(done, 5)
		clearPending()
	})
})

o.spec("waitAsync", function() {
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	o("gets called before setTimeout", () => Promise.race([
		waitAsync(),
		sleep(5).then(() => { throw new Error("callAsync was called too slow") })
	]))
	o("gets cleared", () => {
		const promise = waitAsync()
		clearPending()
		return Promise.race([
			promise.then(() => { throw new Error("should never have been called") }),
			sleep(5),
		])
	})
})
