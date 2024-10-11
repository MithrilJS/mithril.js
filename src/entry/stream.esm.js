var STATE_PENDING = 1
var STATE_ACTIVE = 2
var STATE_CHANGING = 3
var STATE_ENDED = 4

var streamSet = (stream, value) => {
	if (value !== SKIP) {
		stream._v = value
		if (stream._s !== STATE_ENDED) {
			streamChanging(stream)
			stream._s = STATE_ACTIVE
			// Cloning the list to ensure it's still iterated in intended
			// order
			var streams = stream._d.slice()
			var fns = stream._f.slice()
			for (var i = 0; i < streams.length; i++) {
				if (streams[i]._s !== STATE_ENDED) {
					streamSet(streams[i], fns[i](stream._v))
				}
			}
		}
	}

	return stream._v
}

var streamChanging = (stream) => {
	if (stream._s !== STATE_ENDED) stream._s = STATE_CHANGING
	for (var s of stream._d) streamChanging(s)
}

var streamMap = (stream, fn, ignoreInitial) => {
	var target = ignoreInitial ? Stream() : Stream(fn(stream._v))
	target._p.push(stream)
	stream._d.push(target)
	stream._f.push(fn)
	return target
}

var Stream = (...args) => {
	var stream = (...args) => streamSet(stream, args.length ? args[0] : SKIP)

	Object.setPrototypeOf(stream, Stream.prototype)

	stream._s = args.length && args[0] !== SKIP ? STATE_ACTIVE : STATE_PENDING
	stream._v = args.length ? args[0] : undefined
	stream._d = []
	stream._f = []
	stream._p = []
	stream._e = null

	return stream
}

Stream["fantasy-land/of"] = Stream

Stream.prototype = Object.create(Function.prototype, Object.getOwnPropertyDescriptors({
	constructor: Stream,
	map(fn) { return streamMap(this, fn, this._s !== STATE_ACTIVE) },
	"fantasy-land/ap"(x) { return combine(() => (0, x._v)(this._v), [x, this]) },
	toJSON() {
		var value = this._v
		return (value != null && typeof value.toJSON === "function" ? value.toJSON() : value)
	},
	get end() {
		if (!this._e) {
			this._e = Stream()
			streamMap(this._e, (value) => {
				if (value === true) {
					for (var p of this._p) {
						var childIndex = p._d.indexOf(this)
						if (childIndex >= 0) {
							p._d.splice(childIndex, 1)
							p._f.splice(childIndex, 1)
						}
					}
					this._s = STATE_ENDED
					this._p.length = this._d.length = this._f.length = 0
				}
				return value
			}, true)
		}
		return this._e
	},
}))

Stream.prototype["fantasy-land/map"] = Stream.prototype.map

var SKIP = Stream.SKIP = {}

var combine = Stream.combine = (fn, streams) => {
	if (streams.some((s) => s.constructor !== Stream)) {
		throw new Error("Ensure that each item passed to stream.combine/stream.merge/lift is a stream.")
	}
	var ready = streams.every((s) => s._s === STATE_ACTIVE)
	var stream = ready ? Stream(fn(streams)) : Stream()

	var changed = []

	var mappers = streams.map((s) => streamMap(s, (value) => {
		changed.push(s)
		if (ready || streams.every((s) => s._s !== STATE_PENDING)) {
			ready = true
			streamSet(stream, fn(changed))
			changed = []
		}
		return value
	}, true))

	var endStream = stream.end.map((value) => {
		if (value === true) {
			for (var mapper of mappers) mapper.end(true)
			endStream.end(true)
		}
		return undefined
	})

	return stream
}

Stream.merge = (streams) => combine(() => streams.map((s) => s._v), streams)

Stream.scan = (fn, acc, origin) => {
	var stream = streamMap(origin, (v) => {
		var next = fn(acc, v)
		if (next !== SKIP) acc = next
		return next
	}, origin._s !== STATE_ACTIVE)
	streamSet(stream, acc)
	return stream
}

Stream.scanMerge = (tuples, seed) => {
	var streams = tuples.map((tuple) => tuple[0])

	var stream = combine((changed) => {
		for (var i = 0; i < streams.length; i++) {
			if (changed.includes(streams[i])) {
				seed = tuples[i][1](seed, streams[i]._v)
			}
		}
		return seed
	}, streams)

	streamSet(stream, seed)

	return stream
}

Stream.lift = (fn, ...streams) => combine(() => fn(...streams.map((s) => s._v)), streams)

export {Stream as default}
