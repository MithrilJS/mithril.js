"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")

var m = require("../../render/hyperscript")
var apiMounter = require("../../api/mount")

o.spec("m.mount", function() {
	var FRAME_BUDGET = 1000 / 60
	var $window, root, mount, renderers
	
	o.beforeEach(function() {
		$window = domMock()
		
		root = $window.document.body
		
		renderers = []
		mount = createMounter($window, renderers)
	})
	
	o("pushes a render function", function() {
		mount(root, {
			view : function() {
				return m("div")
			}
		})
		
		o(renderers.length).equals(1)
		o(typeof renderers[0]).equals("function")
	})
	
	o("renders into `root`", function() {
		var mount = createMounter($window, [])
		
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
	
	o("event handlers can skip redraw", function(done) {
		var onupdate = o.spy()
		var oninit   = o.spy()
		var e = $window.document.createEvent("MouseEvents")
		
		e.initEvent("click", true, true)
		
		mount(root, {
			view: function() {
				return m("div", {
					oninit: oninit,
					onupdate: onupdate,
					onclick: function(e) {
						e.redraw = false
					}
				})
			}
		})
		
		root.firstChild.dispatchEvent(e)
		
		o(oninit.callCount).equals(1)
		
		// Wrapped to ensure no redraw fired
		setTimeout(function() {
			o(onupdate.callCount).equals(0)
			
			done()
		}, 20)
	})
	
	 o("redraws when the render function is run", function(done) {
		var onupdate = o.spy()
		var oninit = o.spy()
		
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
		
		renderers[0]()
		
		// Wrapped to give time for the rate-limited redraw to fire
		setTimeout(function() {
			o(onupdate.callCount).equals(1)
			
			done()
		}, FRAME_BUDGET)
	})
})
