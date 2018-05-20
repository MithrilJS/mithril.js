/* eslint-disable global-require, no-bitwise, no-process-exit */
"use strict"
;(function(m) {
if (typeof module !== "undefined") module["exports"] = m()
else window.o = m()
})(function init(name) {
	var spec = {}, subjects = [], results, only = null, ctx = spec, start, stack = 0, nextTickish, hasProcess = typeof process === "object", hasOwn = ({}).hasOwnProperty

	if (name != null) spec[name] = ctx = {}

	try {throw new Error} catch (e) {
		var ospecFileName = e.stack && (/[\/\\](.*?):\d+:\d+/).test(e.stack) ? e.stack.match(/[\/\\](.*?):\d+:\d+/)[1] : null
	}
	function o(subject, predicate) {
		if (predicate === undefined) {
			if (results == null) throw new Error("Assertions should not occur outside test definitions")
			return new Assert(subject)
		}
		else if (results == null) {
			ctx[unique(subject)] = predicate
		} else {
			throw new Error("Test definition shouldn't be nested. To group tests use `o.spec()`")
		}
	}
	o.before = hook("__before")
	o.after = hook("__after")
	o.beforeEach = hook("__beforeEach")
	o.afterEach = hook("__afterEach")
	o.new = init
	o.spec = function(subject, predicate) {
		var parent = ctx
		ctx = ctx[unique(subject)] = {}
		predicate()
		ctx = parent
	}
	o.only = function(subject, predicate, silent) {
		if (!silent) {
			console.log(highlight("/!\\ WARNING /!\\ o.only() mode"))
			try {throw new Error} catch (e) {
				console.log(this.cleanStackTrace(e) + "\n")
			}
		}
		o(subject, only = predicate)
	}
	o.spy = function(fn) {
		var spy = function() {
			spy.this = this
			spy.args = [].slice.call(arguments)
			spy.callCount++

			if (fn) return fn.apply(this, arguments)
		}
		if (fn)
			Object.defineProperties(spy, {
				length: {value: fn.length},
				name: {value: fn.name}
			})
		spy.args = []
		spy.callCount = 0
		return spy
	}
	o.cleanStackTrace = function(error) {
		// For IE 10+ in quirks mode, and IE 9- in any mode, errors don't have a stack
		if (error.stack == null) return ""
		var i = 0, header = error.message ? error.name + ": " + error.message : error.name, stack
		// some environments add the name and message to the stack trace
		if (error.stack.indexOf(header) === 0) {
			stack = error.stack.slice(header.length).split(/\r?\n/)
			stack.shift() // drop the initial empty string
		} else {
			stack = error.stack.split(/\r?\n/)
		}
		if (ospecFileName == null) return stack.join("\n")
		// skip ospec-related entries on the stack
		while (stack[i].indexOf(ospecFileName) !== -1) i++
		// now we're in user code
		return stack[i]
	}
	o.run = function(reporter) {
		results = []
		start = new Date
		test(spec, [], [], function() {
			setTimeout(function () {
				if (typeof reporter === "function") reporter(results)
				else {
					var errCount = o.report(results)
					if (hasProcess && errCount !== 0) process.exit(1)
				}
			})
		})

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
				if (cursor === fns.length) return

				var fn = fns[cursor++]
				var timeout = 0, delay = 200, s = new Date
				var isDone = false

				function done(err) {
					if (err) {
						if (err instanceof Error) record(err.message, err)
						else record(String(err))
						subjects.pop()
						next()
					}
					if (timeout !== undefined) {
						timeout = clearTimeout(timeout)
						if (delay !== Infinity) record(null)
						if (!isDone) next()
						else throw new Error("`" + arg + "()` should only be called once")
						isDone = true
					}
					else console.log("# elapsed: " + Math.round(new Date - s) + "ms, expected under " + delay + "ms")
				}

				function startTimer() {
					timeout = setTimeout(function() {
						timeout = undefined
						record("async test timed out")
						next()
					}, Math.min(delay, 2147483647))
				}

				if (fn.length > 0) {
					var body = fn.toString()
					var arg = (body.match(/\(([\w$]+)/) || body.match(/([\w$]+)\s*=>/) || []).pop()
					if (body.indexOf(arg) === body.lastIndexOf(arg)) throw new Error("`" + arg + "()` should be called at least once")
					try {
						fn(done, function(t) {delay = t})
					}
					catch (e) {
						done(e)
					}
					if (timeout === 0) {
						startTimer()
					}
				}
				else {
					var p = fn()
					if (p && p.then) {
						startTimer()
						p.then(function() { done() }, done)
					} else {
						nextTickish(next)
					}
				}
			}
		}
	}
	function unique(subject) {
		if (hasOwn.call(ctx, subject)) {
			console.warn("A test or a spec named `" + subject + "` was already defined")
			while (hasOwn.call(ctx, subject)) subject += "*"
		}
		return subject
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
					if ((!(i in b)) || !deepEqual(a[i], b[i])) return false
				}
				for (var i in b) {
					if (!(i in a)) return false
				}
				return true
			}
			if (a.length === b.length && (a instanceof Array && b instanceof Array || aIsArgs && bIsArgs)) {
				var aKeys = Object.getOwnPropertyNames(a), bKeys = Object.getOwnPropertyNames(b)
				if (aKeys.length !== bKeys.length) return false
				for (var i = 0; i < aKeys.length; i++) {
					if (!hasOwn.call(b, aKeys[i]) || !deepEqual(a[aKeys[i]], b[aKeys[i]])) return false
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
			else record(serialize(this.value) + "\n  " + verb + "\n" + serialize(value))
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
			result.error = error

		}
		results.push(result)
	}
	function serialize(value) {
		if (hasProcess) return require("util").inspect(value)
		if (value === null || (typeof value === "object" && !(value instanceof Array)) || typeof value === "number") return String(value)
		else if (typeof value === "function") return value.name || "<anonymous function>"
		try {return JSON.stringify(value)} catch (e) {return String(value)}
	}
	var colorCodes = {
		red: "31m",
		red2: "31;1m",
		green: "32;1m"
	}
	function highlight(message, color) {
		var code = colorCodes[color] || colorCodes.red;
		return hasProcess ? (process.stdout.isTTY ? "\x1b[" + code + message + "\x1b[0m" : message) : "%c" + message + "%c "
	}
	function cStyle(color, bold) {
		return hasProcess||!color ? "" : "color:"+color+(bold ? ";font-weight:bold" : "")
	}

	o.report = function (results) {
		var errCount = 0
		for (var i = 0, r; r = results[i]; i++) {
			if (!r.pass) {
				var stackTrace = o.cleanStackTrace(r.error)
				console.error(
					(hasProcess ? "\n" : "") +
					highlight(r.context + ":", "red2") + "\n" +
					highlight(r.message, "red") +
					(stackTrace ? "\n" + stackTrace + "\n" : ""),

					cStyle("black", true), "", // reset to default
					cStyle("red"), cStyle("black")
				)
				errCount++
			}
		}
		var pl = results.length === 1 ? "" : "s"
		var resultSummary = (errCount === 0) ?
			highlight((pl ? "All " : "The ") + results.length + " assertion" + pl + " passed", "green"):
			highlight(errCount + " out of " + results.length + " assertion" + pl + " failed", "red2")
		var runningTime = " in " + Math.round(Date.now() - start) + "ms"

		console.log(
			(hasProcess ? "––––––\n" : "") +
			(name ? name + ": " : "") + resultSummary + runningTime,
			cStyle((errCount === 0 ? "green" : "red"), true), ""
		)
		return errCount
	}

	if (hasProcess) {
		nextTickish = process.nextTick
	} else {
		nextTickish = function fakeFastNextTick(next) {
			if (stack++ < 5000) next()
			else setTimeout(next, stack = 0)
		}
	}

	return o
})
