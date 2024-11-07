/* global fetch */

import {checkCallback} from "../util.js"

var mfetch = async (url, opts = {}) => {
	checkCallback(opts.onprogress, true, "opts.onprogress")
	checkCallback(opts.extract, true, "opts.extract")

	try {
		var response = await fetch(url, opts)

		if (opts.onprogress && response.body) {
			var reader = response.body.getReader()
			var rawLength = response.headers.get("content-length") || ""
			// This is explicit coercion, but ESLint is frequently too dumb to detect it correctly.
			// Another example: https://github.com/eslint/eslint/issues/14623
			// eslint-disable-next-line no-implicit-coercion
			var total = (/^\d+$/).test(rawLength) ? +rawLength : -1
			var current = 0

			response = new Response(new ReadableStream({
				type: "bytes",
				start: (ctrl) => reader || ctrl.close(),
				cancel: (reason) => reader.cancel(reason),
				async pull(ctrl) {
					var result = await reader.read()
					if (result.done) {
						ctrl.close()
					} else {
						current += result.value.length
						ctrl.enqueue(result.value)
						opts.onprogress(current, total)
					}
				},
			}), response)
		}

		if (response.ok) {
			if (opts.extract) {
				return await opts.extract(response)
			}

			switch (opts.responseType || "json") {
				case "json": return await response.json()
				case "formdata": return await response.formData()
				case "arraybuffer": return await response.arrayBuffer()
				case "blob": return await response.blob()
				case "text": return await response.text()
				case "document":
					// eslint-disable-next-line no-undef
					return new DOMParser()
						.parseFromString(await response.text(), response.headers.get("content-type") || "text/html")
				default:
					throw new TypeError(`Unknown response type: ${opts.responseType}`)
			}
		}

		var message = (await response.text()) || response.statusText
	} catch (e) {
		var cause = e
		var message = e.message
	}

	var e = new Error(message)
	e.status = response ? response.status : 0
	e.response = response
	e.cause = cause
	throw e
}

export {mfetch as default}
