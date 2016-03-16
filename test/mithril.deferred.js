describe("m.deferred()", function () {
	"use strict"

	// Let unchecked exceptions bubble up in order to allow meaningful error
	// messages in common cases like null reference exceptions due to typos.
	// An unchecked exception is defined as an object that is a subclass of
	// Error (but not a direct instance of Error itself) - basically anything
	// that can be thrown without an explicit `throw` keyword and that we'd
	// never want to programmatically manipulate. In other words, an unchecked
	// error is one where we only care about its line number and where the only
	// reasonable way to deal with it is to change the buggy source code that
	// caused the error to be thrown in the first place.
	//
	// By contrast, a checked exception is defined as anything that is
	// explicitly thrown via the `throw` keyword and that can be
	// programmatically handled, for example to display a validation error
	// message on the UI. If an exception is a subclass of Error for whatever
	// reason, but it is meant to be handled as a checked exception (i.e.
	// follow the rejection rules for A+), it can be rethrown as an instance
	// of Error.
	//
	// This implementation deviates from the Promises/A+ spec in two ways:
	//
	// 1) A+ requires the `then` callback to be called asynchronously (this
	//    requires a setImmediate polyfill, which cannot be implemented in a
	//    reasonable way for Mithril's purpose - the possible polyfills are
	//    either too big or too slow). This implementation calls the `then`
	//    callback synchronously.
	// 2) A+ swallows exceptions in a unrethrowable way, i.e. it's not possible
	//    to see default error messages on the console for runtime errors thrown
	//    from within a promise chain. This throws such checked exceptions.

	it("exists", function () {
		expect(m.deferred).to.be.a("function")
	})

	it("resolves values", function () {
		var value = m.prop()
		var deferred = m.deferred()

		deferred.promise.then(value)
		deferred.resolve("test")

		expect(value()).to.equal("test")
	})

	it("resolves values returned in `then` method", function () {
		var value = m.prop()
		var deferred = m.deferred()

		deferred.promise
		.then(function () { return "foo" })
		.then(value)
		deferred.resolve("test")

		expect(value()).to.equal("foo")
	})

	it("passes rejections through second `then` handler", function () {
		var obj = {}
		var value1 = m.prop(obj)
		var value2 = m.prop(obj)
		var deferred = m.deferred()

		deferred.promise.then(value1, value2)
		deferred.reject("test")

		expect(value1()).to.equal(obj)
		expect(value2()).to.equal("test")
	})

	it("passes rejections through `catch`", function () {
		var value = m.prop()
		var deferred = m.deferred()

		deferred.promise.catch(value)
		deferred.reject("test")

		expect(value()).to.equal("test")
	})

	it("can resolve from a `then` rejection handler", function () {
		var value = m.prop()
		var deferred = m.deferred()

		deferred.promise
		.then(null, function () { return "foo" })
		.then(value)
		deferred.reject("test")

		expect(value()).to.equal("foo")
	})

	it("can resolve from a `catch`", function () {
		var value = m.prop()
		var deferred = m.deferred()

		deferred.promise
		.catch(function () { return "foo" })
		.then(value)
		deferred.reject("test")

		expect(value()).to.equal("foo")
	})

	it("can reject by throwing an `Error`", function () {
		var value1 = m.prop()
		var value2 = m.prop()
		var deferred = m.deferred()

		deferred.promise
		.then(function () { throw new Error() })
		.then(value1, value2)
		deferred.resolve("test")

		expect(value1()).to.not.exist
		expect(value2()).to.be.an("error")
	})

	it("synchronously throws subclasses of Errors on creation", function () {
		expect(function () {
			m.deferred().reject(new TypeError())
		}).to.throw()
	})

	it("synchronously throws subclasses of Errors thrown from its `then` fufill handler", function () { // eslint-disable-line
		expect(function () {
			var deferred = m.deferred()
			deferred.promise.then(function () { throw new TypeError() })
			deferred.resolve()
		}).to.throw()
	})

	it("synchronously throws subclasses of Errors thrown from its `then` rejection handler", function () { // eslint-disable-line
		expect(function () {
			var deferred = m.deferred()
			deferred.promise.then(null, function () { throw new TypeError() })
			deferred.reject("test")
		}).to.throw()
	})

	it("synchronously throws subclasses of Errors thrown from its `catch` method", function () { // eslint-disable-line
		expect(function () {
			var deferred = m.deferred()
			deferred.promise.catch(function () { throw new TypeError() })
			deferred.reject("test")
		}).to.throw()
	})

	it("unwraps other thenables, and returns the correct values in the chain", function () { // eslint-disable-line
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()
		var value1, value2
		deferred1.promise.then(function (data) {
			value1 = data
			return deferred2.promise
		}).then(function (data) {
			value2 = data
		})
		deferred1.resolve(1)
		deferred2.resolve(2)
		expect(value1).to.equal(1)
		expect(value2).to.equal(2)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("propogates returns with `then` after being resolved", function () {
		var deferred = m.deferred()
		var value = m.prop()
		deferred.resolve(1)
		deferred.promise.then(value)
		expect(value()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("propogates errors with `then` after being rejected", function () {
		var deferred = m.deferred()
		var value = m.prop()
		deferred.reject(1)
		deferred.promise.then(null, value)
		expect(value()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("can only be resolved once before being chained", function () {
		var deferred = m.deferred()
		var value = m.prop()
		deferred.resolve(1)
		deferred.resolve(2)
		deferred.promise.then(value)
		expect(value()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("can only be resolved once after being chained", function () {
		var deferred = m.deferred()
		var value = m.prop()
		deferred.promise.then(value)
		deferred.resolve(1)
		deferred.resolve(2)
		expect(value()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("can't be rejected after being resolved", function () {
		var deferred = m.deferred()
		var value1 = m.prop()
		var value2 = m.prop()
		deferred.promise.then(value1, value2)
		deferred.resolve(1)
		deferred.reject(2)
		expect(value1()).to.equal(1)
		expect(value2()).to.not.exist
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("can't be resolved after being rejected", function () {
		var deferred = m.deferred()
		var value1 = m.prop()
		var value2 = m.prop()
		deferred.promise.then(value1, value2)
		deferred.reject(1)
		deferred.resolve(2)
		expect(value1()).to.not.exist
		expect(value2()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("can only be rejected once before being chained", function () {
		var deferred = m.deferred()
		var value = m.prop()
		deferred.reject(1)
		deferred.reject(2)
		deferred.promise.then(null, value)
		expect(value()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/80
	it("can only be rejected once after being chained", function () {
		var deferred = m.deferred()
		var value = m.prop()
		deferred.promise.then(null, value)
		deferred.reject(1)
		deferred.reject(2)
		expect(value()).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/85
	it("calls resolution handler when resolved with `undefined`", function () {
		var deferred = m.deferred()
		var value
		deferred.resolve()
		deferred.promise.then(function () {
			value = 1
		})
		expect(value).to.equal(1)
	})

	// https://github.com/lhorie/mithril.js/issues/85
	it("calls rejection handler when rejected with `undefined`", function () {
		var deferred = m.deferred()
		var value
		deferred.reject()
		deferred.promise.then(null, function () {
			value = 1
		})
		expect(value).to.equal(1)
	})

	it("immediately resolves promise with `resolve` method", function () {
		var deferred = m.deferred()
		deferred.resolve(1)
		expect(deferred.promise()).to.equal(1)
	})

	it("gets chained promise value when called", function () {
		var deferred = m.deferred()
		var promise = deferred.promise.then(function (data) { return data + 1 })
		deferred.resolve(1)
		expect(promise()).to.equal(2)
	})

	it("returns `undefined` from call if it's rejected", function () {
		var deferred = m.deferred()
		deferred.reject(1)
		expect(deferred.promise()).to.be.undefined
	})

	it("resolves to value of returned promise", function () {
		var prmA = m.deferred()
		var prmB = m.deferred()

		prmA.resolve("A")
		prmB.resolve("B")

		prmA.promise.then(function () {
			return prmB.promise
		}).then(function (B) {
			expect(B).to.equal("B")
		})
	})

	it("yields immutable promises", function () {
		var d = m.deferred()
		d.resolve(5)
		d.resolve(6)
		d.promise.then(function (v) {
			expect(v).to.equal(5)
		})
	})
})
