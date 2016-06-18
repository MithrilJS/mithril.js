"use strict"

module.exports = new function init() {
	var spec = {}, subjects = [], results = [], only = null, ctx = spec, start, stack = 0, hasProcess = typeof process === "object"

	function o(subject, predicate) {
		ctx[subject] = predicate
		if (predicate === undefined) return new Assert(subject)
	}
	o.before = hook("__before")
	o.after = hook("__after")
	o.beforeEach = hook("__beforeEach")
	o.afterEach = hook("__afterEach")
	o.new = init
	o.spec = function(subject, predicate) {
		var parent = ctx
		ctx = ctx[subject] = {}
		predicate()
		ctx = parent
	}
	o.only = function(subject, predicate) {o(subject, only = predicate)}
	o.spy = function() {
		var spy = function() {
			spy.this = this
			spy.args = [].slice.call(arguments)
			spy.callCount++
		}
		spy.args = []
		spy.callCount = 0
		return spy
	}
	o.run = function() {
		start = new Date
		test(spec, [], [], report)

		function test(spec, pre, post, finalize) {
			pre = [].concat(pre, spec["__beforeEach"] || [])
			post = [].concat(spec["__afterEach"] || [], post)
			series([].concat(spec["__before"] || [], Object.keys(spec).map(function(key) {
				return function(done, timeout) {
					timeout(Infinity)

					if (key.slice(0, 2) === "__") return done()
					if (only !== null && spec[key] !== only && typeof only === typeof spec[key]) return done()
					subjects.push(key)
					var type = typeof spec[key]
					if (type === "object") test(spec[key], pre, post, pop)
					if (type === "function") series([].concat(pre, spec[key], post, pop))

					function pop() {
						subjects.pop()
						done()
					}
				}
			}), spec["__after"] || [], finalize))
		}

		function series(fns) {
			var cursor = 0
			next()

			function next() {
				stack++
				if (cursor === fns.length) return

				var fn = fns[cursor++]
				if (fn.length > 0) {
					var timeout = 0, delay = 40, s = new Date
					var isDone = false
					var body = fn.toString()
					var arg = (body.match(/\(([\w_$]+)/) || body.match(/([\w_$]+)\s*=>/) || []).pop()
					if (body.indexOf(arg) === body.lastIndexOf(arg)) throw new Error("`" + arg + "()` should be called at least once")
					try {
						fn(function done() {
							if (timeout !== undefined) {
								timeout = clearTimeout(timeout)
								if (delay !== Infinity) record(null)
								if (!isDone) next()
								else throw new Error("`" + arg + "()` should only be called once")
								isDone = true
							}
							else console.log("# elapsed: " + Math.round(new Date - s) + "ms, expected under " + delay + "ms")
						}, function(t) {delay = t})
					}
					catch (e) {
						record(e.message, e)
						next()
					}
					if (timeout === 0) {
						timeout = setTimeout(function() {
							timeout = undefined
							record("async test timed out")
							next()
						}, Math.min(delay, 2147483647))
					}
				}
				else {
					fn()
					if (stack < 5000) next()
					else (hasProcess ? process.nextTick : setTimeout)(next, stack = 0)
				}
			}
		}
	}
	function hook(name) {
		return function(predicate) {
			if (ctx[name]) throw new Error("This hook should be defined outside of a loop or inside a nested test group:\n" + predicate)
			ctx[name] = predicate
		}
	}

	define("equals", "should equal", function(a, b) {return a === b})
	define("notEquals", "should not equal", function(a, b) {return a !== b})
	define("deepEquals", "should deep equal", deepEqual)
	define("notDeepEquals", "should not deep equal", function(a, b) {return !deepEqual(a, b)})

	function isArguments(a) {
		if ("callee" in a) {
			for (var i in a) if (i === "callee") return false
			return true
		}
	}
	function deepEqual(a, b) {
		if (a === b) return true
		if (a === null ^ b === null || a === undefined ^ b === undefined) return false
		if (typeof a === "object" && typeof b === "object") {
			var aIsArgs = isArguments(a), bIsArgs = isArguments(b)
			if (a.constructor === Object && b.constructor === Object && !aIsArgs && !bIsArgs) {
				for (var i in a) {
					if (!deepEqual(a[i], b[i])) return false
				}
				for (var i in b) {
					if (!(i in a)) return false
				}
				return true
			}
			if (a.length === b.length && (a instanceof Array && b instanceof Array || aIsArgs && bIsArgs)) {
				for (var i = 0; i < a.length; i++) {
					if (!deepEqual(a[i], b[i])) return false
				}
				return true
			}
			if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
			if (typeof Buffer === "function" && a instanceof Buffer && b instanceof Buffer) {
				for (var i = 0; i < a.length; i++) {
					if (a[i] !== b[i]) return false
				}
				return true
			}
			if (a.valueOf() === b.valueOf()) return true
		}
		return false
	}

	function Assert(value) {this.value = value}
	function define(name, verb, compare) {
		Assert.prototype[name] = function assert(value) {
			if (compare(this.value, value)) record(null)
			else record(serialize(this.value) + " " + verb + " " + serialize(value))
			return function(message) {
				var result = results[results.length - 1]
				result.message = message + "\n\n" + result.message
			}
		}
	}
	function record(message, error) {
		var result = {pass: message === null}
		if (result.pass === false) {
			if (error == null) {
				error = new Error
				if (error.stack === undefined) new function() {try {throw error} catch (e) {error = e}}
			}
			result.context = subjects.join(" > ")
			result.message = message
			result.error = error.stack
		}
		results.push(result)
	}
	function serialize(value) {
		if (value === null || typeof value === "object") return String(value)
		else if (typeof value === "function") return value.name || "<anonymous function>"
		try {return JSON.stringify(value)} catch (e) {return String(value)}
	}
	function highlight(message) {
		return hasProcess ? "\x1b[31m" + message + "\x1b[0m" : "%c" + message + "%c "
	}

	function report() {
		var status = 0
		for (var i = 0, r; r = results[i]; i++) {
			if (!r.pass) {
				var stackTrace = r.error.match(/^(?:(?!Error|[\/\\]ospec[\/\\]ospec\.js).)*$/m)
				console.error(r.context + ": " + highlight(r.message) + (stackTrace ? "\n\n" + stackTrace + "\n\n" : ""), hasProcess ? "" : "color:red", hasProcess ? "" : "color:black")
				status = 1
			}
		}
		console.log(results.length + " assertions completed in " + Math.round(new Date - start) + "ms")
		if (hasProcess && status === 1) process.exit(1)
	}

	return o
}
