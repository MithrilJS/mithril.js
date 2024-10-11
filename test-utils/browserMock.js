import domMock from "./domMock.js"
import pushStateMock from "./pushStateMock.js"

export default function browserMock(env = {}) {
	var $window = {}

	domMock($window, env)
	pushStateMock($window, env)

	return $window
}
