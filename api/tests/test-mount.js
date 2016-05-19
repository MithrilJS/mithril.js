"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var async = require("./async")

var m = require("../../render/hyperscript")
var createMounter = require("../mount")

o.spec("m.mount", function() {
	var $window, root
	
	o.beforeEach(function() {
		$window = domMock()
		async.setTimeout($window)
		root = $window.document.body
	})
	
	o("is a function", function() {
		o(typeof createMounter).equals("function")
	})
	
	o("returns a function after invocation", function() {
		o(typeof createMounter()).equals("function")
	})
	
	o("updates passed in redraw object", function() {
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
		
		redraw.run()
		
		// Wrapped to give time for the rate-limited redraw to fire
		setTimeout(function() {
			o(onupdate.callCount).equals(1)
			
			done()
		}, 20)
	})
	
	o("redraws on events", function(done, timeout) {
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
		
		o(onclick.callCount).equals(1)
		o(onclick.this).equals(root.firstChild)
		o(onclick.args[0].type).equals("click")
		o(onclick.args[0].target).equals(root.firstChild)
		
		// Wrapped to give time for the rate-limited redraw to fire
		setTimeout(function() {
			o(onupdate.callCount).equals(1)
			
			done()
		}, 20)
	})
})
