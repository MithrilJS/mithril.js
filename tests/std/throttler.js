import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("throttler", () => {
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	var throttled

	o.afterEach(() => {
		if (throttled) throttled.dispose()
	})

	o("validates create input", () => {
		o(() => m.throttler(NaN)).throws(RangeError)
		o(() => m.throttler(+1/0)).throws(RangeError)
		o(() => m.throttler(-1/0)).throws(RangeError)
		o(() => m.throttler("")).throws(RangeError)
		o(() => m.throttler("123")).throws(RangeError)
		o(() => m.throttler(true)).throws(RangeError)
		o(() => m.throttler(false)).throws(RangeError)
		o(() => m.throttler(null)).throws(RangeError)
		o(() => m.throttler([])).throws(RangeError)
		o(() => m.throttler({})).throws(RangeError)
		o(() => m.throttler(Symbol("wat"))).throws(RangeError)
		m.throttler()
		m.throttler(100)
	})

	o("validates update input", () => {
		throttled = m.throttler()

		o(() => throttled.update(NaN)).throws(RangeError)
		o(() => throttled.update(+1/0)).throws(RangeError)
		o(() => throttled.update(-1/0)).throws(RangeError)
		o(() => throttled.update("")).throws(RangeError)
		o(() => throttled.update("123")).throws(RangeError)
		o(() => throttled.update(true)).throws(RangeError)
		o(() => throttled.update(false)).throws(RangeError)
		o(() => throttled.update(null)).throws(RangeError)
		o(() => throttled.update([])).throws(RangeError)
		o(() => throttled.update({})).throws(RangeError)
		o(() => throttled.update(Symbol("wat"))).throws(RangeError)
		o(() => throttled.update()).throws(RangeError)
		throttled.update(100)
	})

	o("detects edges correctly", async () => {
		o.timeout(1000)

		throttled = m.throttler(100)

		var p1 = throttled()
		var p2 = throttled()
		await sleep(10)
		var p3 = throttled()
		await sleep(140)
		var p4 = throttled()
		o(await p1).equals(undefined)
		o(await p2).equals(true)
		o(await p3).equals(false)
		o(await p4).equals(undefined)

		var p5 = throttled()
		await sleep(150)
		var p6 = throttled()
		o(await p5).equals(false)
		o(await p6).equals(undefined)
	})

	o("retains the timer on early hit", async () => {
		o.timeout(1000)

		throttled = m.throttler(100)

		var slept = false
		setTimeout(() => { slept = true }, 125)
		void throttled()
		await sleep(50)
		await throttled()
		o(slept).equals(false)
	})

	o("handles dynamic changes to higher delays", async () => {
		o.timeout(1000)

		throttled = m.throttler(100)

		var p1 = throttled()
		var p2 = throttled()
		await sleep(10)
		var p3 = throttled()
		throttled.update(200)
		await sleep(140)
		var p4 = throttled()
		o(await p1).equals(undefined)
		o(await p2).equals(true)
		o(await p3).equals(true)
		o(await p4).equals(false)

		var p5 = throttled()
		await sleep(250)
		var p6 = throttled()
		o(await p5).equals(undefined)
		o(await p6).equals(undefined)
	})

	o("handles dynamic changes to lower delays", async () => {
		o.timeout(1000)

		throttled = m.throttler(100)

		var p1 = throttled()
		var p2 = throttled()
		await sleep(10)
		var p3 = throttled()
		throttled.update(50)
		await sleep(100)
		var p4 = throttled()
		o(await p1).equals(undefined)
		o(await p2).equals(true)
		o(await p3).equals(false)
		o(await p4).equals(undefined)

		var p5 = throttled()
		await sleep(100)
		var p6 = throttled()
		o(await p5).equals(false)
		o(await p6).equals(undefined)
	})

	o("handles same-duration changes", async () => {
		o.timeout(1000)

		throttled = m.throttler(100)

		var p1 = throttled()
		throttled.update(100)
		var p2 = throttled()
		throttled.update(100)
		await sleep(10)
		throttled.update(100)
		var p3 = throttled()
		throttled.update(100)
		await sleep(140)
		throttled.update(100)
		var p4 = throttled()
		throttled.update(100)
		o(await p1).equals(undefined)
		throttled.update(100)
		o(await p2).equals(true)
		throttled.update(100)
		o(await p3).equals(false)
		throttled.update(100)
		o(await p4).equals(undefined)
		throttled.update(100)

		var p5 = throttled()
		throttled.update(100)
		await sleep(150)
		throttled.update(100)
		var p6 = throttled()
		throttled.update(100)
		o(await p5).equals(false)
		throttled.update(100)
		o(await p6).equals(undefined)
	})
})
