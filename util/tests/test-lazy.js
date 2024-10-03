"use strict"

var o = require("ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var hyperscript = require("../../render/hyperscript")
var makeLazy = require("../lazy")
var render = require("../../render/render")

o.spec("lazy", () => {
	var consoleError = console.error
	var $window, root
	o.beforeEach(() => {
		$window = domMock()
		root = $window.document.createElement("div")
	})
	o.afterEach(() => {
		console.error = consoleError
	})

	components.forEach((cmp) => {
		o.spec(cmp.kind, () => {

			void [{name: "direct", wrap: (v) => v}, {name: "in module with default", wrap: (v) => ({default:v})}].forEach(({name, wrap}) => {
				var createComponent = (methods) => wrap(cmp.create(methods))
				o.spec(name, () => {
					o("works with only fetch and success", () => {
						var calls = []
						var scheduled = 1
						var component = createComponent({
							view(vnode) {
								calls.push(`view ${vnode.attrs.name}`)
								return hyperscript("div", {id: "a"}, "b")
							}
						})
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
							fetch() {
								calls.push("fetch")
								return new Promise((resolve) => send = resolve)
							},
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
						])

						send(component)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
								"view one",
								"view two",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
								"view one",
								"view two",
								"view one",
								"view two",
							])
						})
					})

					o("works with only fetch and failure", () => {
						var error = new Error("test")
						var calls = []
						console.error = (e) => {
							calls.push("error", e.message)
						}
						var scheduled = 1
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
							fetch() {
								calls.push("fetch")
								return new Promise((_, reject) => send = reject)
							},
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
						])

						send(error)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"error", "test",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"error", "test",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"error", "test",
								"scheduled 1",
							])
						})
					})

					o("works with fetch + pending and success", () => {
						var calls = []
						var scheduled = 1
						var component = createComponent({
							view(vnode) {
								calls.push(`view ${vnode.attrs.name}`)
								return hyperscript("div", {id: "a"}, "b")
							}
						})
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
							fetch() {
								calls.push("fetch")
								return new Promise((resolve) => send = resolve)
							},
							pending() {
								calls.push("pending")
							},
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
							"pending",
							"pending",
						])

						send(component)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"scheduled 1",
								"view one",
								"view two",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

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
					})

					o("works with fetch + pending and failure", () => {
						var error = new Error("test")
						var calls = []
						console.error = (e) => {
							calls.push("error", e.message)
						}
						var scheduled = 1
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
							fetch() {
								calls.push("fetch")
								return new Promise((_, reject) => send = reject)
							},
							pending() {
								calls.push("pending")
							},
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
							"pending",
							"pending",
						])

						send(error)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"error", "test",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"error", "test",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"error", "test",
								"scheduled 1",
							])
						})
					})

					o("works with fetch + error and success", () => {
						var calls = []
						var scheduled = 1
						var component = createComponent({
							view(vnode) {
								calls.push(`view ${vnode.attrs.name}`)
								return hyperscript("div", {id: "a"}, "b")
							}
						})
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
							fetch() {
								calls.push("fetch")
								return new Promise((resolve) => send = resolve)
							},
							error() {
								calls.push("error")
							},
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
						])

						send(component)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
								"view one",
								"view two",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
								"view one",
								"view two",
								"view one",
								"view two",
							])
						})
					})

					o("works with fetch + error and failure", () => {
						var error = new Error("test")
						var calls = []
						var scheduled = 1
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
							fetch() {
								calls.push("fetch")
								return new Promise((_, reject) => send = reject)
							},
							error(e) {
								calls.push("error", e.message)
							},
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
						])

						send(error)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
								"error", "test",
								"error", "test",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"scheduled 1",
								"error", "test",
								"error", "test",
								"error", "test",
								"error", "test",
							])
						})
					})

					o("works with all hooks and success", () => {
						var calls = []
						var scheduled = 1
						var component = createComponent({
							view(vnode) {
								calls.push(`view ${vnode.attrs.name}`)
								return hyperscript("div", {id: "a"}, "b")
							}
						})
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
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
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
							"pending",
							"pending",
						])

						send(component)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"scheduled 1",
								"view one",
								"view two",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

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
					})

					o("works with all hooks and failure", () => {
						var error = new Error("test")
						var calls = []
						var scheduled = 1
						var send, notifyRedrawn
						var fetchRedrawn = new Promise((resolve) => notifyRedrawn = resolve)
						var C = makeLazy({
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
						}, () => {
							notifyRedrawn()
							calls.push(`scheduled ${scheduled++}`)
						})

						o(calls).deepEquals([])

						render(root, [
							hyperscript(C, {name: "one"}),
							hyperscript(C, {name: "two"}),
						])

						o(calls).deepEquals([
							"fetch",
							"pending",
							"pending",
						])

						send(error)

						return fetchRedrawn.then(() => {
							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"scheduled 1",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
								"scheduled 1",
								"error", "test",
								"error", "test",
							])

							render(root, [
								hyperscript(C, {name: "one"}),
								hyperscript(C, {name: "two"}),
							])

							o(calls).deepEquals([
								"fetch",
								"pending",
								"pending",
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
		})
	})
})
