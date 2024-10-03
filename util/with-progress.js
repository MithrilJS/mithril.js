"use strict"

/**
 * @param {ReadableStream<Uint8Array> | null} source
 * @param {(current: number) => void} notify
 */
module.exports = (source, notify) => {
	var reader = source && source.getReader()
	var current = 0

	return new ReadableStream({
		type: "bytes",
		start: (ctrl) => reader || ctrl.close(),
		cancel: (reason) => reader.cancel(reason),
		pull: (ctrl) => reader.read().then((result) => {
			if (result.done) {
				ctrl.close()
			} else {
				current += result.value.length
				ctrl.enqueue(result.value)
				notify(current)
			}
		}),
	})
}
