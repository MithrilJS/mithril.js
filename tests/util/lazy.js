import o from "ospec"

import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("lazy", () => {
	var G = setupGlobals({expectNoConsoleError: true})

	void [{name: "direct", wrap: (v) => v}, {name: "in module with default", wrap: (v) => ({default:v})}].forEach(({name, wrap}) => {
		o.spec(name, () => {
			o("works with only fetch and success", async () => {
				var calls = []
				var scheduled = 1
				var component = wrap(({name}) => {
					calls.push(`view ${name}`)
					return m("div", {id: "a"}, "b")
				})
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((resolve) => send = resolve)
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
				])

				send(component)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"scheduled 1",
					"view one",
					"view two",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"scheduled 1",
					"view one",
					"view two",
					"view one",
					"view two",
				])
			})

			o("works with only fetch and failure", async () => {
				var error = new Error("test")
				var calls = []
				console.error = (e) => {
					calls.push("console.error", e.message)
				}
				var scheduled = 1
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((_, reject) => send = reject)
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
				])

				send(error)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"console.error", "test",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"console.error", "test",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"console.error", "test",
					"scheduled 1",
				])
			})

			o("works with fetch + pending and success", async () => {
				var calls = []
				var scheduled = 1
				var component = wrap(({name}) => {
					calls.push(`view ${name}`)
					return m("div", {id: "a"}, "b")
				})
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((resolve) => send = resolve)
					},
					pending() {
						calls.push("pending")
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
				])

				send(component)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"scheduled 1",
					"view one",
					"view two",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"scheduled 1",
					"view one",
					"view two",
					"view one",
					"view two",
				])
			})

			o("works with fetch + pending and failure", async () => {
				var error = new Error("test")
				var calls = []
				console.error = (e) => {
					calls.push("console.error", e.message)
				}
				var scheduled = 1
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((_, reject) => send = reject)
					},
					pending() {
						calls.push("pending")
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
				])

				send(error)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"console.error", "test",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"console.error", "test",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"console.error", "test",
					"scheduled 1",
				])
			})

			o("works with fetch + error and success", async () => {
				var calls = []
				var scheduled = 1
				var component = wrap(({name}) => {
					calls.push(`view ${name}`)
					return m("div", {id: "a"}, "b")
				})
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((resolve) => send = resolve)
					},
					error() {
						calls.push("error")
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
				])

				send(component)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"scheduled 1",
					"view one",
					"view two",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"scheduled 1",
					"view one",
					"view two",
					"view one",
					"view two",
				])
			})

			o("works with fetch + error and failure", async () => {
				var error = new Error("test")
				var calls = []
				console.error = (e) => {
					calls.push("console.error", e.message)
				}
				var scheduled = 1
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((_, reject) => send = reject)
					},
					error(e) {
						calls.push("error", e.message)
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
				])

				send(error)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"console.error", "test",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"console.error", "test",
					"scheduled 1",
					"error", "test",
					"error", "test",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"console.error", "test",
					"scheduled 1",
					"error", "test",
					"error", "test",
					"error", "test",
					"error", "test",
				])
			})

			o("works with all hooks and success", async() => {
				var calls = []
				var scheduled = 1
				var component = wrap(({name}) => {
					calls.push(`view ${name}`)
					return m("div", {id: "a"}, "b")
				})
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((resolve) => send = resolve)
					},
					pending() {
						calls.push("pending")
					},
					error() {
						calls.push("error")
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
				])

				send(component)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"scheduled 1",
					"view one",
					"view two",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"scheduled 1",
					"view one",
					"view two",
					"view one",
					"view two",
				])
			})

			o("works with all hooks and failure", async () => {
				var error = new Error("test")
				var calls = []
				console.error = (e) => {
					calls.push("console.error", e.message)
				}
				var scheduled = 1
				var send, notifyRedrawn
				var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
				var redraw = () => {
					notifyRedrawn()
					calls.push(`scheduled ${scheduled++}`)
				}
				var C = m.lazy({
					fetch() {
						calls.push("fetch")
						return new Promise((_, reject) => send = reject)
					},
					pending() {
						calls.push("pending")
					},
					error(e) {
						calls.push("error", e.message)
					},
				})

				o(calls).deepEquals([])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
				])

				send(error)

				await fetchRedrawn

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"console.error", "test",
					"scheduled 1",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"console.error", "test",
					"scheduled 1",
					"error", "test",
					"error", "test",
				])

				m.render(G.root, [
					m(C, {name: "one"}),
					m(C, {name: "two"}),
				], redraw)

				o(calls).deepEquals([
					"fetch",
					"pending",
					"pending",
					"console.error", "test",
					"scheduled 1",
					"error", "test",
					"error", "test",
					"error", "test",
					"error", "test",
				])
			})
		})
	})
})
