"use strict"

var o = require("ospec")
var withProgress = require("../with-progress")

if (typeof ReadableStream === "function") {
	o.spec("withProgress", () => {
		function sequence(chunks) {
			let i = 0
			return new ReadableStream({
				type: "bytes",
				pull(ctrl) {
					if (i === chunks.length) {
						ctrl.close()
					} else {
						ctrl.enqueue(Uint8Array.from(chunks[i++]))
					}
				},
			})
		}

		function drain(stream) {
			return new Response(stream).arrayBuffer().then((buf) => [...new Uint8Array(buf)])
		}

		o("handles null body", () => {
			var reports = []
			var watched = withProgress(null, (current) => reports.push(current))

			return drain(watched).then((result) => {
				o(result).deepEquals([])
				o(reports).deepEquals([])
			})
		})

		o("handles empty body", () => {
			var reports = []
			var watched = withProgress(sequence([]), (current) => reports.push(current))

			return drain(watched).then((result) => {
				o(result).deepEquals([])
				o(reports).deepEquals([])
			})
		})

		o("adds single non-empty chunk", () => {
			var reports = []
			var watched = withProgress(sequence([[10]]), (current) => reports.push(current))

			return drain(watched).then((result) => {
				o(result).deepEquals([10])
				o(reports).deepEquals([1])
			})
		})

		o("adds multiple non-empty chunks", () => {
			var reports = []
			var watched = withProgress(sequence([[10], [20]]), (current) => reports.push(current))

			return drain(watched).then((result) => {
				o(result).deepEquals([10, 20])
				o(reports).deepEquals([1, 2])
			})
		})
	})
} else {
	console.log("Skipping `withProgress` as `ReadableStream` is missing.")
}
