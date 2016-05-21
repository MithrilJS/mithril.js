"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")

var m = require("../../render/hyperscript")
var apiMounter = require("../../api/mount")

o.spec("m.mount", function() {
	var FRAME_BUDGET = 1000 / 60
	var $window, root
	
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
	})
	
	o("updates redraw object", function() {
		var redraw = {}
		var mount = createMounter($window, redraw)
		
		mount(root, {
			view : function() {
				return m("div")
			}
		})
		
		o(typeof redraw.run).equals("function")
	})
	
	o("renders into `root`", function() {
		var mount = createMounter($window, {})
		
		mount(root, {
			view : function() {
				return m("div")
			}
		})
		
		o(root.firstChild.nodeName).equals("DIV")
	})
	
	o("redraws on events", function(done) {
		var onupdate = o.spy()
		var oninit   = o.spy()
		var onclick  = o.spy()
		var mount = createMounter($window, {})
		var e = $window.document.createEvent("MouseEvents")
		
		e.initEvent("click", true, true)
		
		mount(root, {
			view : function() {
				return m("div", {
					oninit   : oninit,
					onupdate : onupdate,
					onclick  : onclick,
				})
			}
		})
		
		root.firstChild.dispatchEvent(e)
		
		o(oninit.callCount).equals(1)
		o(onupdate.callCount).equals(0)
		
		o(onclick.callCount).equals(1)
		o(onclick.this).equals(root.firstChild)
		o(onclick.args[0].type).equals("click")
		o(onclick.args[0].target).equals(root.firstChild)
		
		// Wrapped to give time for the rate-limited redraw to fire
		setTimeout(function() {
			o(onupdate.callCount).equals(1)
			
			done()
		}, FRAME_BUDGET)
	})
	
	 o("redraws on redraw.run()", function(done) {
		var onupdate = o.spy()
		var oninit = o.spy()
		var redraw = {}
		var mount = createMounter($window, redraw)
		
		mount(root, {
			view : function() {
				return m("div", {
					oninit   : oninit,
					onupdate : onupdate
				})
			}
		})
		
		o(oninit.callCount).equals(1)
		o(onupdate.callCount).equals(0)
		
		redraw.run()
		
		// Wrapped to give time for the rate-limited redraw to fire
		setTimeout(function() {
			o(onupdate.callCount).equals(1)
			
			done()
		}, FRAME_BUDGET)
	})
})
