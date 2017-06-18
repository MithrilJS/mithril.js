"use strict"

var o = require("../../ospec/ospec")
var callAsync = require("../../test-utils/callAsync")
var debouncedAsync = require("../../test-utils/debouncedAsync")

o.spec("debouncedAsync", function() {
	o("works", function(done) {
		var f = o.spy()
		var debF = debouncedAsync(f)
		debF()
		debF()
		o(f.callCount).equals(0)
		callAsync(function(){
			o(f.callCount).equals(1)
		})
		setTimeout(function(){
			o(f.callCount).equals(1)
			done()
		}, 10)
	})
	o("nested calls work", function(done) {
		var f = o.spy()
		var debF = debouncedAsync(f)
		debF()
		o(f.callCount).equals(0)
		callAsync(function(){
			debF()
			o(f.callCount).equals(1)
			callAsync(function() {
				o(f.callCount).equals(2)
			})
		})
		setTimeout(function(){
			o(f.callCount).equals(2)
			done()
		}, 10)
	})
})
