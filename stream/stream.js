/* eslint-disable */
;(function() {
"use strict"
/* eslint-enable */
Stream.SKIP = {}
Stream.scan = scan
Stream.merge = merge
Stream.combine = combine
Stream.scanMerge = scanMerge

let warnedHalt = false
Object.defineProperty(Stream, "HALT", {
	get: () => {
		warnedHalt && console.log("HALT is deprecated and has been renamed to SKIP");
		warnedHalt = true
		return Stream.SKIP
	}
})

function Stream(value) {
	var dependentStreams = []
	var dependentFns = []

	function stream(v) {
		if (arguments.length && v !== Stream.SKIP && open(stream)) {
			value = v
			stream.changing()
			stream.state = "active"
			dependentStreams.forEach(function(s, i) { s(dependentFns[i](value)) })
		}

		return value
	}

	stream.changing = function() {
		open(stream) && (stream.state = "changing")
		dependentStreams.forEach(function(s) {
			s.dependent && s.dependent.changing()
			s.changing()
		})
	}

	stream.state = arguments.length && value !== Stream.SKIP ? "active" : "pending"

	stream.map = function(fn, ignoreInitial) {
		var target = stream.state === "active" && ignoreInitial !== Stream.SKIP
			? Stream(fn(value))
			: Stream()

		dependentStreams.push(target)
		dependentFns.push(fn)
		return target
	}

	let end
	function createEnd() {
		end = Stream()
		end.map(function(value) {
			if (value === true) {
				stream.state = "ended"
				dependentStreams.length = dependentFns.length = 0
			}
			return value
		})
		return end
	}

	stream.toJSON = function() { return value != null && typeof value.toJSON === "function" ? value.toJSON() : value }

	stream["fantasy-land/map"] = stream.map
	stream["fantasy-land/ap"] = function(x) { return combine(function(s1, s2) { return s1()(s2()) }, [x, stream]) }
	stream["fantasy-land/of"] = Stream

	Object.defineProperty(stream, "end", {
		get: function() { return end || createEnd() }
	})

	return stream
}

function combine(fn, streams) {
	var ready = streams.every(function(s) {
		if (s["fantasy-land/of"] !== Stream)
			throw new Error("Ensure that each item passed to stream.combine/stream.merge is a stream")
		return s.state === "active"
	})
	var stream = ready
		? Stream(fn.apply(null, streams.concat([streams])))
		: Stream()

	let changed = []

	streams.forEach(function(s) {
		s.map(function(value) {
			changed.push(s)
			if (streams.every(function(s) { return s.state === "active" })) {
				stream(fn.apply(null, streams.concat([changed])))
				changed = []
			}
			return value
		}, Stream.SKIP).parent = stream
	})

	return stream
}

function merge(streams) {
	return combine(function() { return streams.map(function(s) { return s() }) }, streams)
}

function scan(fn, acc, origin) {
	var stream = origin.map(function(v) {
		acc = fn(acc, v)
		return acc
	})
	stream(acc)
	return stream
}

function scanMerge(tuples, seed) {
	var streams = tuples.map(function(tuple) { return tuple[0] })

	var stream = combine(function() {
		var changed = arguments[arguments.length - 1]
		streams.forEach(function(stream, i) {
			if (changed.indexOf(stream) > -1)
				seed = tuples[i][1](seed, stream())
		})

		return seed
	}, streams)

	stream(seed)

	return stream
}

function open(s) {
	return s.state === "pending" || s.state === "active" || s.state === "changing"
}

if (typeof module !== "undefined") module["exports"] = Stream
else if (typeof window.m === "function" && !("stream" in window.m)) window.m.stream = Stream
else window.m = {stream : Stream}

}());
