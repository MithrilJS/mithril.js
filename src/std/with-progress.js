import {checkCallback} from "../util.js"

/**
 * @param {ReadableStream<Uint8Array> | null} source
 * @param {(current: number) => void} notify
 */
export default (source, notify) => {
	checkCallback(notify, false, "notify")

	var reader = source && source.getReader()
	var current = 0

	return new ReadableStream({
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
				notify(current)
			}
		},
	})
}
