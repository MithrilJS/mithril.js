"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var StreamFactory = require("../../util/stream")

o.spec("stream", function() {
	var Stream, spy
	o.beforeEach(function() {
		spy = o.spy()
		Stream = StreamFactory(spy)
	})
	
	o.spec("stream", function() {
		o("works as getter/setter", function() {
			var stream = Stream(1)
			var initialValue = stream()
			stream(2)
			var newValue = stream()

			o(initialValue).equals(1)
			o(newValue).equals(2)
		})
		o("has undefined value by default", function() {
			var stream = Stream()

			o(stream()).equals(undefined)
		})
		o("can update to undefined", function() {
			var stream = Stream(1)
			stream(undefined)

			o(stream()).equals(undefined)
		})
		o("can be stream of streams", function() {
			var stream = Stream(Stream(1))

			o(stream()()).equals(1)
		})
	})
	o.spec("combine", function() {
		o("transforms value", function() {
			var stream = Stream()
			var doubled = Stream.combine(function(s) {return s() * 2}, [stream])

			stream(2)

			o(doubled()).equals(4)
		})
		o("transforms default value", function() {
			var stream = Stream(2)
			var doubled = Stream.combine(function(s) {return s() * 2}, [stream])

			o(doubled()).equals(4)
		})
		o("transforms multiple values", function() {
			var s1 = Stream()
			var s2 = Stream()
			var added = Stream.combine(function(s1, s2) {return s1() + s2()}, [s1, s2])

			s1(2)
			s2(3)

			o(added()).equals(5)
		})
		o("transforms multiple default values", function() {
			var s1 = Stream(2)
			var s2 = Stream(3)
			var added = Stream.combine(function(s1, s2) {return s1() + s2()}, [s1, s2])

			o(added()).equals(5)
		})
		o("transforms mixed default and late-bound values", function() {
			var s1 = Stream(2)
			var s2 = Stream()
			var added = Stream.combine(function(s1, s2) {return s1() + s2()}, [s1, s2])

			s2(3)

			o(added()).equals(5)
		})
		o("combines atomically", function() {
			var count = 0
			var a = Stream()
			var b = Stream.combine(function(a) {return a() * 2}, [a])
			var c = Stream.combine(function(a) {return a() * a()}, [a])
			var d = Stream.combine(function(b, c) {
				count++
				return b() + c()
			}, [b, c])

			a(3)

			o(d()).equals(15)
			o(count).equals(1)
		})
		o("combines default value atomically", function() {
			var count = 0
			var a = Stream(3)
			var b = Stream.combine(function(a) {return a() * 2}, [a])
			var c = Stream.combine(function(a) {return a() * a()}, [a])
			var d = Stream.combine(function(b, c) {
				count++
				return b() + c()
			}, [b, c])

			o(d()).equals(15)
			o(count).equals(1)
		})
		o("combine lists only changed upstreams in last arg", function() {
			var streams = []
			var a = Stream()
			var b = Stream()
			var c = Stream.combine(function(a, b, changed) {
				streams = changed
			}, [a, b])

			a(3)
			b(5)

			o(streams.length).equals(1)
			o(streams[0]).equals(b)
		})
		o("combine lists only changed upstreams in last arg with default value", function() {
			var streams = []
			var a = Stream(3)
			var b = Stream(5)
			var c = Stream.combine(function(a, b, changed) {
				streams = changed
			}, [a, b])

			a(7)

			o(streams.length).equals(1)
			o(streams[0]).equals(a)
		})
		o("combine can return undefined", function() {
			var a = Stream(1)
			var b = Stream.combine(function(a) {
				return undefined
			}, [a])

			o(b()).equals(undefined)
		})
		o("combine can return stream", function() {
			var a = Stream(1)
			var b = Stream.combine(function(a) {
				return Stream(2)
			}, [a])

			o(b()()).equals(2)
		})
		o("combine can return pending stream", function() {
			var a = Stream(1)
			var b = Stream.combine(function(a) {
				return Stream()
			}, [a])

			o(b()()).equals(undefined)
		})
		o("combine can halt", function() {
			var count = 0
			var a = Stream(1)
			var b = Stream.combine(function(a) {
				return Stream.HALT
			}, [a])
			["fantasy-land/map"](function() {
				count++
				return 1
			})

			o(b()).equals(undefined)
		})
		o("combine will throw with a helpful error if given non-stream values", function () {
			var spy = o.spy()
			var a = Stream(1)
			var thrown = null;
			try {
				var b = Stream.combine(spy, [a, ''])
			} catch (e) {
				thrown = e
			}

			o(thrown).notEquals(null)
			o(thrown.constructor === TypeError).equals(false)
			o(spy.callCount).equals(0)
		})
	})
	o.spec("merge", function() {
		o("transforms an array of streams to an array of values", function() {
			var all = Stream.merge([
				Stream(10),
				Stream("20"),
				Stream({value: 30}),
			])

			o(all()).deepEquals([10, "20", {value: 30}])
		})
		o("remains pending until all streams are active", function() {
			var straggler = Stream()

			var all = Stream.merge([
				Stream(10),
				Stream("20"),
				straggler,
			])

			o(all()).equals(undefined)

			straggler(30)
			o(all()).deepEquals([10, "20", 30])
		})
		o("calls run callback after all parents are active", function() {
			var value = 0
			var id = function(value) {return value}
			var a = Stream()
			var b = Stream()

			var all = Stream.merge([a.run(id).catch(id), b.run(id).catch(id)]).run(function(data) {
				value = data[0] + data[1]
			})

			a(1)
			b(2)
			o(value).equals(3)

			a(3)
			b(4)
			o(value).equals(7)
		})
	})
	o.spec("end", function() {
		o("end stream works", function() {
			var stream = Stream()
			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])

			stream.end(true)

			stream(3)

			o(doubled()).equals(undefined)
		})
		o("end stream works with default value", function() {
			var stream = Stream(2)
			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])

			stream.end(true)

			stream(3)

			o(doubled()).equals(4)
		})
		o("cannot add downstream to ended stream", function() {
			var stream = Stream(2)
			stream.end(true)

			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])
			stream(3)

			o(doubled()).equals(undefined)
		})
		o("upstream does not affect ended stream", function() {
			var stream = Stream(2)
			var doubled = Stream.combine(function(stream) {return stream() * 2}, [stream])

			doubled.end(true)

			stream(4)

			o(doubled()).equals(4)
		})
	})
	o.spec("error", function() {
		o("error() works", function() {
			var stream = Stream()
			var errored = Stream.combine(function(stream) {throw new Error("error")}, [stream])

			stream(3)

			o(errored()).equals(undefined)
			o(errored.error().message).equals("error")
		})
		o("error() works with default value", function() {
			var stream = Stream(3)
			var errored = Stream.combine(function(stream) {throw new Error("error")}, [stream])

			o(errored()).equals(undefined)
			o(errored.error().message).equals("error")
		})
		o("error() removes error on valid value", function() {
			var stream = Stream("a")
			var doubled = Stream.combine(function(stream) {
				if (typeof stream() !== "number") throw new Error("error")
				else return stream() * 2
			}, [stream])

			stream(3)

			o(doubled()).equals(6)
			o(doubled.error()).equals(undefined)
		})
		o("error() triggers catch", function() {
			var count = 0
			var stream = Stream(1)
			var handled = stream.catch(function() {
				count++
				return 2
			})

			stream.error(new Error("error"))

			o(handled()).equals(2)
			o(handled.error()).equals(undefined)
			o(count).equals(1)
		})
		o("thrown error propagates downstream", function() {
			var count = 0
			var stream = Stream(1)
				["fantasy-land/map"](function() {throw new Error("error")})
				["fantasy-land/map"](function(value) {
					count++
					return value * 2
				})
				["fantasy-land/map"](function(value) {
					count++
					return value * 3
				})

			o(stream()).equals(undefined)
			o(stream.error().message).equals("error")
			o(count).equals(0)
		})
		o("set error propagates downstream", function() {
			var count = 0
			var stream = Stream()
			var mapped = stream["fantasy-land/map"](function(value) {
				count++
				return value * 2
			})
			["fantasy-land/map"](function(value) {
				count++
				return value * 3
			})
			stream.error(new Error("error"))

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")
			o(count).equals(0)
		})
		o("error[fl.map] works", function() {
			var stream = Stream(1)
			var mappedFromError = stream.error["fantasy-land/map"](function(value) {
				if (value) return "from" + value.message
			})

			o(mappedFromError()).equals(undefined)

			stream.error(new Error("error"))

			o(mappedFromError()).equals("fromerror")
		})
		o("error from error[fl.map] propagates", function() {
			var stream = Stream(1)
			var mappedFromError = stream.error["fantasy-land/map"](function(value) {
				return "from" + value.message
			})
			["fantasy-land/map"](function(value) {
				return "a" + value
			})

			o(mappedFromError()).equals(undefined)

			stream.error(new Error("error"))

			o(mappedFromError()).equals("afromerror")
		})
		o("error thrown from error[fl.map] propagates downstream", function() {
			var count = 0
			var stream = Stream(1)
			var mappedFromError = stream.error["fantasy-land/map"](function(value) {
				throw new Error("b")
			})

			var downstream = mappedFromError["fantasy-land/map"](function() {
				count++
			})

			o(mappedFromError()).equals(undefined)

			stream.error(new Error("a"))

			o(mappedFromError()).equals(undefined)
			o(mappedFromError.error().message).equals("b")
			o(downstream()).equals(undefined)
			o(downstream.error().message).equals("b")
			o(count).equals(0)
		})
		o("error can halt", function() {
			var count = 0
			var stream = Stream.reject(1).error["fantasy-land/map"](function() {
				return Stream.HALT
			})
			["fantasy-land/map"](function() {
				count++
				return 1
			})

			o(stream()).equals(undefined)
			o(count).equals(0)
		})
		o("error[fl.map] can return streams", function() {
			var stream = Stream.reject(new Error("error"))
			var error = stream.error["fantasy-land/map"](function(value) {
				return Stream(1)
			})

			o(error()()).equals(1)
		})
		o("combined stream of two errored streams adopts error from first", function() {
			var a = Stream(1)
			var b = Stream.combine(function(a) {throw new Error("error from b")}, [a])
			var c = Stream.combine(function(a) {throw new Error("error from c")}, [a])
			var d = Stream.combine(function(b, c) {return 2}, [b, c])

			o(d()).equals(undefined)
			o(d.error().message).equals("error from b")
		})
	})
	o.spec("reject", function() {
		o("reject works", function() {
			var stream = Stream.reject(new Error("error"))

			o(stream()).equals(undefined)
			o(stream.error().message).equals("error")
		})
		o("rejected propagates downstream", function() {
			var count = 0
			var stream = Stream.reject(new Error("error"))
				["fantasy-land/map"](function(value) {
					count++
					return value * 2
				})
				["fantasy-land/map"](function(value) {
					count++
					return value * 3
				})

			o(stream()).equals(undefined)
			o(stream.error().message).equals("error")
		})
		o("rejected removes error on value", function() {
			var stream = Stream.reject(new Error("error"))
			var doubled = stream["fantasy-land/map"](function(value) {
				return value * 2
			})

			stream(1)

			o(doubled()).equals(2)
			o(stream.error()).equals(undefined)
		})
		o("combined rejected yields first error", function() {
			var count = 0
			var a = Stream.reject(new Error("a"))
			var b = Stream.reject(new Error("b"))
			var combined = Stream.combine(function(a, b) {
				count++
				return a() + b()
			}, [a, b])

			o(combined()).equals(undefined)
			o(combined.error().message).equals("a")
			o(count).equals(0)
		})
	})
	o.spec("run", function() {
		o("works", function() {
			var stream = Stream()
			var doubled = stream.run(function(value) {return value * 2})

			stream(3)

			o(doubled()).equals(6)
		})
		o("works with default value", function() {
			var stream = Stream(3)
			var doubled = stream.run(function(value) {return value * 2})

			o(doubled()).equals(6)
		})
		o("works with undefined value", function() {
			var stream = Stream()
			var mapped = stream.run(function(value) {return String(value)})

			stream(undefined)

			o(mapped()).equals("undefined")
		})
		o("does not run when initialized w/ HALT", function() {
			var stream = Stream(Stream.HALT)
			var mapped = stream.run(function(value) {return 123})

			o(mapped()).equals(undefined)
		})
		o("does not run when set to HALT", function() {
			var stream = Stream()
			var mapped = stream.run(function(value) {return 123})

			stream(Stream.HALT)
			
			o(mapped()).equals(undefined)
		})
		o("works with default undefined value", function() {
			var stream = Stream(undefined)
			var mapped = stream.run(function(value) {return String(value)})

			o(mapped()).equals("undefined")
		})
		o("works with stream that throws", function() {
			var count = 0
			var stream = Stream(undefined)
			var errored = stream.run(function(value) {throw new Error("error")})
			var mapped = errored["fantasy-land/map"](function(value) {
				count++
				return value
			})

			o(errored()).equals(undefined)
			o(errored.error().message).equals("error")
			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")
			o(count).equals(0)
		})
		o("works with pending stream", function() {
			var count = 0
			var stream = Stream(undefined)
			var absorbed = Stream()
			var absorber = stream.run(function(value) {return absorbed})
			var mapped = absorber["fantasy-land/map"](function(value) {
				count++
				return value
			})
			
			o(mapped()).equals(undefined)
			o(count).equals(0)
			
			absorbed(123)
			
			o(mapped()).equals(123)
			o(count).equals(1)
		})
		o("works with active stream", function() {
			var stream = Stream(undefined)
			var mapped = stream.run(function(value) {return Stream(1)})

			o(mapped()).equals(1)
		})
		o("works with errored stream", function() {
			var rejected
			var stream = Stream(undefined)
			var mapped = stream.run(function(value) {
				return Stream.reject(new Error("error"))
			})

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")
		})
		o("works with ended stream", function() {
			var stream = Stream(1)
			var mapped = stream.run(function(value) {
				var ended = Stream(2)
				ended.end(true)
				return ended
			})

			stream(3)

			o(mapped()).equals(2)
		})
		o("works when active stream updates", function() {
			var stream = Stream(undefined)
			var absorbed = Stream(1)
			var mapped = stream.run(function(value) {return absorbed})

			absorbed(2)

			o(mapped()).equals(2)

			absorbed(3)

			o(mapped()).equals(3)
		})
		o("works when pending stream updates", function() {
			var count = 0
			var stream = Stream(undefined)
			var absorbed = Stream()
			var mapped = stream.run(function(value) {return absorbed})

			mapped["fantasy-land/map"](function (value) {
				count += 1
				
				o(value).equals(123)
			})
			o(count).equals(0)

			absorbed(123)
			
			o(count).equals(1)
			o(mapped()).equals(123)
		})
		o("works when updating stream to errored state", function() {
			var stream = Stream(undefined)
			var absorbed = Stream(1)
			var mapped = stream.run(function(value) {return absorbed})

			absorbed.error(new Error("error"))

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")

			absorbed.error(new Error("another error"))

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("another error")
		})
		o("works when updating pending stream to errored state", function() {
			var stream = Stream(undefined)
			var absorbed = Stream()
			var mapped = stream.run(function(value) {return absorbed})

			absorbed.error(new Error("error"))

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")
		})
		o("works when updating stream to active state", function() {
			var stream = Stream(undefined)
			var absorbed = Stream(1)
			var mapped = stream.run(function(value) {return absorbed})

			absorbed.error(new Error("error"))

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")

			absorbed(2)

			o(mapped()).equals(2)
			o(mapped.error()).equals(undefined)
		})
		o("throwing from absorbed propagates", function() {
			var stream = Stream(undefined)
			var absorbedParent = Stream()
			var absorbed = absorbedParent["fantasy-land/map"](function() {throw new Error("error")})
			var mapped = stream.run(function(value) {return absorbed})

			o(mapped()).equals(undefined)
			o(mapped.error()).equals(undefined)

			absorbedParent(1)

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("error")
		})
	})
	o.spec("catch", function() {
		o("catch works from reject", function() {
			var count = 0
			var stream = Stream.reject(new Error("error")).catch(function(e) {
				count++
				return "no" + e.message
			})
			["fantasy-land/map"](function(value) {
				return value + "mapped"
			})

			o(count).equals(1)
			o(stream()).equals("noerrormapped")
			o(stream.error()).equals(undefined)
		})
		o("catch works from combine", function() {
			var count = 0
			var stream = Stream.combine(function() {throw new Error("error")}, [Stream(1)]).catch(function(e) {
				count++
				return "no" + e.message
			})
			["fantasy-land/map"](function(value) {
				return value + "mapped"
			})

			o(count).equals(1)
			o(stream()).equals("noerrormapped")
			o(stream.error()).equals(undefined)
		})
		o("catch is not called if no error", function() {
			var count = 0
			var stream = Stream()
			var handled = stream["fantasy-land/map"](function(value) {return value + value}).catch(function(e) {
				count++
				return "no" + e.message
			})
			["fantasy-land/map"](function(value) {
				return value + "mapped"
			})

			stream("a")

			o(count).equals(0)
			o(handled()).equals("aamapped")
			o(handled.error()).equals(undefined)
		})
		o("catch is not called if no error with default value", function() {
			var count = 0
			var stream = Stream("a")["fantasy-land/map"](function(value) {return value + value}).catch(function(e) {
				count++
				return "no" + e.message
			})
			["fantasy-land/map"](function(value) {
				return value + "mapped"
			})

			o(count).equals(0)
			o(stream()).equals("aamapped")
			o(stream.error()).equals(undefined)
		})
		o("throwing from catch rejects", function() {
			var stream = Stream.reject(new Error("a")).catch(function(e) {
				throw new Error("b")
			})
			var mapped = stream["fantasy-land/map"](function(value) {return value + "ok"})

			o(stream()).equals(undefined)
			o(stream.error().message).equals("b")
			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("b")
		})
		o("catch can return undefined", function() {
			var stream = Stream.reject(new Error("b")).catch(function(e) {})["fantasy-land/map"](function(value) {return String(value)})

			o(stream()).equals("undefined")
			o(stream.error()).equals(undefined)
		})
		o("catch absorbs pending stream", function() {
			var count = 0
			var stream = Stream()
			var mapped = Stream.reject(new Error("b")).catch(function(e) {
				return stream
			})
			["fantasy-land/map"](function(value) {
				count++
				return String(value)
			})

			o(mapped()).equals(undefined)
			o(count).equals(0)
		})
		o("catch absorbs active stream", function() {
			var stream = Stream(1)
			var mapped = Stream.reject(new Error("b")).catch(function(e) {
				return stream
			})
			["fantasy-land/map"](function(value) {return String(value)})

			o(mapped()).equals("1")
		})
		o("catch absorbs errored stream", function() {
			/*var stream = Stream.reject(new Error("a"))
			var mapped = Stream.reject(new Error("b")).catch(function(e) {
				return stream
			})
			["fantasy-land/map"](function(value) {return String(value)})

			o(mapped()).equals(undefined)
			o(mapped.error().message).equals("a")*/
		})
		o("catch does not prevent sibling error propagation", function() {
			var a = Stream.reject(new Error("a"))
			var b = a["fantasy-land/map"](function(value) {return value + "b"}).catch(function(e) {})
			var c = a["fantasy-land/map"](function(value) {return value + "c"})
			var d = Stream.combine(function(b, c) {return b() + c()}, [b, c])

			o(d()).equals(undefined)
			o(d.error().message).equals("a")
		})
		o("catches wrapped rejected stream", function() {
			var caught
			var stream = Stream(1)["fantasy-land/map"](function() {
				return Stream.reject(new Error("error"))
			})
			.catch(function(value) {
				caught = value
				return "no" + value.message
			})
			["fantasy-land/map"](function(value) {
				return value + "mapped"
			})

			o(stream()).equals("noerrormapped")
		})
		o("catches nested wrapped rejected stream", function() {
			var caught
			var stream = Stream(1)["fantasy-land/map"](function() {
				return Stream(2)["fantasy-land/map"](function() {
					return Stream.reject(new Error("error"))
				})
			})
			.catch(function(value) {
				caught = value
				return "no" + value.message
			})
			["fantasy-land/map"](function(value) {
				return value + "mapped"
			})

			o(stream()).equals("noerrormapped")
		})
	})
	o.spec("valueOf", function() {
		o("works", function() {
			o(Stream(1).valueOf()).equals(1)
			o(Stream("a").valueOf()).equals("a")
			o(Stream(true).valueOf()).equals(true)
			o(Stream(null).valueOf()).equals(null)
			o(Stream(undefined).valueOf()).equals(undefined)
			o(Stream({a: 1}).valueOf()).deepEquals({a: 1})
			o(Stream([1, 2, 3]).valueOf()).deepEquals([1, 2, 3])
			o(Stream().valueOf()).equals(undefined)
		})
		o("allows implicit value access in mathematical operations", function() {
			o(Stream(1) + Stream(1)).equals(2)
		})
	})
	o.spec("toString", function() {
		o("aliases valueOf", function() {
			var stream = Stream(1)

			o(stream.toString).equals(stream.valueOf)
		})
		o("allows implicit value access in string operations", function() {
			o(Stream("a") + Stream("b")).equals("ab")
		})
	})
	o.spec("toJSON", function() {
		o("works", function() {
			o(Stream(1).toJSON()).equals(1)
			o(Stream("a").toJSON()).equals("a")
			o(Stream(true).toJSON()).equals(true)
			o(Stream(null).toJSON()).equals(null)
			o(Stream(undefined).toJSON()).equals(undefined)
			o(Stream({a: 1}).toJSON()).deepEquals({a: 1})
			o(Stream([1, 2, 3]).toJSON()).deepEquals([1, 2, 3])
			o(Stream().toJSON()).equals(undefined)
			o(Stream(new Date(0)).toJSON()).equals(new Date(0).toJSON())
		})
		o("works w/ JSON.stringify", function() {
			o(JSON.stringify(Stream(1))).equals(JSON.stringify(1))
			o(JSON.stringify(Stream("a"))).equals(JSON.stringify("a"))
			o(JSON.stringify(Stream(true))).equals(JSON.stringify(true))
			o(JSON.stringify(Stream(null))).equals(JSON.stringify(null))
			o(JSON.stringify(Stream(undefined))).equals(JSON.stringify(undefined))
			o(JSON.stringify(Stream({a: 1}))).deepEquals(JSON.stringify({a: 1}))
			o(JSON.stringify(Stream([1, 2, 3]))).deepEquals(JSON.stringify([1, 2, 3]))
			o(JSON.stringify(Stream())).equals(JSON.stringify(undefined))
			o(JSON.stringify(Stream(new Date(0)))).equals(JSON.stringify(new Date(0)))
		})
	})
	o.spec("uncaught exception reporting", function() {
		o("reports thrown errors", function(done) {
			Stream(1)["fantasy-land/map"](function() {throw new Error("error")})
			
			setTimeout(function() {
				o(spy.callCount).equals(1)
				o(spy.args[0].message).equals("error")
				done()
			}, 0)
		})
		o("does not report explicit rejections", function(done) {
			Stream.reject(1)
			
			setTimeout(function() {
				o(spy.callCount).equals(0)
				done()
			}, 0)
		})
	})
	o.spec("map", function() {
		o("works", function() {
			var stream = Stream()
			var doubled = stream["fantasy-land/map"](function(value) {return value * 2})

			stream(3)

			o(doubled()).equals(6)
		})
		o("works with default value", function() {
			var stream = Stream(3)
			var doubled = stream["fantasy-land/map"](function(value) {return value * 2})

			o(doubled()).equals(6)
		})
		o("works with undefined value", function() {
			var stream = Stream()
			var mapped = stream["fantasy-land/map"](function(value) {return String(value)})

			stream(undefined)

			o(mapped()).equals("undefined")
		})
		o("works with default undefined value", function() {
			var stream = Stream(undefined)
			var mapped = stream["fantasy-land/map"](function(value) {return String(value)})

			o(mapped()).equals("undefined")
		})
		o("works with pending stream", function() {
			var stream = Stream(undefined)
			var mapped = stream["fantasy-land/map"](function(value) {return Stream()})

			o(mapped()()).equals(undefined)
		})
		o("has alias", function() {
			var stream = Stream(undefined)

			o(stream["fantasy-land/map"]).equals(stream.map)
		})
	})
	o.spec("ap", function() {
		o("works", function() {
			var apply = Stream(function(value) {return value * 2})
			var stream = Stream(3)
			var applied = stream["fantasy-land/ap"](apply)

			o(applied()).equals(6)

			apply(function(value) {return value / 3})

			o(applied()).equals(1)

			stream(9)

			o(applied()).equals(3)
		})
		o("works with undefined value", function() {
			var apply = Stream(function(value) {return String(value)})
			var stream = Stream(undefined)
			var applied = stream["fantasy-land/ap"](apply)

			o(applied()).equals("undefined")

			apply(function(value) {return String(value) + "a"})

			o(applied()).equals("undefineda")
		})
	})
	o.spec("fantasy-land", function() {
		o.spec("functor", function() {
			o("identity", function() {
				var stream = Stream(3)
				var mapped = stream["fantasy-land/map"](function(value) {return value})

				o(stream()).equals(mapped())
			})
			o("composition", function() {
				function f(x) {return x * 2}
				function g(x) {return x * x}

				var stream = Stream(3)

				var mapped = stream["fantasy-land/map"](function(value) {return f(g(value))})
				var composed = stream["fantasy-land/map"](g)["fantasy-land/map"](f)

				o(mapped()).equals(18)
				o(mapped()).equals(composed())
			})
		})
		o.spec("apply", function() {
			o("composition", function() {
				var a = Stream(function(value) {return value * 2})
				var u = Stream(function(value) {return value * 3})
				var v = Stream(5)

				var mapped = v["fantasy-land/ap"](u["fantasy-land/ap"](a["fantasy-land/map"](function(f) {
					return function(g) {
						return function(x) {
							return f(g(x))
						}
					}
				})))

				var composed = v["fantasy-land/ap"](u)["fantasy-land/ap"](a)

				o(mapped()).equals(30)
				o(mapped()).equals(composed())
			})
		})
		o.spec("applicative", function() {
			o("identity", function() {
				var a = Stream()["fantasy-land/of"](function(value) {return value})
				var v = Stream(5)

				o(v["fantasy-land/ap"](a)()).equals(5)
				o(v["fantasy-land/ap"](a)()).equals(v())
			})
			o("homomorphism", function() {
				var a = Stream(0)
				var f = function(value) {return value * 2}
				var x = 3

				o(a["fantasy-land/of"](x)["fantasy-land/ap"](a["fantasy-land/of"](f))()).equals(6)
				o(a["fantasy-land/of"](x)["fantasy-land/ap"](a["fantasy-land/of"](f))()).equals(a["fantasy-land/of"](f(x))())
			})
			o("interchange", function() {
				var u = Stream(function(value) {return value * 2})
				var a = Stream()
				var y = 3

				o(a["fantasy-land/of"](y)["fantasy-land/ap"](u)()).equals(6)
				o(a["fantasy-land/of"](y)["fantasy-land/ap"](u)()).equals(u["fantasy-land/ap"](a["fantasy-land/of"](function(f) {return f(y)}))())
			})
		})
	})
})
