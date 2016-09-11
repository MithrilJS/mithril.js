describe("m.withAttr()", function () {
	"use strict"

	it("calls the handler with the right value/context without callbackThis", function () { // eslint-disable-line
		var spy = sinon.spy()
		var object = {}
		m.withAttr("test", spy).call(object, {currentTarget: {test: "foo"}})
		expect(spy).to.be.calledOn(object).and.calledWith("foo")
	})

	it("calls the handler with the right value/context with callbackThis", function () { // eslint-disable-line
		var spy = sinon.spy()
		var object = {}
		m.withAttr("test", spy, object)({currentTarget: {test: "foo"}})
		expect(spy).to.be.calledOn(object).and.calledWith("foo")
	})
})
