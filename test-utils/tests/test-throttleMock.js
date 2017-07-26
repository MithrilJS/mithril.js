"use strict"

var o = require("../../ospec/ospec")
var throttleMocker = require("../../test-utils/throttleMock")

o.spec("throttleMock", function() {
	o("works with one callback", function() {
		var throttleMock = throttleMocker()
		var spy = o.spy()

		o(throttleMock.queueLength()).equals(0)

		var throttled = throttleMock.throttle(spy)

		o(throttleMock.queueLength()).equals(0)
		o(spy.callCount).equals(0)

		throttled()

		o(throttleMock.queueLength()).equals(1)
		o(spy.callCount).equals(0)

		throttled()

		o(throttleMock.queueLength()).equals(1)
		o(spy.callCount).equals(0)

		throttleMock.fire()

		o(throttleMock.queueLength()).equals(0)
		o(spy.callCount).equals(1)

		throttleMock.fire()

		o(spy.callCount).equals(1)
	})
	o("works with two callbacks", function() {
		var throttleMock = throttleMocker()
		var spy1 = o.spy()
		var spy2 = o.spy()

		o(throttleMock.queueLength()).equals(0)

		var throttled1 = throttleMock.throttle(spy1)

		o(throttleMock.queueLength()).equals(0)
		o(spy1.callCount).equals(0)
		o(spy2.callCount).equals(0)

		throttled1()

		o(throttleMock.queueLength()).equals(1)
		o(spy1.callCount).equals(0)
		o(spy2.callCount).equals(0)

		throttled1()

		o(throttleMock.queueLength()).equals(1)
		o(spy1.callCount).equals(0)
		o(spy2.callCount).equals(0)

		var throttled2 = throttleMock.throttle(spy2)

		o(throttleMock.queueLength()).equals(1)
		o(spy1.callCount).equals(0)
		o(spy2.callCount).equals(0)

		throttled2()

		o(throttleMock.queueLength()).equals(2)
		o(spy1.callCount).equals(0)
		o(spy2.callCount).equals(0)

		throttled2()

		o(throttleMock.queueLength()).equals(2)
		o(spy1.callCount).equals(0)
		o(spy2.callCount).equals(0)

		throttleMock.fire()

		o(throttleMock.queueLength()).equals(0)
		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)

		throttleMock.fire()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
	})
})
