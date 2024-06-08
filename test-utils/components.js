"use strict"

var m = require("../render/hyperscript")

module.exports = [
	{
		kind: "POJO",
		create: function(methods) {
			var res = {view: function() {return m("div")}}
			Object.keys(methods || {}).forEach(function(m){res[m] = methods[m]})
			return res
		}
	}, {
		kind: "constructible",
		create: function(methods) {
			function res(){}
			res.prototype.view = function() {return m("div")}
			Object.keys(methods || {}).forEach(function(m){res.prototype[m] = methods[m]})
			return res
		}
	}, {
		kind: "closure",
		create: function(methods) {
			return function() {
				var res = {view: function() {return m("div")}}
				Object.keys(methods || {}).forEach(function(m){res[m] = methods[m]})
				return res
			}
		}
	}
]
