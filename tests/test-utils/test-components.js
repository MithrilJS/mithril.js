"use strict"

var o = require("ospec")
var utils = require("../../test-utils/utils")

o.spec("test-utils/utils (components)", function() {
	o("only 3 component types exist", function() {
		o(Object.keys(utils.components))
			.deepEquals(["POJO", "constructible", "closure"])
	})

	o.spec("POJO", function() {
		var create = utils.components.POJO

		o("works", function() {
			var methods = {oninit: function(){}, view: function(){}}
			var cmp1 = create()
			var cmp2 = create(methods)
			o(Object.create(cmp1).view()).deepEquals({tag: "div"})
			o(Object.create(cmp2).view).equals(methods.view)
			o(Object.create(cmp2).oninit).equals(methods.oninit)
		})
	})

	o.spec("constructible", function() {
		var create = utils.components.constructible

		o("works", function() {
			var methods = {oninit: function(){}, view: function(){}}
			var Cmp1 = create()
			var Cmp2 = create(methods)
			o(new Cmp1().view()).deepEquals({tag: "div"})
			o(new Cmp2().view).equals(methods.view)
			o(new Cmp2().oninit).equals(methods.oninit)
		})
	})

	o.spec("closure", function() {
		var create = utils.components.closure

		o("works", function() {
			var methods = {oninit: function(){}, view: function(){}}
			var cmp1 = create()
			var cmp2 = create(methods)
			o(cmp1().view()).deepEquals({tag: "div"})
			o(cmp2().view).equals(methods.view)
			o(cmp2().oninit).equals(methods.oninit)
		})
	})
})
