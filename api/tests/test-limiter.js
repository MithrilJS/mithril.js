"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var async = require("./async")

var limiter = require("../limiter")

o.spec("fps limiter", function() {
    var $window, root

    [ "setTimeout", "requestAnimationFrame" ].forEach(function(type) {
        o.spec(type, function() {
            o.beforeEach(function() {
                $window = domMock()
                
                async[type]($window)
            })
            
            o("is a function", function() {
                o(typeof limiter).equals("function")
            })
            
            o("it returns a function", function() {
                o(typeof limiter(false)).equals("function")
            })
        })
    })
})
