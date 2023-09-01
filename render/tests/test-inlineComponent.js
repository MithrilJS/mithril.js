"use strict"

var o = require("ospec")
var window = require("../../test-utils/browserMock")()

if (typeof global !== "undefined") {
	global.window = window
	global.document = window.document
	global.requestAnimationFrame = function(callback){callback()}
}

var m = require("../../index")

o.spec("inline component", function() {
	o.beforeEach(function() {
		m.render(document.body, null)
	})

	o("allows closure components to be identified by source equality", function(){
		var oninit = o.spy()
		var view = o.spy()
		var onremove = o.spy()

		m.mount(document.body, {
			view: function() {
				return m(function Component() {
					return {
						oninit,
						onremove,
						view: function() {
							view()

							return ""
						},
					}
				})
			}
		})

		m.redraw()

		o(oninit.callCount).equals(1)("1 initialisation")
		o(view.callCount).equals(2)("2 view executions")
		o(onremove.callCount).equals(0)("0 teardowns")
	})
})