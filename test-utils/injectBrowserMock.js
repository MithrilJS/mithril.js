/* global global: false */
import browserMock from "../test-utils/browserMock.js"

const mock = browserMock()
if (typeof global !== "undefined") {
	global.window = mock
	global.document = mock.document
}

export {mock as default}
