"use strict"

var callAsync = require("../../test-utils/callAsync")
var o = require("../ospec")

o.spec("ospec", function() {
	o.spec("core", function() {
		var a = 0, b = 0, illegalAssertionThrows = false

		o.before(function() {a = 1})
		o.after(function() {a = 0})

		o.beforeEach(function() {b = 1})
		o.afterEach(function() {b = 0})

		try {o("illegal assertion")} catch (e) {illegalAssertionThrows = true}

		o("assertions", function() {
			var nestedTestDeclarationThrows = false
			try {o("illegal nested test", function(){})} catch (e) {nestedTestDeclarationThrows = true}

			o(illegalAssertionThrows).equals(true)
			o(nestedTestDeclarationThrows).equals(true)

			var spy = o.spy()
			spy(a)

			o(a).equals(b)
			o(a).notEquals(2)
			o({a: [1, 2], b: 3}).deepEquals({a: [1, 2], b: 3})
			o([{a: 1, b: 2}, {c: 3}]).deepEquals([{a: 1, b: 2}, {c: 3}])

			var undef1 = {undef: void 0}
			var undef2 = {UNDEF: void 0}

			o(undef1).notDeepEquals(undef2)
			o(undef1).notDeepEquals({})
			o({}).notDeepEquals(undef1)

			var sparse1 = [void 1, void 2, void 3]
			delete sparse1[0]
			var sparse2 = [void 1, void 2, void 3]
			delete sparse2[1]

			o(sparse1).notDeepEquals(sparse2)

			var monkeypatch1 = [1, 2]
			monkeypatch1.field = 3
			var monkeypatch2 = [1, 2]
			monkeypatch2.field = 4

			o(monkeypatch1).notDeepEquals([1, 2])
			o(monkeypatch1).notDeepEquals(monkeypatch2)

			monkeypatch2.field = 3
			o(monkeypatch1).deepEquals(monkeypatch2)

			monkeypatch1.undef = undefined
			monkeypatch2.UNDEF = undefined

			o(monkeypatch1).notDeepEquals(monkeypatch2)

			var values = ["a", "", 1, 0, true, false, null, undefined, Date(0), ["a"], [], function() {return arguments}.call(), new Uint8Array(), {a: 1}, {}]
			for (var i = 0; i < values.length; i++) {
				for (var j = 0; j < values.length; j++) {
					if (i === j) o(values[i]).deepEquals(values[j])
					else o(values[i]).notDeepEquals(values[j])
				}
			}

			o(spy.callCount).equals(1)
			o(spy.args.length).equals(1)
			o(spy.args[0]).equals(1)
		})

		o("spy wrapping", function() {
			var spy = o.spy(function view(vnode){
				this.drawn = true

				return {tag: "div", children: vnode.children}
			})
			var children = [""]
			var state = {}

			var output = spy.call(state, {children: children})

			o(spy.length).equals(1)
			o(spy.name).equals("view")
			o(spy.callCount).equals(1)
			o(spy.args.length).equals(1)
			o(spy.args[0]).deepEquals({children: children})
			o(state).deepEquals({drawn: true})
			o(output).deepEquals({tag: "div", children: children})
		})
	})

	o.spec(".only()", function () {
		var clone = o.new()

		clone("skipped", function () {
			clone(true).equals(false)
		})

		clone.only("prevents other tests in the suite executing", function () {
		}, true)

		clone.run()
	})

	o.spec("async 'done' argument", function () {
		o("in test callback", function (done) {
			var a = 0

			callAsync(function () {
				a = 1

				o(a).equals(1)("defer test resolution")

				done()
			})
		});

		o.spec("in hooks", function () {
			var a = 0, b = 0

			o.before(function (done) {
				callAsync(function () {
					a = 1
					done()
				})
			})
			o.after(function (done) {
				callAsync(function () {
					a = 0
					done()
				})
			})

			o.beforeEach(function (done) {
				callAsync(function () {
					b = 1
					done()
				})
			})
			o.afterEach(function (done) {
				callAsync(function () {
					b = 0
					done()
				})
			})

			o("defer test execution", function () {
				o(a).equals(b)
				o(a).equals(1)
			})
		})

		o.spec("won't timeout", function () {
			o("by default, before 20ms", function (done) {
				setTimeout(done, 10)
			})

			o("if it is resolves before the specified timeout", function (done, timeout) {
				timeout(40)

				setTimeout(done, 30)
			})
		})

		o("will timeout", function (done, timeout) {
			timeout(100)

			var clone = o.new()

			clone("by default, after 20ms", function (done) {
				setTimeout(done, 30)
			})

			clone("if it is resolves after the specified timeout", function (done, timeout) {
				timeout(40)

				setTimeout(done, 50)
			})

			clone.run(function(results){
				o(results.every(function(report){return report.pass === true}))

				done()
			})
		})
	})

	// Predicate test passing on clone results
	o.spec("reporting", function () {
		var clone = o.new()

		clone.spec("clone", function () {
			clone("fail", function () {
				clone(true).equals(false)
			})

			clone("pass", function () {
				clone(true).equals(true)
			})
		})

		o("reports per instance", function () {
			clone.run(function (results) {
				o(typeof results).equals("object")
				o("length" in results).equals(true)
				o(results.length).equals(2)("Two results")

				o("error" in results[0] && "pass" in results[0]).equals(true)("error and pass keys present in failing result")
				o(!("error" in results[1]) && "pass" in results[1]).equals(true)("only pass key present in passing result")
				o(results[0].pass).equals(false)("Test meant to fail has failed")
				o(results[1].pass).equals(true)("Test meant to pass has passed")
			})
		})

		o("o.report() returns the number of failures", function () {
			var log = console.log, error = console.error
			console.log = o.spy()
			console.error = o.spy()

			function makeError(msg) { try { throw msg ? new Error(msg) : new Error } catch (e) { return e } }
			try {
				var errCount = o.report([{ pass: true }, { pass: true }])

				o(errCount).equals(0)
				o(console.log.callCount).equals(1)
				o(console.error.callCount).equals(0)

				errCount = o.report([
					{ pass: false, error: makeError("hey"), message: "hey" }
				])

				o(errCount).equals(1)
				o(console.log.callCount).equals(2)
				o(console.error.callCount).equals(1)

				errCount = o.report([
					{ pass: false, error: makeError("hey"), message: "hey" },
					{ pass: true },
					{ pass: false, error: makeError("ho"), message: "ho" }
				])

				o(errCount).equals(2)
				o(console.log.callCount).equals(3)
				o(console.error.callCount).equals(3)
			} catch (e) {
				o(1).equals(0)("Error while testing the reporter")
			}

			console.log = log
			console.error = error
		})
	})

	o.spec("stack trace cleaner", function() {
		o("handles line breaks", function() {
			try {
				throw new Error("line\nbreak")
			} catch(error) {
				var trace = o.cleanStackTrace(error)
				o(trace).notEquals("break")
				o(trace.includes("test-ospec.js")).equals(true)
			}
		})
	})
})
