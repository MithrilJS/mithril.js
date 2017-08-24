"use strict"

var o = require("../../ospec/ospec")
var components = require("../../test-utils/components")
var domMock = require("../../test-utils/domMock")
var throttleMocker = require("../../test-utils/throttleMock")

var m = require("../../render/hyperscript")
var apiRedraw = require("../../api/redraw")
var apiMounter = require("../../api/mount")

o.spec("mount", function() {
	var $window, root, redrawService, mount, render, throttleMock

	o.beforeEach(function() {
		$window = domMock()
		throttleMock = throttleMocker()

		root = $window.document.body
		redrawService = apiRedraw($window, throttleMock.throttle)
		mount = apiMounter(redrawService)
		render = redrawService.render
	})

	o.afterEach(function() {
		o(throttleMock.queueLength()).equals(0)
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

			o("renders into `root` synchronoulsy", function() {
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

			o("Mounting a second root doesn't cause the first one to redraw", function() {
				var view = o.spy(function() {
					return m("div")
				})

				render(root, [
					m("#child0"),
					m("#child1")
				])

				mount(root.childNodes[0], createComponent({
					view : view
				}))

				o(root.firstChild.nodeName).equals("DIV")
				o(view.callCount).equals(1)

				mount(root.childNodes[1], createComponent({
					view : function() {
						return m("div")
					}
				}))

				o(view.callCount).equals(1)

				throttleMock.fire()

				o(view.callCount).equals(1)
			})

			o("redraws on events", function() {
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

				throttleMock.fire()

				o(onupdate.callCount).equals(1)
			})

			o("redraws several mount points on events", function() {
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

				throttleMock.fire()

				o(onupdate0.callCount).equals(1)
				o(onupdate1.callCount).equals(1)

				root.childNodes[1].firstChild.dispatchEvent(e)

				o(onclick1.callCount).equals(1)
				o(onclick1.this).equals(root.childNodes[1].firstChild)

				throttleMock.fire()

				o(onupdate0.callCount).equals(2)
				o(onupdate1.callCount).equals(2)
			})

			o("event handlers can skip redraw", function() {
				var onupdate = o.spy(function(){
					throw new Error("This shouldn't have been called")
				})
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

				throttleMock.fire()

				o(onupdate.callCount).equals(0)
			})

			o("redraws when the render function is run", function() {
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

				throttleMock.fire()

				o(onupdate.callCount).equals(1)
			})

			o("throttles", function() {
				var i = 0
				mount(root, createComponent({view: function() {i++}}))
				var before = i

				redrawService.redraw()
				redrawService.redraw()
				redrawService.redraw()
				redrawService.redraw()

				var after = i

				throttleMock.fire()

				o(before).equals(1) // mounts synchronously
				o(after).equals(1) // throttles rest
				o(i).equals(2)
			})
			
			o("can trigger immediate redraw in mount > oncreate", function() {
				var sequence = []
				
				var oncreate = o.spy(function() {
					
					sequence.push("oncreate")
					
					redrawService.redraw(function() {
						sequence.push("oncreate.redraw.then")
					})
				})
				
				mount(root, createComponent({
					view: function() {
						return m("div", {
							oncreate: oncreate
						})
					}
				}))
				
				o(sequence).deepEquals([
					"oncreate",
					"oncreate.redraw.then",
				])
			})
			
			o("can trigger immediate redraw in onupdate", function() {
				var sequence = []
				
				var updateRedrawNow = false
				var onupdate = o.spy(function() {
					
					sequence.push("onupdate")
					
					if (updateRedrawNow) {
						updateRedrawNow = false // Prevent recursion
						
						sequence.push("onupdate.redraw")
						
						redrawService.redraw(function() {
								
							sequence.push("onupdate.redraw.then")
							
							sequence.push("onupdate.redraw.then.redraw")
							
							redrawService.redraw(function() {
									
								sequence.push("onupdate.redraw.then.redraw.then")
							})
							
							sequence.push("onupdate.redraw.then - end")
						})
						
					}
					
					sequence.push("onupdate - end")
				})
				
				mount(root, createComponent({
					view: function() {
						return m("div", {
							onupdate: onupdate
						})
					}
				}))
				
				// Mount render cycle complete
				
				sequence.push("redraw")
				
				updateRedrawNow = true
				
				redrawService.redraw() // Redraw on next frame
					
				sequence.push("fire")
				
				throttleMock.fire() // Next frame
				
				sequence.push("end")
				
				o(sequence).deepEquals([
					"redraw",
					"fire",
					"onupdate",
					"onupdate.redraw",
					"onupdate - end",
					"onupdate",
					"onupdate - end",
					"onupdate.redraw.then",
					"onupdate.redraw.then.redraw",
					"onupdate.redraw.then - end",
					"onupdate",
					"onupdate - end",
					"onupdate.redraw.then.redraw.then",
					"end",
				])
			})
			
			o("throttles redraw promise", function() {
				var sequence = []
				
				var onupdate = o.spy()
				
				mount(root, createComponent({
					view: function() {
						return m("div", {
							onupdate: onupdate
						})
					}
				}))
				
				// Mount render cycle complete
				
				sequence.push("redraw")
				
				redrawService.redraw(function() {
					
					sequence.push("redraw.then")
					
				})
				
				sequence.push("redraw2")
				redrawService.redraw(function() {
					
					sequence.push("redraw2.then")
				})
				
				sequence.push("fire")
				
				throttleMock.fire() // Next frame
				
				sequence.push("end")
				
				o(onupdate.callCount).equals(1)
				
				o(sequence).deepEquals([
					"redraw",
					"redraw2",
					"fire",
					"redraw.then",
					"redraw2.then",
					"end",
				])
			})
			
			o("no nested redraws", function() {
				var sequence = []
				
				var oncreate = o.spy(function() {
					sequence.push("oncreate")
				})
				var oncreateTriggerRedraw = o.spy(function() {
					sequence.push("oncreateTriggerRedraw")
					redrawService.redraw()
				})
				var onupdate = o.spy(function() {
					sequence.push("onupdate")
				})
				
				mount(root, createComponent({
					view: function() {
						return m("div", {
							oncreate: oncreate,
							onupdate: onupdate
						},
							m("div", {
								oncreate: oncreate,
								onupdate: onupdate
							},
								m("div", {
									oncreate: oncreate,
									onupdate: onupdate
								})
							),
							m("div", {
								oncreate: oncreateTriggerRedraw,
								onupdate: onupdate
							},
								m("div", {
									oncreate: oncreate,
									onupdate: onupdate
								})
							),
							m("div", {
								oncreate: oncreate,
								onupdate: onupdate
							},
								m("div", {
									oncreate: oncreate,
									onupdate: onupdate
								})
							)
						)
					}
				}))
				
				o(oncreate.callCount).equals(6)
				o(oncreateTriggerRedraw.callCount).equals(1)
				o(onupdate.callCount).equals(7)
				
				o(sequence).deepEquals([
					"oncreate",
					"oncreate",
					"oncreate",
					"oncreateTriggerRedraw",
					"oncreate",
					"oncreate",
					"oncreate",
					"onupdate",
					"onupdate",
					"onupdate",
					"onupdate",
					"onupdate",
					"onupdate",
					"onupdate",
				])
			})
		})
	})
})
