"use strict"

module.exports = function (reducer, seed, stream) {
	var newStream = stream.constructor.combine(function (s) {
		return seed = reducer(seed, s._state.value)
	}, [stream])

	if (newStream._state.state === 0) newStream(seed)

	return newStream
}
