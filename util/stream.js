"use strict"

var guid = 0, noop = function() {}, HALT = {}
function createStream() {
	function stream() {
		if (arguments.length > 0) updateStream(stream, arguments[0], undefined)
		return stream._state.value
	}
	initStream(stream, arguments)
	
	if (arguments.length > 0) updateStream(stream, arguments[0], undefined)
	
	return stream
}
function initStream(stream, args) {
	stream.constructor = createStream
	stream._state = {id: guid++, value: undefined, error: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], errorStream: undefined, endStream: undefined}
	stream.map = map, stream.ap = ap, stream.of = createStream
	stream.valueOf = valueOf
	stream.catch = doCatch
	
	Object.defineProperties(stream, {
		error: {get: function() {
			if (!stream._state.errorStream) {
				var errorStream = function() {
					if (arguments.length > 0) updateStream(stream, undefined, arguments[0])
					return stream._state.error
				}
				initStream(errorStream, [])
				initDependency(errorStream, [stream], noop, noop)
				stream._state.errorStream = errorStream
			}
			return stream._state.errorStream
		}},
		end: {get: function() {
			if (!stream._state.endStream) {
				var endStream = createStream()
				endStream.map(function(value) {
					if (value === true) unregisterStream(stream), unregisterStream(endStream)
					return value
				})
				stream._state.endStream = endStream
			}
			return stream._state.endStream
		}}
	})
}
function updateStream(stream, value, error) {
	if (!absorbStream(stream, value, false) && !absorbStream(stream, error, true)) {
		updateState(stream, value, error)
		for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false)
		finalize(stream)
	}
}
function updateState(stream, value, error) {
	if (error !== undefined && typeof stream._state.recover === "function") {
		try {updateValues(stream, stream._state.recover(), undefined)}
		catch (e) {updateValues(stream, undefined, e)}
	}
	else updateValues(stream, value, error)
	stream._state.changed = true
	if (stream._state.state !== 2) stream._state.state = 1
}
function updateValues(stream, value, error) {
	stream._state.value = value
	stream._state.error = error
}
function updateDependency(stream, mustSync) {
	var state = stream._state, parents = state.parents
	if (parents.length > 0 && parents.filter(active).length === parents.length && (mustSync || parents.filter(changed).length > 0)) {
		var failed = parents.filter(errored)
		if (failed.length > 0) updateState(stream, undefined, failed[0]._state.error)
		else {
			try {
				var value = state.derive()
				if (!absorbStream(stream, value)) updateState(stream, value, undefined)
			}
			catch (e) {
				updateState(stream, undefined, e)
			}
		}
	}
}
function absorbStream(stream, value, isError) {
	if (value != null && value.constructor === createStream) {
		if (value._state.state === 2) {
			stream.end(true)
			stream(value())
		}
		else if (value._state.error) stream.error(value.error())
		else if (value._state.state === 0) return true
		else if (!isError) stream(value())
		else stream.error(value())
		return true
	}
	return false
}
function finalize(stream) {
	stream._state.changed = false
	for (var id in stream._state.deps) stream._state.deps[id]._state.changed = false
}

function doCatch(fn) {
	var stream = this
	var derive = function() {return stream._state.value}
	var recover = function() {return fn(stream._state.error)}
	return initDependency(createStream(), [stream], derive, recover)
}
function combine(fn, streams) {
	return initDependency(createStream(), streams, function() {
		var failed = streams.filter(errored)
		if (failed.length > 0) throw failed[0]._state.error
		return fn.apply(this, streams.concat([streams.filter(changed)]))
	}, undefined)
}

function initDependency(dep, streams, derive, recover) {
	var state = dep._state
	state.derive = derive
	state.recover = recover
	state.parents = streams.filter(notEnded)
	
	registerDependency(dep, state.parents)
	updateDependency(dep, true)
	
	return dep
}
function registerDependency(stream, parents) {
	for (var i = 0; i < parents.length; i++) {
		parents[i]._state.deps[stream._state.id] = stream
		registerDependency(stream, parents[i]._state.parents)
	}
}
function unregisterStream(stream) {
	for (var i = 0; i < stream._state.parents.length; i++) {
		var parent = stream._state.parents[i]
		delete parent._state.deps[stream._state.id]
	}
	for (var id in stream._state.deps) {
		var dependent = stream._state.deps[id]
		var index = dependent._state.parents.indexOf(stream)
		if (index > -1) dependent._state.parents.splice(index, 1)
	}
	stream._state.state = 2 //ended
	stream._state.deps = {}
}

function map(fn) {return combine(function(stream) {return fn(stream())}, [this])}
function ap(stream) {return combine(function(s1, s2) {return s1()(s2())}, [this, stream])}
function valueOf() {return this._state.value}

function active(stream) {return stream._state.state === 1}
function changed(stream) {return stream._state.changed}
function notEnded(stream) {return stream._state.state !== 2}
function errored(stream) {return stream._state.error}

function reject(e) {
	var stream = createStream()
	stream.error(e)
	return stream
}

module.exports = {stream: createStream, combine: combine, reject: reject}
