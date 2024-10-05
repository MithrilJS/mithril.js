"use strict"

var o = require("ospec")
var makeTracked = require("../../src/std/tracked")

o.spec("tracked", () => {
	/** @param {import("../tracked").Tracked<number, string>} t */
	var live = (t) => t.live().map((h) => [h.key, h.value, h.signal.aborted])

	o("initializes values correctly", () => {
		var calls = 0
		var t = makeTracked([[1, "one"], [2, "two"]], () => calls++)

		o(live(t)).deepEquals([[1, "one", false], [2, "two", false]])
		o(t.list()).deepEquals([[1, "one"], [2, "two"]])

		o(t.has(1)).equals(true)
		o(t.get(1)).equals("one")
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("two")

		o(calls).equals(0)
	})

	o("tracks values correctly", () => {
		var calls = 0
		var t = makeTracked(undefined, () => calls++)

		t.set(1, "one")
		o(calls).equals(1)
		o(live(t)).deepEquals([[1, "one", false]])
		o(t.list()).deepEquals([[1, "one"]])
		o(t.has(1)).equals(true)
		o(t.get(1)).equals("one")
		var live1 = t.live()[0]

		t.set(2, "two")
		o(calls).equals(2)
		o(live(t)).deepEquals([[1, "one", false], [2, "two", false]])
		o(t.live()[0]).equals(live1)
		o(t.list()).deepEquals([[1, "one"], [2, "two"]])
		o(t.has(1)).equals(true)
		o(t.get(1)).equals("one")
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("two")
		var live2 = t.live()[1]

		t.delete(1)
		o(calls).equals(3)
		o(live(t)).deepEquals([[1, "one", true], [2, "two", false]])
		o(t.live()[0]).equals(live1)
		o(t.live()[1]).equals(live2)
		o(t.list()).deepEquals([[2, "two"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("two")

		live1.release()
		o(calls).equals(4)
		o(live(t)).deepEquals([[2, "two", false]])
		o(t.live()[0]).equals(live2)
		o(t.list()).deepEquals([[2, "two"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("two")

		t.replace(2, "dos")
		o(calls).equals(5)
		o(live(t)).deepEquals([[2, "two", true], [2, "dos", false]])
		o(t.live()[0]).equals(live2)
		o(t.list()).deepEquals([[2, "dos"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("dos")
		var live3 = t.live()[1]

		live2.release()
		o(calls).equals(6)
		o(live(t)).deepEquals([[2, "dos", false]])
		o(t.live()[0]).equals(live3)
		o(t.list()).deepEquals([[2, "dos"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("dos")
	})

	o("invokes `onUpdate()` after the update is fully completed, including any and all signal aborts", () => {
		var live1, live2, live3
		var live1Aborted = false
		var live2Aborted = false
		var call = 0
		var t = makeTracked(undefined, () => {
			switch (++call) {
				case 1:
					o(live(t)).deepEquals([[1, "one", false]])
					o(t.list()).deepEquals([[1, "one"]])
					o(t.has(1)).equals(true)
					o(t.get(1)).equals("one")
					live1 = t.live()[0]
					break

				case 2:
					o(live(t)).deepEquals([[1, "one", false], [2, "two", false]])
					o(t.live()[0]).equals(live1)
					o(t.list()).deepEquals([[1, "one"], [2, "two"]])
					o(t.has(1)).equals(true)
					o(t.get(1)).equals("one")
					o(t.has(2)).equals(true)
					o(t.get(2)).equals("two")
					live2 = t.live()[1]
					break

				case 3:
					o(live(t)).deepEquals([[1, "one", true], [2, "two", false]])
					o(t.live()[0]).equals(live1)
					o(t.live()[1]).equals(live2)
					o(t.list()).deepEquals([[2, "two"]])
					o(t.has(1)).equals(false)
					o(t.get(1)).equals(undefined)
					o(t.has(2)).equals(true)
					o(t.get(2)).equals("two")
					break

				case 4:
					o(live(t)).deepEquals([[2, "two", false]])
					o(t.live()[0]).equals(live2)
					o(t.list()).deepEquals([[2, "two"]])
					o(t.has(1)).equals(false)
					o(t.get(1)).equals(undefined)
					o(t.has(2)).equals(true)
					o(t.get(2)).equals("two")
					break

				case 5:
					o(live(t)).deepEquals([[2, "two", true], [2, "dos", false]])
					o(t.live()[0]).equals(live2)
					o(t.list()).deepEquals([[2, "dos"]])
					o(t.has(1)).equals(false)
					o(t.get(1)).equals(undefined)
					o(t.has(2)).equals(true)
					o(t.get(2)).equals("dos")
					live3 = t.live()[1]
					break

				case 6:
					o(live(t)).deepEquals([[2, "dos", false]])
					o(t.live()[0]).equals(live3)
					o(t.list()).deepEquals([[2, "dos"]])
					o(t.has(1)).equals(false)
					o(t.get(1)).equals(undefined)
					o(t.has(2)).equals(true)
					o(t.get(2)).equals("dos")
					break

				default:
					throw new Error("Too many calls")
			}
		})

		t.set(1, "one")
		o(call).equals(1)
		o(live1Aborted).equals(false)
		o(live2Aborted).equals(false)
		var deleteOneStarted = false
		live1.signal.onabort = () => {
			live1Aborted = true
			o(call).equals(2)
			o(deleteOneStarted).equals(true)
		}

		t.set(2, "two")
		o(call).equals(2)
		o(live1Aborted).equals(false)
		o(live2Aborted).equals(false)
		var deleteTwoStarted = false
		live2.signal.onabort = () => {
			live2Aborted = true
			o(call).equals(4)
			o(deleteTwoStarted).equals(true)
		}

		deleteOneStarted = true
		t.delete(1)
		o(call).equals(3)
		o(live1Aborted).equals(true)
		o(live2Aborted).equals(false)

		live1.release()
		o(call).equals(4)
		o(live1Aborted).equals(true)
		o(live2Aborted).equals(false)

		deleteTwoStarted = true
		t.replace(2, "dos")
		o(call).equals(5)
		o(live1Aborted).equals(true)
		o(live2Aborted).equals(true)

		live2.release()
		o(call).equals(6)
		o(live1Aborted).equals(true)
		o(live2Aborted).equals(true)
	})

	o("tracks parallel removes correctly", () => {
		var calls = 0
		var t = makeTracked(undefined, () => calls++)

		t.set(1, "one")
		var live1 = t.live()[0]

		t.set(2, "two")
		var live2 = t.live()[1]

		t.delete(1)
		o(calls).equals(3)
		o(live(t)).deepEquals([[1, "one", true], [2, "two", false]])
		o(t.live()[0]).equals(live1)
		o(t.live()[1]).equals(live2)
		o(t.list()).deepEquals([[2, "two"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("two")

		t.replace(2, "dos")
		o(calls).equals(4)
		o(live(t)).deepEquals([[1, "one", true], [2, "two", true], [2, "dos", false]])
		o(t.live()[0]).equals(live1)
		o(t.live()[1]).equals(live2)
		o(t.list()).deepEquals([[2, "dos"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("dos")
		var live3 = t.live()[2]

		live1.release()
		o(calls).equals(5)
		o(live(t)).deepEquals([[2, "two", true], [2, "dos", false]])
		o(t.live()[0]).equals(live2)
		o(t.list()).deepEquals([[2, "dos"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("dos")

		live2.release()
		o(calls).equals(6)
		o(live(t)).deepEquals([[2, "dos", false]])
		o(t.live()[0]).equals(live3)
		o(t.list()).deepEquals([[2, "dos"]])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
		o(t.has(2)).equals(true)
		o(t.get(2)).equals("dos")
	})

	o("tolerates release before abort", () => {
		var calls = 0
		var t = makeTracked(undefined, () => calls++)

		t.set(1, "one")
		o(calls).equals(1)
		o(live(t)).deepEquals([[1, "one", false]])
		o(t.list()).deepEquals([[1, "one"]])
		o(t.has(1)).equals(true)
		o(t.get(1)).equals("one")
		var live1 = t.live()[0]

		live1.release()
		o(calls).equals(1)
		o(live(t)).deepEquals([[1, "one", false]])
		o(t.list()).deepEquals([[1, "one"]])
		o(t.has(1)).equals(true)
		o(t.get(1)).equals("one")

		t.delete(1)
		o(calls).equals(2)
		o(live(t)).deepEquals([])
		o(t.list()).deepEquals([])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
	})

	o("tolerates double release before abort", () => {
		var calls = 0
		var t = makeTracked(undefined, () => calls++)

		t.set(1, "one")
		var live1 = t.live()[0]

		live1.release()
		live1.release()
		o(calls).equals(1)
		o(live(t)).deepEquals([[1, "one", false]])
		o(t.list()).deepEquals([[1, "one"]])
		o(t.has(1)).equals(true)
		o(t.get(1)).equals("one")

		t.delete(1)
		o(calls).equals(2)
		o(live(t)).deepEquals([])
		o(t.list()).deepEquals([])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
	})

	o("tolerates double release spanning delete", () => {
		var calls = 0
		var t = makeTracked(undefined, () => calls++)

		t.set(1, "one")
		var live1 = t.live()[0]
		live1.release()
		t.delete(1)
		live1.release()

		o(calls).equals(2)
		o(live(t)).deepEquals([])
		o(t.list()).deepEquals([])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
	})

	o("tracks double release after delete", () => {
		var calls = 0
		var t = makeTracked(undefined, () => calls++)

		t.set(1, "one")
		var live1 = t.live()[0]
		t.delete(1)
		o(calls).equals(2)
		o(live(t)).deepEquals([[1, "one", true]])
		o(t.list()).deepEquals([])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)

		live1.release()
		o(calls).equals(3)
		o(live(t)).deepEquals([])
		o(t.list()).deepEquals([])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)

		live1.release()
		o(calls).equals(3)
		o(live(t)).deepEquals([])
		o(t.list()).deepEquals([])
		o(t.has(1)).equals(false)
		o(t.get(1)).equals(undefined)
	})
})
