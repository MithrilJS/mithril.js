"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var async = require("./async")

var limiter = require("../limiter")

o.spec("fps limiter", function() {
	var $window, root

	[
		"setTimeout",
		"requestAnimationFrame",
	].forEach(function(type) {
		o.spec(type, function() {
			o.beforeEach(function() {
				$window = domMock()
				
				async[type]($window)
			})
			
			o("is a function", function() {
				o(typeof limiter).equals("function")
			})
			
			o("it returns a function", function() {
				o(typeof limiter($window, false)).equals("function")
			})
			
			o("it runs synchronously the first time", function() {
				var spy = o.spy()
				var run = limiter($window, spy)
				
				run()
				
				o(spy.callCount).equals(1)
			})
			
			o("it only runs once per tick", function(done) {
				var spy = o.spy()
				var run = limiter($window, spy)
				
				run()
				run()
				run()
				
				o(spy.callCount).equals(1)
				
				setTimeout(function() {
					o(spy.callCount).equals(2)
					
					done()
				}, 17)
			})
			
			o("it supports forcing a synchronous redraw", function() {
				var spy = o.spy()
				var run = limiter($window, spy)
				
				run()
				run()
				run(true)
				
				o(spy.callCount).equals(2)
			})
		})
	})
})
