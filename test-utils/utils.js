"use strict"

// Generic utilities

exports.delay = function (ms) {
	return new Promise(function(resolve) {
		setTimeout(resolve, ms)
	})
}

exports.components = {
	POJO: function(methods) {
		var res = {view: function() {return {tag:"div"}}}
		Object.keys(methods || {}).forEach(function(m){res[m] = methods[m]})
		return res
	},
	constructible: function(methods) {
		function res(){}
		res.prototype.view = function() {return {tag:"div"}}
		Object.keys(methods || {}).forEach(function(m){res.prototype[m] = methods[m]})
		return res
	},
	closure: function(methods) {
		return function() {
			var res = {view: function() {return {tag:"div"}}}
			Object.keys(methods || {}).forEach(function(m){res[m] = methods[m]})
			return res
		}
	}
}
