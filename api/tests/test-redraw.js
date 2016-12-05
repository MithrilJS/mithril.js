"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var apiRedraw = require("../../api/redraw")

o.spec("redrawService", function() {
	var root, redrawService, $document
	o.beforeEach(function() {
		var $window = domMock()
		root = $window.document.body
		redrawService = apiRedraw($window)
		$document = $window.document
	})

	o("shouldn't error if there are no renderers", function() {
		redrawService.redraw()
	})

	o("should run a single renderer entry", function(done) {
		var spy = o.spy()

		redrawService.subscribe(root, spy)

		o(spy.callCount).equals(0)
		
		redrawService.redraw()

		o(spy.callCount).equals(1)

		redrawService.redraw()
		redrawService.redraw()
		redrawService.redraw()

		o(spy.callCount).equals(1)
		setTimeout(function() {
			o(spy.callCount).equals(2)
			
			done()
		}, 20)
	})

	o("should run all renderer entries", function(done) {
		var el1 = $document.createElement("div")
		var el2 = $document.createElement("div")
		var el3 = $document.createElement("div")
		var spy1 = o.spy()
		var spy2 = o.spy()
		var spy3 = o.spy()

		redrawService.subscribe(el1, spy1)
		redrawService.subscribe(el2, spy2)
		redrawService.subscribe(el3, spy3)

		redrawService.redraw()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		redrawService.redraw()

		o(spy1.callCount).equals(1)
		o(spy2.callCount).equals(1)
		o(spy3.callCount).equals(1)

		setTimeout(function() {
			o(spy1.callCount).equals(2)
			o(spy2.callCount).equals(2)
			o(spy3.callCount).equals(2)
			
			done()
		}, 20)
	})

	o("should stop running after unsubscribe", function() {
		var spy = o.spy()

		redrawService.subscribe(root, spy)
		redrawService.unsubscribe(root, spy)

		redrawService.redraw()

		o(spy.callCount).equals(0)
	})

	o("does nothing on invalid unsubscribe", function() {
		var spy = o.spy()

		redrawService.subscribe(root, spy)
		redrawService.unsubscribe(null)

		redrawService.redraw()

		o(spy.callCount).equals(1)
	})
})
