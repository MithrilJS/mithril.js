describe("m.sync()", function () {
	"use strict"

	it("exists", function () {
		expect(m.sync).to.be.a("function")
	})

	it("joins multiple promises in order to an array", function () {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()

		m.sync([deferred1.promise, deferred2.promise])
		.then(function (data) { value = data })

		deferred1.resolve("test")
		deferred2.resolve("foo")

		expect(value).to.eql(["test", "foo"])
	})

	it("joins multiple promises out of order to an array", function () {
		var value
		var deferred1 = m.deferred()
		var deferred2 = m.deferred()

		m.sync([deferred1.promise, deferred2.promise])
		.then(function (data) { value = data })

		deferred2.resolve("foo")
		deferred1.resolve("test")

		expect(value).to.eql(["test", "foo"])
	})

	// FIXME: bad behavior?
	it("rejects to an array if one promise rejects", function () {
		var value
		var deferred = m.deferred()
		m.sync([deferred.promise]).catch(function (data) { value = data })
		deferred.reject("fail")
		expect(value).to.eql(["fail"])
	})

	it("resolves immediately if given an empty array", function () {
		var value = 1
		m.sync([]).then(function () { value = 2 })
		expect(value).to.equal(2)
	})

	it("resolves to an empty array if given an empty array", function () {
		var value
		m.sync([]).then(function (data) { value = data })
		expect(value).to.eql([])
	})
})
