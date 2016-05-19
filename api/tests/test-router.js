"use strict"

var o = require("../../ospec/ospec")
var pushStateMock = require("../../test-utils/pushStateMock")
var domMock = require("../../test-utils/domMock")
var async = require("./async")

var m = require("../../render/hyperscript")
var createRouter = require("../router")

o.spec("m.mount", function() {
    var $window, root
    
    o.beforeEach(function() {
		var dom = domMock()
        var location = pushStateMock()
        
        Object.keys(location).forEach(function(key) {
            dom[key] = location[key]
        })
        
        $window = dom
        async.setTimeout($window)
		root = $window.document.body
    })
    
	o("is a function", function() {
        o(typeof createRouter).equals("function")
    })
    
    o("returns a function after invocation", function() {
        o(typeof createRouter($window)).equals("function")
    })
    
    o("updates passed in redraw object", function() {
        var redraw = {}
        var router = createRouter($window, redraw)
        
        router(root, "/", {
            "/" : {
                view : function() {
                    return m("div")
                }
            }
        })
        
        o(typeof redraw.run).equals("function")
    })
    
    o("renders into `root`", function() {
        var router = createRouter($window, {})
        
        router(root, "/", {
            "/" : {
                view : function() {
                    return m("div")
                }
            }
        })
        
        o(root.firstChild.nodeName).equals("DIV")
    })
    
     o("redraws on redraw.run()", function(done) {
        var onupdate = o.spy()
        var oninit = o.spy()
        var redraw = {}
        var router = createRouter($window, redraw)
        
        router(root, "/", {
            "/" : {
                view : function() {
                    return m("div", {
                        oninit   : oninit,
                        onupdate : onupdate
                    })
                }
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
})
