"use strict"

var callAsync = require("../../test-utils/callAsync")
var o = require("../ospec")

new function(o) {
	o = o.new()

	o.spec("ospec", function() {
		o("skipped", function() {
			o(true).equals(false)
		})
		o.only(".only()", function() {
			o(2).equals(2)
		}, true)
	})

	o.run()
}(o)

o.spec("ospec", function() {
	o.spec("sync", function() {
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
	o.spec("async", function() {
		var a = 0, b = 0

		o.before(function(done) {
			callAsync(function() {
				a = 1
				done()
			})
		})
		o.after(function(done) {
			callAsync(function() {
				a = 0
				done()
			})
		})

		o.beforeEach(function(done) {
			callAsync(function() {
				b = 1
				done()
			})
		})
		o.afterEach(function(done) {
			callAsync(function() {
				b = 0
				done()
			})
		})

		o("async hooks", function(done) {
			callAsync(function() {
				var spy = o.spy()
				spy(a)

				o(a).equals(b)
				o(a).equals(1)("a and b should be initialized")

				done()
			})
		})
	})
})
