"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var throttle = require("../../api/throttle")

o.spec("throttle", function() {
	var FRAME_BUDGET = Math.floor(1000 / 60)
	var spy, throttled
	o.beforeEach(function() {
		spy = o.spy()
		throttled = throttle(spy)
	})
	
	o("runs first call synchronously", function() {
		throttled()
		
		o(spy.callCount).equals(1)
	})
	
	o("throttles subsequent synchronous calls", function(done) {
		throttled()
		throttled()
		
		o(spy.callCount).equals(1)
		
		setTimeout(function() {
			o(spy.callCount).equals(2)
			
			done()
		}, FRAME_BUDGET) //this delay is much higher than 16.6ms due to setTimeout clamp and other runtime costs
	})
	
	o("calls after threshold", function(done) {
		throttled()
		
		o(spy.callCount).equals(1)
		
		setTimeout(function(t) {
			throttled()
			
			o(spy.callCount).equals(2)
			
			done()
		}, FRAME_BUDGET)
		
	})
	
	o("throttles before threshold", function(done) {
		throttled()
		
		o(spy.callCount).equals(1)
			
		callAsync(function(t) {
			throttled()
			
			o(spy.callCount).equals(1)
			
			done()
		})
	})
			
	o("it only runs once per tick", function(done) {
		throttled()
		throttled()
		throttled()
		
		o(spy.callCount).equals(1)
		
		setTimeout(function() {
			o(spy.callCount).equals(2)
			
			done()
		}, FRAME_BUDGET)
	})
	
	o("it supports forcing a synchronous redraw", function() {
		throttled()
		throttled()
		throttled(true)
		
		o(spy.callCount).equals(2)
	})
	
	o("it supports aborting when redraw is falsey", function() {
		throttled({ redraw : false })
		throttled({ redraw : 0 })
		throttled({ redraw : "" })
		
		o(spy.callCount).equals(0)
	})
})
