"use strict"

var o = require("../../ospec/ospec")
var withAttr = require("../../util/withAttr")

o.spec("withAttr", function() {
	o("works", function() {
		var spy = o.spy()
		var context = {
			handler: withAttr("value", spy)
		}
		context.handler({currentTarget: {value: 1}})

		o(spy.args).deepEquals([1])
		o(spy.this).equals(context)
	})
	o("works with attribute", function() {
		var target = {
			getAttribute: function() {return "readonly"}
		}
		var spy = o.spy()
		var context = {
			handler: withAttr("readonly", spy)
		}
		context.handler({currentTarget: target})

		o(spy.args).deepEquals(["readonly"])
		o(spy.this).equals(context)
	})
	o("context arg works", function() {
		var spy = o.spy()
		var context = {}
		var handler = withAttr("value", spy, context)
		handler({currentTarget: {value: 1}})

		o(spy.this).equals(context)
	})
})
