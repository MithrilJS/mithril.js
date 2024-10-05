import domMock from "./domMock.js"
import pushStateMock from "./pushStateMock.js"
import xhrMock from "./xhrMock.js"

export default function browserMock(env) {
	env = env || {}
	var $window = env.window = {}

	var dom = domMock()
	var xhr = xhrMock()
	for (var key in dom) if (!$window[key]) $window[key] = dom[key]
	for (var key in xhr) if (!$window[key]) $window[key] = xhr[key]
	pushStateMock(env)

	return $window
}
