"use strict"

var o = require("../../ospec/ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")

var m = require("../../render/hyperscript")
var apiRedraw = require("../../api/redraw")
var apiMounter = require("../../api/mount")

o.spec("mount", function() {
	var FRAME_BUDGET = Math.floor(1000 / 60)
	var $window, root, redrawService, mount, render

	o.beforeEach(function() {
		$window = domMock()

		root = $window.document.body

		redrawService = apiRedraw($window)
		mount = apiMounter(redrawService)
		render = redrawService.render
	})

	o("throws on invalid component", function() {
		var threw = false
		try {
			mount(root, {})
		} catch (e) {
			threw = true
		}
		o(threw).equals(true)
	})

	components.forEach(function(cmp){
		o.spec(cmp.kind, function(){
			var createComponent = cmp.create

			o("throws on invalid `root` DOM node", function() {
				var threw = false
				try {
					mount(null, createComponent({view: function() {}}))
				} catch (e) {
					threw = true
				}
				o(threw).equals(true)
			})

			o("renders into `root`", function() {
				mount(root, createComponent({
					view : function() {
						return m("div")
					}
				}))

				o(root.firstChild.nodeName).equals("DIV")
			})

			o("mounting null unmounts", function() {
				mount(root, createComponent({
					view : function() {
						return m("div")
					}
				}))

				mount(root, null)

				o(root.childNodes.length).equals(0)
			})

			o("redraws on events", function(done) {
				var onupdate = o.spy()
				var oninit = o.spy()
				var onclick = o.spy()
				var e = $window.document.createEvent("MouseEvents")

				e.initEvent("click", true, true)

				mount(root, createComponent({
					view : function() {
						return m("div", {
							oninit   : oninit,
							onupdate : onupdate,
							onclick  : onclick,
						})
					}
				}))

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

			o("redraws several mount points on events", function(done, timeout) {
				timeout(60)

				var onupdate0 = o.spy()
				var oninit0 = o.spy()
				var onclick0 = o.spy()
				var onupdate1 = o.spy()
				var oninit1 = o.spy()
				var onclick1 = o.spy()

				var e = $window.document.createEvent("MouseEvents")

				e.initEvent("click", true, true)

				render(root, [
					m("#child0"),
					m("#child1")
				])

				mount(root.childNodes[0], createComponent({
					view : function() {
						return m("div", {
							oninit   : oninit0,
							onupdate : onupdate0,
							onclick  : onclick0,
						})
					}
				}))

				o(oninit0.callCount).equals(1)
				o(onupdate0.callCount).equals(0)

				mount(root.childNodes[1], createComponent({
					view : function() {
						return m("div", {
							oninit   : oninit1,
							onupdate : onupdate1,
							onclick  : onclick1,
						})
					}
				}))

				o(oninit1.callCount).equals(1)
				o(onupdate1.callCount).equals(0)

				root.childNodes[0].firstChild.dispatchEvent(e)
				o(onclick0.callCount).equals(1)
				o(onclick0.this).equals(root.childNodes[0].firstChild)

				setTimeout(function() {
					o(onupdate0.callCount).equals(1)
					o(onupdate1.callCount).equals(1)

					root.childNodes[1].firstChild.dispatchEvent(e)
					o(onclick1.callCount).equals(1)
					o(onclick1.this).equals(root.childNodes[1].firstChild)

					setTimeout(function() {
						o(onupdate0.callCount).equals(2)
						o(onupdate1.callCount).equals(2)

						done()
					}, FRAME_BUDGET)
				}, FRAME_BUDGET)

			})

			o("event handlers can skip redraw", function(done) {
				var onupdate = o.spy()
				var oninit = o.spy()
				var e = $window.document.createEvent("MouseEvents")

				e.initEvent("click", true, true)

				mount(root, createComponent({
					view: function() {
						return m("div", {
							oninit: oninit,
							onupdate: onupdate,
							onclick: function(e) {
								e.redraw = false
							}
						})
					}
				}))

				root.firstChild.dispatchEvent(e)

				o(oninit.callCount).equals(1)

				// Wrapped to ensure no redraw fired
				setTimeout(function() {
					o(onupdate.callCount).equals(0)

					done()
				}, FRAME_BUDGET)
			})

			o("redraws when the render function is run", function(done) {
				var onupdate = o.spy()
				var oninit = o.spy()

				mount(root, createComponent({
					view : function() {
						return m("div", {
							oninit: oninit,
							onupdate: onupdate
						})
					}
				}))

				o(oninit.callCount).equals(1)
				o(onupdate.callCount).equals(0)

				redrawService.redraw()

				// Wrapped to give time for the rate-limited redraw to fire
				setTimeout(function() {
					o(onupdate.callCount).equals(1)

					done()
				}, FRAME_BUDGET)
			})

			o("throttles", function(done, timeout) {
				timeout(200)

				var i = 0
				mount(root, createComponent({view: function() {i++}}))
				var before = i

				redrawService.redraw()
				redrawService.redraw()
				redrawService.redraw()
				redrawService.redraw()

				var after = i

				setTimeout(function(){
					o(before).equals(1) // mounts synchronously
					o(after).equals(1) // throttles rest
					o(i).equals(2)
					done()
				},40)
			})
		})
	})
})
