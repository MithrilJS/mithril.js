"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")

var coreRenderer = require("../../render/render")
var apiPubSub = require("../../api/pubsub")
var autoredraw = require("../../api/autoredraw")

o.spec("autoredraw", function() {
	var FRAME_BUDGET = Math.floor(1000 / 60)
	var $window, root, renderer, pubsub, spy
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
		renderer = coreRenderer($window)
		pubsub = apiPubSub()
		spy = o.spy()
	})
	
	o("returns self-trigger", function() {
		var run = autoredraw(root, renderer, pubsub, spy)
		
		run()
		
		o(spy.callCount).equals(1)
	})
	
	o("null renderer doesn't throw", function(done) {
		autoredraw(root, null, pubsub, spy)
		done()
	})
	
	o("null pubsub doesn't throw", function(done) {
		autoredraw(root, renderer, null, spy)
		done()
	})
	
	o("registers onevent", function() {
		autoredraw(root, renderer, pubsub, spy)
		
		renderer.render(root, {tag: "div", attrs: {onclick: function() {}}})
		
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		root.firstChild.dispatchEvent(e)
		
		o(spy.callCount).equals(1)
	})
	
	o("registers pubsub", function() {
		autoredraw(root, renderer, pubsub, spy)
		
		pubsub.publish()
		
		o(spy.callCount).equals(1)
	})
	
	o("re-registering pubsub works", function() {
		autoredraw(root, renderer, pubsub, spy)
		autoredraw(root, renderer, pubsub, spy)
		
		pubsub.publish()
		
		o(spy.callCount).equals(1)
	})
	
	o("throttles", function(done) {
		var run = autoredraw(root, renderer, pubsub, spy)
		
		run()
		run()
		
		o(spy.callCount).equals(1)
		
		setTimeout(function() {
			o(spy.callCount).equals(2)
			
			done()
		}, FRAME_BUDGET)
	})
	
	o("does not redraw if e.redraw is false", function() {
		autoredraw(root, renderer, pubsub, spy)
		
		renderer.render(root, {tag: "div", attrs: {onclick: function(e) {e.redraw = false}}})
		
		var e = $window.document.createEvent("MouseEvents")
		e.initEvent("click", true, true)
		root.firstChild.dispatchEvent(e)
		
		o(spy.callCount).equals(0)
	})
	
})