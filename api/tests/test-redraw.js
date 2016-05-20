"use strict"

var o = require("../../ospec/ospec")
var createRedraw = require("../../api/redraw")

o.spec("m.redraw", function() {
    var redraw, renderers
	
	o.beforeEach(function() {
		renderers = []
		redraw = createRedraw(renderers)
	})
    
    o("it shouldn't error if there are no renderers", function() {
        redraw()
    })
    
    o("it should run a single renderer entry", function() {
        var spy = o.spy()
        
        renderers.push(spy)
        
        redraw()
        
        o(spy.callCount).equals(1)
        
        redraw()
        redraw()
        redraw()
        
        o(spy.callCount).equals(4)
    })
    
    o("it should run all renderer entries", function() {
        var spy1 = o.spy()
        var spy2 = o.spy()
        var spy3 = o.spy()
        
        renderers.push(spy1, spy2, spy3)
        
        redraw()
        
        o(spy1.callCount).equals(1)
        o(spy2.callCount).equals(1)
        o(spy3.callCount).equals(1)
        
        redraw()
        redraw()
        redraw()
        
        o(spy1.callCount).equals(4)
        o(spy2.callCount).equals(4)
        o(spy3.callCount).equals(4)
    })
})
