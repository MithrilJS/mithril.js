/* global global: false */
import browserMock from "../test-utils/browserMock.js"

const mock = browserMock()
mock.setTimeout = setTimeout
if (typeof global !== "undefined") {
	global.window = mock
	global.document = mock.document
	global.requestAnimationFrame = mock.requestAnimationFrame
	global.cancelAnimationFrame = mock.cancelAnimationFrame
}

export {mock as default}
