/* global FormData */

// This alone amounts to over 200k assertions total, but that's because it almost fully
// exhaustively tests the function. (Turns out it's not all that hard.) The function's pretty
// simple, so it doesn't take as long as you'd think.

import o from "ospec"

import m from "../../src/entry/mithril.esm.js"
import {setupGlobals} from "../../test-utils/global.js"

o.spec("fetch", () => {
	let global, oldFetch
	setupGlobals({
		initialize(g) {
			global = g
			oldFetch = g.fetch
		},
		cleanup(g) {
			global = null
			g.fetch = oldFetch
		},
	})

	const methods = [
		"HEAD",
		"GET",
		"PATCH",
		"POST",
		"PUT",
		"DELETE",
	]

	const okStatuses = {
		200: "OK",
		201: "Created",
		202: "Accepted",
		203: "Non-authoritative Information",
		206: "Partial Content",
		207: "Multi-Status",
		208: "Already Reported",
		226: "IM Used",
	}

	const emptyStatuses = {
		204: "No Content",
		205: "Reset Content",
	}

	const emptyErrorStatuses = {
		// 1xx statuses aren't supported: https://github.com/whatwg/fetch/issues/1759
		// It's likely that in the future, 101 may be supported, but not 103.
		// 101: "Switching Protocols",
		// 103: "Early Hints",
		304: "Not Modified",
	}

	const errorStatuses = {
		// 1xx statuses aren't supported: https://github.com/whatwg/fetch/issues/1759
		// 100: "Continue",
		// 102: "Processing",
		300: "Multiple Choices",
		301: "Moved Permanently",
		302: "Found",
		303: "See Other",
		305: "Use Proxy",
		307: "Temporary Redirect",
		308: "Permanent Redirect",
		400: "Bad Request",
		401: "Unauthorized",
		402: "Payment Required",
		403: "Forbidden",
		404: "Not Found",
		405: "Method Not Allowed",
		406: "Not Acceptable",
		407: "Proxy Authentication Required",
		408: "Request Timeout",
		409: "Conflict",
		410: "Gone",
		411: "Length Required",
		412: "Precondition Failed",
		413: "Payload Too Large",
		414: "Request-URI Too Long",
		415: "Unsupported Media Type",
		416: "Requested Range Not Satisfiable",
		417: "Expectation Failed",
		418: "I'm a teapot",
		421: "Misdirected Request",
		422: "Unprocessable Entity",
		423: "Locked",
		424: "Failed Dependency",
		425: "Too Early",
		426: "Upgrade Required",
		428: "Precondition Required",
		429: "Too Many Requests",
		431: "Request Header Fields Too Large",
		444: "Connection Closed Without Response",
		451: "Unavailable For Legal Reasons",
		499: "Client Closed Request",
		500: "Internal Server Error",
		501: "Not Implemented",
		502: "Bad Gateway",
		503: "Service Unavailable",
		504: "Gateway Timeout",
		505: "HTTP Version Not Supported",
		506: "Variant Also Negotiates",
		507: "Insufficient Storage",
		508: "Loop Detected",
		510: "Not Extended",
		511: "Network Authentication Required",
		599: "Network Connect Timeout Error",
	}

	const allStatuses = {...okStatuses, ...emptyStatuses, ...emptyErrorStatuses, ...errorStatuses}

	const allResponseTypes = ["json", "formdata", "arraybuffer", "blob", "text", "document"]

	/**
	 * @param {object} options
	 * @param {number} options.status
	 * @param {string} [options.contentType]
	 * @param {boolean} [options.contentLength]
	 * @param {null | Array<string | number[]>} options.body
	 */
	const setupFetch = ({status, headers = {}, contentLength, body}) => {
		global.fetch = o.spy(() => {
			const encoder = new TextEncoder()
			const chunks = body == null ? null : body.map((chunk) => (
				typeof chunk === "string" ? encoder.encode(chunk) : Uint8Array.from(chunk)
			))
			if (contentLength) headers["content-length"] = chunks == null ? 0 : chunks.reduce((s, c) => s + c.length, 0)
			let i = 0
			return new Response(body == null ? null : new ReadableStream({
				type: "bytes",
				pull(ctrl) {
					if (i === chunks.length) {
						ctrl.close()
					} else {
						ctrl.enqueue(Uint8Array.from(chunks[i++]))
					}
				},
			}), {status, statusText: allStatuses[status], headers})
		})
	}

	const bufferToArray = (v) => [...new Uint8Array(v)]

	for (const method of methods) {
		for (const status of Object.keys(okStatuses)) {
			o.spec(`method ${method}, status ${status}`, () => {
				o.spec("arraybuffer, no content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), body: null})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), body: []})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), body: [[10]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), body: [[10], [20]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10, 20])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: []})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: [[10]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10])
						o(reports).deepEquals([[1, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: [[10], [20]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10, 20])
						o(reports).deepEquals([[1, -1], [2, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("arraybuffer, has content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10, 20])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10])
						o(reports).deepEquals([[1, 1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([10, 20])
						o(reports).deepEquals([[1, 2], [2, 2]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("text, no content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), body: null})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), body: []})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), body: [[10]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("\x0A")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), body: [[10], [20]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("\x0A\x14")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: []})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: [[10]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("\x0A")
						o(reports).deepEquals([[1, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: [[10], [20]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("\x0A\x14")
						o(reports).deepEquals([[1, -1], [2, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("text, has content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("\x0A")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("\x0A\x14")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("\x0A")
						o(reports).deepEquals([[1, 1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("\x0A\x14")
						o(reports).deepEquals([[1, 2], [2, 2]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("blob, no content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), body: null})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), body: []})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), body: [[10]]})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("\x0A")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), body: [[10], [20]]})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("\x0A\x14")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: []})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: [[10]]})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("\x0A")
						o(reports).deepEquals([[1, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: [[10], [20]]})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("\x0A\x14")
						o(reports).deepEquals([[1, -1], [2, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("blob, has content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10]]})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("\x0A")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("\x0A\x14")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10]]})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("\x0A")
						o(reports).deepEquals([[1, 1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("\x0A\x14")
						o(reports).deepEquals([[1, 2], [2, 2]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("json, no content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), body: null})

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), body: []})

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), body: ["123"]})

						const result = await m.fetch("/url", {
							method,
							responseType: "json",
						})

						o(result).equals(123)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), body: ["123", "456"]})

						const result = await m.fetch("/url", {
							method,
							responseType: "json",
						})

						o(result).equals(123456)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: []})

						const reports = []

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: ["123"]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "json",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals(123)
						o(reports).deepEquals([[3, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: ["123", "456"]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "json",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals(123456)
						o(reports).deepEquals([[3, -1], [6, -1]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("json, has content length", () => {
					o("null body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk", async () => {
						setupFetch({status: Number(status), contentLength: true, body: ["123"]})

						const result = await m.fetch("/url", {
							method,
							responseType: "json",
						})

						o(result).equals(123)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks", async () => {
						setupFetch({status: Number(status), contentLength: true, body: ["123", "456"]})

						const result = await m.fetch("/url", {
							method,
							responseType: "json",
						})

						o(result).equals(123456)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("null body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: null})

						const reports = []

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("empty body + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: []})

						const reports = []

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("single non-empty chunk + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: ["123"]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "json",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals(123)
						o(reports).deepEquals([[3, 3]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("two non-empty chunks + `onprogress` listener", async () => {
						setupFetch({status: Number(status), contentLength: true, body: ["123", "456"]})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "json",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals(123456)
						o(reports).deepEquals([[3, 6], [6, 6]])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				if (typeof FormData === "function") {
					o.spec("form data", () => {
						o("works", async () => {
							setupFetch({
								status: Number(status),
								headers: {
									"content-type": "multipart/form-data; boundary=123456",
								},
								contentLength: true,
								body: [
									"--123456\r\n",
									"Content-Disposition: form-data; name=\"test\"\r\n",
									"\r\n",
									"value\r\n",
									"--123456--\r\n",
								],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o([...result]).deepEquals([
								["test", "value"],
							])
							o(reports).deepEquals([
								[10, 76],
								[55, 76],
								[57, 76],
								[64, 76],
								[76, 76],
							])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})
					})
				}

				if (typeof DOMParser === "function") {
					o.spec("document", () => {
						o("works without content type", async () => {
							setupFetch({
								status: Number(status),
								body: ["<!doctype html><div id=foo></div>"],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o(result.getElementById("foo")).notEquals(null)
							o(reports).deepEquals([[33, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("works with content type text/html", async () => {
							setupFetch({
								status: Number(status),
								headers: {
									"content-type": "text/html",
								},
								body: ["<!doctype html><div id=foo></div>"],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o(result.getElementById("foo")).notEquals(null)
							o(reports).deepEquals([[33, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("works with content type application/xhtml+xml", async () => {
							setupFetch({
								status: Number(status),
								headers: {
									"content-type": "application/xhtml+xml",
								},
								body: ['<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>test</title></head><body><div id="foo" /></body></html>'],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o(result.getElementById("foo")).notEquals(null)
							o(reports).deepEquals([[33, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("works with content type application/xml", async () => {
							setupFetch({
								status: Number(status),
								headers: {
									"content-type": "application/xml",
								},
								body: ['<html xmlns="http://www.w3.org/1999/xhtml"><head><title>test</title></head><body><div id="foo" /></body></html>'],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o(result.getElementById("foo")).notEquals(null)
							o(reports).deepEquals([[33, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("works with content type text/xml", async () => {
							setupFetch({
								status: Number(status),
								headers: {
									"content-type": "text/xml",
								},
								body: ['<html><head><title>test</title></head><body><div id="foo" /></body></html>'],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o(result.getElementById("foo")).notEquals(null)
							o(reports).deepEquals([[33, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("works with content type image/svg+xml", async () => {
							setupFetch({
								status: Number(status),
								headers: {
									"content-type": "image/svg+xml",
								},
								body: ['<svg><g id="foo" /></svg>'],
							})

							const reports = []
							const result = await m.fetch("/url", {
								method,
								responseType: "formdata",
								onprogress: (current, total) => reports.push([current, total]),
							})

							o(result.getElementById("foo")).notEquals(null)
							o(reports).deepEquals([[33, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})
					})
				}

				o.spec("custom extract", () => {
					o("works", async () => {
						setupFetch({
							status: Number(status),
							body: ["123"],
						})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							onprogress: (current, total) => reports.push([current, total]),
							extract: async (response) => `${await response.text()}456`,
						})

						o(result).equals("123456")
						o(reports).deepEquals([
							[3, -1],
						])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})
			})
		}

		for (const status of Object.keys(emptyStatuses)) {
			o.spec(`method ${method}, status ${status}`, () => {
				o.spec("arraybuffer", () => {
					o("no `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("with `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "arraybuffer",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result instanceof ArrayBuffer).equals(true)
						o(bufferToArray(result)).deepEquals([])
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("text", () => {
					o("no `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const result = await m.fetch("/url", {
							method,
							responseType: "text",
						})

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("with `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							responseType: "text",
							onprogress: (current, total) => reports.push([current, total]),
						})

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("blob", () => {
					o("no `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
						})
						const result = await blob.text()

						o(result).equals("")
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("with `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []
						const blob = await m.fetch("/url", {
							method,
							responseType: "blob",
							onprogress: (current, total) => reports.push([current, total]),
						})
						const result = await blob.text()

						o(result).equals("")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("json", () => {
					o("no `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})

					o("with `onprogress` listener", async () => {
						setupFetch({status: Number(status), body: null})

						const reports = []

						let error
						try {
							await m.fetch("/url", {
								method,
								responseType: "json",
							})
						} catch (e) {
							error = e
						}

						o(error).notEquals(undefined)
						o(error.cause).notEquals(undefined)
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})

				o.spec("custom extract", () => {
					o("works", async () => {
						setupFetch({
							status: Number(status),
							body: null,
						})

						const reports = []
						const result = await m.fetch("/url", {
							method,
							onprogress: (current, total) => reports.push([current, total]),
							extract: async (response) => `${await response.text()}456`,
						})

						o(result).equals("456")
						o(reports).deepEquals([])
						o(global.fetch.callCount).equals(1)
						o(global.fetch.args[0]).equals("/url")
						o(global.fetch.args[1].method).equals(method)
					})
				})
			})
		}

		for (const status of Object.keys(emptyErrorStatuses)) {
			o.spec(`method ${method}, status ${status}`, () => {
				for (const responseType of allResponseTypes) {
					o.spec(responseType, () => {
						o("no `onprogress` listener", async () => {
							setupFetch({status: Number(status), body: null})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(emptyErrorStatuses[status])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("with `onprogress` listener", async () => {
							setupFetch({status: Number(status), body: null})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(emptyErrorStatuses[status])
							o(reports).deepEquals([])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})
					})
				}
			})
		}

		for (const status of Object.keys(errorStatuses)) {
			o.spec(`method ${method}, status ${status}`, () => {
				for (const responseType of allResponseTypes) {
					o.spec(`${responseType}, no content length`, () => {
						o("null body", async () => {
							setupFetch({status: Number(status), body: null})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("empty body", async () => {
							setupFetch({status: Number(status), body: []})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("single non-empty chunk", async () => {
							setupFetch({status: Number(status), body: [[10]]})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A")
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("two non-empty chunks", async () => {
							setupFetch({status: Number(status), body: [[10], [20]]})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A\x14")
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("null body + `onprogress` listener", async () => {
							setupFetch({status: Number(status), body: null})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(reports).deepEquals([])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("empty body + `onprogress` listener", async () => {
							setupFetch({status: Number(status), body: []})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(reports).deepEquals([])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("single non-empty chunk + `onprogress` listener", async () => {
							setupFetch({status: Number(status), body: [[10]]})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A")
							o(reports).deepEquals([[1, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("two non-empty chunks + `onprogress` listener", async () => {
							setupFetch({status: Number(status), body: [[10], [20]]})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A\x14")
							o(reports).deepEquals([[1, -1], [2, -1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})
					})

					o.spec(`${responseType}, has content length`, () => {
						o("null body", async () => {
							setupFetch({status: Number(status), contentLength: true, body: null})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("empty body", async () => {
							setupFetch({status: Number(status), contentLength: true, body: []})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("single non-empty chunk", async () => {
							setupFetch({status: Number(status), contentLength: true, body: [[10]]})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A")
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("two non-empty chunks", async () => {
							setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A\x14")
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("null body + `onprogress` listener", async () => {
							setupFetch({status: Number(status), contentLength: true, body: null})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(reports).deepEquals([])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("empty body + `onprogress` listener", async () => {
							setupFetch({status: Number(status), contentLength: true, body: []})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals(errorStatuses[status])
							o(reports).deepEquals([])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("single non-empty chunk + `onprogress` listener", async () => {
							setupFetch({status: Number(status), contentLength: true, body: [[10]]})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A")
							o(reports).deepEquals([[1, 1]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})

						o("two non-empty chunks + `onprogress` listener", async () => {
							setupFetch({status: Number(status), contentLength: true, body: [[10], [20]]})

							const reports = []
							let error
							try {
								await m.fetch("/url", {
									method,
									responseType,
									onprogress: (current, total) => reports.push([current, total]),
								})
							} catch (e) {
								error = e
							}

							o(error.message).equals("\x0A\x14")
							o(reports).deepEquals([[1, 2], [2, 2]])
							o(global.fetch.callCount).equals(1)
							o(global.fetch.args[0]).equals("/url")
							o(global.fetch.args[1].method).equals(method)
						})
					})
				}
			})
		}
	}
})
