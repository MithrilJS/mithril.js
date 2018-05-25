/* eslint-disable global-require, no-bitwise, no-process-exit */
"use strict"
;(function(m) {
if (typeof module !== "undefined") module["exports"] = m()
else window.o = m()
})(function init(name) {
	var spec = {}, subjects = [], results, only = null, ctx = spec, start, stack = 0, nextTickish, hasProcess = typeof process === "object", hasOwn = ({}).hasOwnProperty
	var ospecFileName = getStackName(ensureStackTrace(new Error), /[\/\\](.*?):\d+:\d+/), timeoutStackName
	var globalTimeout = noTimeoutRightNow
	if (name != null) spec[name] = ctx = {}

	function o(subject, predicate) {
		if (predicate === undefined) {
			if (results == null) throw new Error("Assertions should not occur outside test definitions")
			return new Assert(subject)
		}
		else if (results == null) {
			ctx[unique(subject)] = new Task(predicate, ensureStackTrace(new Error))
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
				console.log(o.cleanStackTrace(e) + "\n")
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
		while (stack[i] != null && stack[i].indexOf(ospecFileName) !== -1) i++
		// now we're in user code (or past the stack end)
		return stack[i]
	}
	o.timeout = function(n) {
		globalTimeout(n)
	}
	o.run = function(reporter) {
		results = []
		start = new Date
		test(spec, [], [], new Task(function() {
			setTimeout(function () {
				timeoutStackName = getStackName({stack: o.cleanStackTrace(ensureStackTrace(new Error))}, /([\w \.]+?:\d+:\d+)/)
				if (typeof reporter === "function") reporter(results)
				else {
					var errCount = o.report(results)
					if (hasProcess && errCount !== 0) process.exit(1)
				}
			})
		}, null))

		function test(spec, pre, post, finalize) {
			pre = [].concat(pre, spec["__beforeEach"] || [])
			post = [].concat(spec["__afterEach"] || [], post)
			series([].concat(spec["__before"] || [], Object.keys(spec).map(function(key) {
				return new Task(function(done, timeout) {
					timeout(Infinity)
					if (key.slice(0, 2) === "__") return done()
					if (only !== null && spec[key].fn !== only && spec[key] instanceof Task) return done()

					subjects.push(key)
					var pop = new Task(function pop() {
						subjects.pop()
						done()
					}, null)

					if (spec[key] instanceof Task) series([].concat(pre, spec[key], post, pop))
					else test(spec[key], pre, post, pop)

				}, null)
			}), spec["__after"] || [], finalize))
		}

		function series(tasks) {
			var cursor = 0
			next()

			function next() {
				if (cursor === tasks.length) return

				var task = tasks[cursor++]
				var current = cursor
				var fn = task.fn
				var timeout = 0, delay = 200, s = new Date
				var arg

				globalTimeout = setDelay

				var isDone = false
				// public API, may only be called once from use code (or after returned Promise resolution)
				function done(err) {
					if (!isDone) isDone = true
					else throw new Error("`" + arg + "()` should only be called once")

					if (timeout === undefined) console.warn("# elapsed: " + Math.round(new Date - s) + "ms, expected under " + delay + "ms\n" + o.cleanStackTrace(task.err))
					finalizeAsync(err)
				}
				// for internal use only
				function finalizeAsync(err) {
					if (err) {
						if (err instanceof Error) record(err.message, err, task.err)
						else record(String(err), null, task.err)
					}
					if (timeout !== undefined) timeout = clearTimeout(timeout)
					if (current === cursor) next()
				}
				function startTimer() {
					timeout = setTimeout(function() {
						timeout = undefined
						finalizeAsync("async test timed out")
					}, Math.min(delay, 2147483647))
				}

				function setDelay (t) {delay = t}

				if (fn.length > 0) {
					var body = fn.toString()
					arg = (body.match(/\(([\w$]+)/) || body.match(/([\w$]+)\s*=>/) || []).pop()
					if (body.indexOf(arg) === body.lastIndexOf(arg)) throw new Error("`" + arg + "()` should be called at least once")
					try {
						fn(done, setDelay)
					}
					catch (e) {
						finalizeAsync(e)
					}
					if (timeout === 0) {
						startTimer()
					}
				} else {
					var p = fn()
					if (p && p.then) {
						startTimer()
						p.then(function() { done() }, done)
					} else {
						nextTickish(next)
					}
				}
				globalTimeout = noTimeoutRightNow
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
			ctx[name] = new Task(predicate, ensureStackTrace(new Error))
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
	function Task(fn, err) {this.fn = fn, this.err = err}
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
	function record(message, error, fallbackError) {
		var result = {pass: message === null}
		if (result.pass === false) {
			result.context = subjects.join(" > ")
			result.message = message
			result.error = error != null ? error : ensureStackTrace(new Error)
			result.fallbackError = fallbackError
		}
		results.push(result)
	}
	function serialize(value) {
		if (hasProcess) return require("util").inspect(value)
		if (value === null || (typeof value === "object" && !(value instanceof Array)) || typeof value === "number") return String(value)
		else if (typeof value === "function") return value.name || "<anonymous function>"
		try {return JSON.stringify(value)} catch (e) {return String(value)}
	}
	function noTimeoutRightNow() {
		throw new Error("o.timeout must be called snchronously from within a test definition or a hook")
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
	function ensureStackTrace(error) {
		// mandatory to get a stack in IE 10 and 11 (and maybe other envs?)
		if (error.stack === undefined) try { throw error } catch(e) {return e}
		else return error
	}
	function getStackName(e, exp) {
		return e.stack && exp.test(e.stack) ? e.stack.match(exp)[1] : null
	}

	o.report = function (results) {
		var errCount = 0
		for (var i = 0, r; r = results[i]; i++) {
			if (!r.pass) {
				var stackTrace = o.cleanStackTrace(r.error)
				var couldHaveABetterStackTrace = !stackTrace || timeoutStackName != null && stackTrace.indexOf(timeoutStackName) !== -1
				if (couldHaveABetterStackTrace) stackTrace = r.fallbackError != null ? o.cleanStackTrace(r.fallbackError) : r.error.stack || ""
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
