describe("m.prop()", function () {
	"use strict"

	it("reads correct value", function () {
		var prop = m.prop("test")
		expect(prop()).to.equal("test")
	})

	it("defaults to `undefined`", function () {
		var prop = m.prop()
		expect(prop()).to.be.undefined
	})

	it("sets the correct value", function () {
		var prop = m.prop("test")
		prop("foo")
		expect(prop()).to.equal("foo")
	})

	it("sets `null`", function () {
		var prop = m.prop(null)
		expect(prop()).to.be.null
	})

	it("sets `undefined`", function () {
		var prop = m.prop(undefined)
		expect(prop()).to.be.undefined
	})

	it("returns the new value when set", function () {
		var prop = m.prop()
		expect(prop("foo")).to.equal("foo")
	})

	it("correctly stringifies to the correct value", function () {
		var prop = m.prop("test")
		expect(JSON.stringify(prop)).to.equal('"test"')
	})

	it("correctly stringifies to the correct value as a child", function () {
		var obj = {prop: m.prop("test")}
		expect(JSON.stringify(obj)).to.equal('{"prop":"test"}')
	})

	it("correctly wraps Mithril promises", function () {
		var defer = m.deferred()
		var prop = m.prop(defer.promise)
		defer.resolve("test")

		expect(prop()).to.equal("test")
	})

	it("returns a callable thenable when wrapping a Mithril promise", function () { // eslint-disable-line max-len
		var defer = m.deferred()

		var prop = m.prop(defer.promise).then(function () {
			return "test2"
		})

		defer.resolve("test")

		expect(prop()).to.equal("test2")
	})

	it("provides a way to wrap promises", function () {
		var promise = Promise.resolve()
		var prop = m.prop(promise)
		// `then` is called, so identity doesn't hold.
		expect(prop.promise()).to.be.an.instanceof(Promise)
	})

	it("returns a callable when wrapping a thenable", function () {
		var prop = m.prop(Promise.resolve(2))
		return prop.promise().then(function (value) {
			expect(value).to.equal(2)
		})
	})

	it("returns a callable when `then` is called", function () {
		var promise = Promise.resolve(2)
		var spy = sinon.spy()
		var prop = m.prop(promise).then(spy)

		return prop.promise().then(function (value) {
			expect(spy).to.be.calledWith(2)
			expect(prop()).to.equal(2)
			expect(value).to.equal(2)
		})
	})

	it("returns a callable when `catch` is called", function () {
		var promise = Promise.reject(2)
		var spy = sinon.spy()
		var prop = m.prop(promise).catch(spy)

		return prop.promise().then(function (value) {
			expect(spy).to.be.calledWith(2)
			expect(prop()).to.equal(2)
			expect(value).to.equal(2)
		})
	})

	this.timeout(0)
})
