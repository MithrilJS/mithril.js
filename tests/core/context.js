import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("context", () => {
	var G = setupGlobals()

	function symbolsToStrings(object) {
		var result = {}
		for (const key of Reflect.ownKeys(object)) {
			// Intentionally using `String(key)` to stringify symbols from `Symbol("foo")` to
			// `"Symbol(foo)"` for deep equality.
			Object.defineProperty(result, String(key), Object.getOwnPropertyDescriptor(object, key))
		}
		return result
	}

	function allKeys(context) {
		if (context === null || typeof context !== "object") return undefined
		const chain = []
		while (context !== null && context !== Object.prototype) {
			chain.push(context)
			context = Object.getPrototypeOf(context)
		}
		return symbolsToStrings(chain.reduceRight((a, b) => Object.assign(a, b), {}))
	}

	o("string keys are set in context", () => {
		var redraw = () => {}
		var Comp = o.spy()
		var vnode = m.set({key: "value", one: "two"}, m(Comp))

		m.render(G.root, vnode, redraw)

		o(Comp.callCount).equals(1)
		o(allKeys(Comp.args[2])).deepEquals({
			redraw,
			key: "value",
			one: "two",
		})

		var vnode = m.set({key: "updated", two: "three"}, m(Comp))

		m.render(G.root, vnode, redraw)

		o(Comp.callCount).equals(2)
		o(allKeys(Comp.args[2])).deepEquals({
			redraw,
			key: "updated",
			two: "three",
		})

		m.render(G.root, null)
	})

	o("symbol keys are set in context", () => {
		var key = Symbol("key")
		var one = Symbol("one")
		var two = Symbol("two")

		var redraw = () => {}
		var Comp = o.spy()
		var vnode = m.set({[key]: "value", [one]: "two"}, m(Comp))

		m.render(G.root, vnode, redraw)

		o(Comp.callCount).equals(1)
		o(allKeys(Comp.args[2])).deepEquals(symbolsToStrings({
			redraw,
			[key]: "value",
			[one]: "two",
		}))

		var vnode = m.set({[key]: "updated", [two]: "three"}, m(Comp))

		m.render(G.root, vnode, redraw)

		o(Comp.callCount).equals(2)
		o(allKeys(Comp.args[2])).deepEquals(symbolsToStrings({
			redraw,
			[key]: "updated",
			[two]: "three",
		}))

		m.render(G.root, null)
	})

	o("mixed keys are set in context", () => {
		var key = Symbol("key")

		var redraw = () => {}
		var Comp = o.spy()
		var vnode = m.set({[key]: "value", one: "two"}, m(Comp))

		m.render(G.root, vnode, redraw)

		o(Comp.callCount).equals(1)
		o(allKeys(Comp.args[2])).deepEquals(symbolsToStrings({
			redraw,
			[key]: "value",
			one: "two",
		}))

		var vnode = m.set({[key]: "updated", two: "three"}, m(Comp))

		m.render(G.root, vnode, redraw)

		o(Comp.callCount).equals(2)
		o(allKeys(Comp.args[2])).deepEquals(symbolsToStrings({
			redraw,
			[key]: "updated",
			two: "three",
		}))

		m.render(G.root, null)
	})
})
