"use strict"

var o = require("../../ospec/ospec")
var apiPubSub = require("../../api/pubsub")

o.spec("pubsub", function() {
    var pubsub
	o.beforeEach(function() {
		pubsub = apiPubSub()
	})
    
    o("it shouldn't error if there are no renderers", function() {
        pubsub.publish()
    })
    
    o("it should run a single renderer entry", function() {
        var spy = o.spy()
        
        pubsub.subscribe(spy)
        
        pubsub.publish()
        
        o(spy.callCount).equals(1)
        
        pubsub.publish()
        pubsub.publish()
        pubsub.publish()
        
        o(spy.callCount).equals(4)
    })
    
    o("it should run all renderer entries", function() {
        var spy1 = o.spy()
        var spy2 = o.spy()
        var spy3 = o.spy()
        
        pubsub.subscribe(spy1)
        pubsub.subscribe(spy2)
        pubsub.subscribe(spy3)
        
        pubsub.publish()
        
        o(spy1.callCount).equals(1)
        o(spy2.callCount).equals(1)
        o(spy3.callCount).equals(1)
        
        pubsub.publish()
        
        o(spy1.callCount).equals(2)
        o(spy2.callCount).equals(2)
        o(spy3.callCount).equals(2)
    })
})
