import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("debouncer", () => {
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	var debounced

	o.afterEach(() => {
		if (debounced) debounced.dispose()
	})

	o("validates create input", () => {
		o(() => m.debouncer(NaN)).throws(RangeError)
		o(() => m.debouncer(+1/0)).throws(RangeError)
		o(() => m.debouncer(-1/0)).throws(RangeError)
		o(() => m.debouncer("")).throws(RangeError)
		o(() => m.debouncer("123")).throws(RangeError)
		o(() => m.debouncer(true)).throws(RangeError)
		o(() => m.debouncer(false)).throws(RangeError)
		o(() => m.debouncer(null)).throws(RangeError)
		o(() => m.debouncer([])).throws(RangeError)
		o(() => m.debouncer({})).throws(RangeError)
		o(() => m.debouncer(Symbol("wat"))).throws(RangeError)
		m.debouncer()
		m.debouncer(100)
	})

	o("validates update input", () => {
		debounced = m.debouncer()

		o(() => debounced.update(NaN)).throws(RangeError)
		o(() => debounced.update(+1/0)).throws(RangeError)
		o(() => debounced.update(-1/0)).throws(RangeError)
		o(() => debounced.update("")).throws(RangeError)
		o(() => debounced.update("123")).throws(RangeError)
		o(() => debounced.update(true)).throws(RangeError)
		o(() => debounced.update(false)).throws(RangeError)
		o(() => debounced.update(null)).throws(RangeError)
		o(() => debounced.update([])).throws(RangeError)
		o(() => debounced.update({})).throws(RangeError)
		o(() => debounced.update(Symbol("wat"))).throws(RangeError)
		o(() => debounced.update()).throws(RangeError)
		debounced.update(100)
	})

	o("detects edges correctly", async () => {
		o.timeout(1000)

		debounced = m.debouncer(100)

		var p1 = debounced()
		var p2 = debounced()
		await sleep(10)
		var p3 = debounced()
		await sleep(140)
		var p4 = debounced()
		o(await p1).equals(undefined)
		o(await p2).equals(true)
		o(await p3).equals(false)
		o(await p4).equals(undefined)

		var p5 = debounced()
		await sleep(150)
		var p6 = debounced()
		o(await p5).equals(false)
		o(await p6).equals(undefined)
	})

	o("resets the timer on early hit", async () => {
		o.timeout(1000)

		debounced = m.debouncer(100)

		var slept = false
		setTimeout(() => { slept = true }, 125)
		void debounced()
		await sleep(50)
		await debounced()
		o(slept).equals(true)
	})

	o("handles dynamic changes to higher delays", async () => {
		o.timeout(1000)

		debounced = m.debouncer(100)

		var p1 = debounced()
		var p2 = debounced()
		await sleep(10)
		var p3 = debounced()
		debounced.update(200)
		await sleep(140)
		var p4 = debounced()
		o(await p1).equals(undefined)
		o(await p2).equals(true)
		o(await p3).equals(true)
		o(await p4).equals(false)

		var p5 = debounced()
		await sleep(250)
		var p6 = debounced()
		o(await p5).equals(undefined)
		o(await p6).equals(undefined)
	})

	o("handles dynamic changes to lower delays", async () => {
		o.timeout(1000)

		debounced = m.debouncer(100)

		var p1 = debounced()
		var p2 = debounced()
		await sleep(10)
		var p3 = debounced()
		debounced.update(50)
		await sleep(100)
		var p4 = debounced()
		o(await p1).equals(undefined)
		o(await p2).equals(true)
		o(await p3).equals(false)
		o(await p4).equals(undefined)

		var p5 = debounced()
		await sleep(100)
		var p6 = debounced()
		o(await p5).equals(false)
		o(await p6).equals(undefined)
	})

	o("handles same-duration changes", async () => {
		o.timeout(1000)

		debounced = m.debouncer(100)

		var p1 = debounced()
		debounced.update(100)
		var p2 = debounced()
		debounced.update(100)
		await sleep(10)
		debounced.update(100)
		var p3 = debounced()
		debounced.update(100)
		await sleep(140)
		debounced.update(100)
		var p4 = debounced()
		debounced.update(100)
		o(await p1).equals(undefined)
		debounced.update(100)
		o(await p2).equals(true)
		debounced.update(100)
		o(await p3).equals(false)
		debounced.update(100)
		o(await p4).equals(undefined)
		debounced.update(100)

		var p5 = debounced()
		debounced.update(100)
		await sleep(150)
		debounced.update(100)
		var p6 = debounced()
		debounced.update(100)
		o(await p5).equals(false)
		debounced.update(100)
		o(await p6).equals(undefined)
	})
})
