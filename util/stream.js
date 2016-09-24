"use strict"

module.exports = function(log) {
	var guid = 0, noop = function() {}, HALT = {}
	function createStream() {
		function stream() {
			if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0], undefined)
			return stream._state.value
		}
		initStream(stream)

		if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, arguments[0], undefined)

		return stream
	}
	function initStream(stream) {
		stream.constructor = createStream
		stream._state = {id: guid++, value: undefined, error: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], errorStream: undefined, endStream: undefined}
		stream.map = map, stream.ap = ap, stream.of = createStream
		stream.valueOf = valueOf, stream.toJSON = toJSON, stream.toString = valueOf
		stream.run = run, stream.catch = doCatch

		Object.defineProperties(stream, {
			error: {get: function() {
				if (!stream._state.errorStream) {
					var errorStream = function() {
						if (arguments.length > 0 && arguments[0] !== HALT) updateStream(stream, undefined, arguments[0])
						return stream._state.error
					}
					initStream(errorStream)
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
		updateState(stream, value, error)
		for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false)
		finalize(stream)
	}
	function updateState(stream, value, error) {
		error = unwrapError(value, error)
		if (error !== undefined && typeof stream._state.recover === "function") {
			if (!resolve(stream, updateValues, true)) return
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
			else resolve(stream, updateState, false)
		}
	}
	function resolve(stream, update, shouldRecover) {
		try {
			var value = shouldRecover ? stream._state.recover() : stream._state.derive()
			if (value === HALT) return false
			update(stream, value, undefined)
		}
		catch (e) {
			update(stream, undefined, e.__error != null ? e.__error : e)
			if (e.__error == null) reportUncaughtError(stream, e)
		}
		return true
	}
	function unwrapError(value, error) {
		if (value != null && value.constructor === createStream) {
			if (value._state.error !== undefined) error = value._state.error
			else error = unwrapError(value._state.value, value._state.error)
		}
		return error
	}
	function finalize(stream) {
		stream._state.changed = false
		for (var id in stream._state.deps) stream._state.deps[id]._state.changed = false
	}
	function reportUncaughtError(stream, e) {
		if (Object.keys(stream._state.deps).length === 0) {
			setTimeout(function() {
				if (Object.keys(stream._state.deps).length === 0) log(e)
			}, 0)
		}
	}

	function run(fn) {
		var self = createStream(), stream = this
		return initDependency(self, [stream], function() {
			return absorb(self, fn(stream()))
		}, undefined)
	}
	function doCatch(fn) {
		var self = createStream(), stream = this
		var derive = function() {return stream._state.value}
		var recover = function() {return absorb(self, fn(stream._state.error))}
		return initDependency(self, [stream], derive, recover)
	}
	function combine(fn, streams) {
		if (streams.length > streams.filter(valid).length) throw new Error("Ensure that each item passed to m.prop.combine/m.prop.merge is a stream")
		return initDependency(createStream(), streams, function() {
			var failed = streams.filter(errored)
			if (failed.length > 0) throw {__error: failed[0]._state.error}
			return fn.apply(this, streams.concat([streams.filter(changed)]))
		}, undefined)
	}
	function absorb(stream, value) {
		if (value != null && value.constructor === createStream) {
			var absorbable = value
			var update = function() {
				updateState(stream, absorbable._state.value, absorbable._state.error)
				for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false)
			}
			absorbable.map(update).catch(function(e) {
				update()
				throw {__error: e}
			})
			
			if (absorbable._state.state === 0) return HALT
			if (absorbable._state.error) throw {__error: absorbable._state.error}
			value = absorbable._state.value
		}
		return value
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
	function toJSON() {return this._state.value != null && typeof this._state.value.toJSON === "function" ? this._state.value.toJSON() : this._state.value}

	function valid(stream) {return stream._state }
	function active(stream) {return stream._state.state === 1}
	function changed(stream) {return stream._state.changed}
	function notEnded(stream) {return stream._state.state !== 2}
	function errored(stream) {return stream._state.error}

	function reject(e) {
		var stream = createStream()
		stream.error(e)
		return stream
	}

	function merge(streams) {
		return combine(function () {
			return streams.map(function(s) {return s()})
		}, streams)
	}
	createStream.merge = merge
	createStream.combine = combine
	createStream.reject = reject
	createStream.HALT = HALT

	return createStream
}
