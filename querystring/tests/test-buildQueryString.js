"use strict"

var o = require("../../ospec/ospec")
var buildQueryString = require("../../querystring/build")

o.spec("buildQueryString", function() {
	o("builds from flat object", function() {
		var string = buildQueryString({a: "b", c: 1})
		
		o(string).equals("a=b&c=1")
	})
	o("builds from nested object", function() {
		var string = buildQueryString({a: {b: 1, c: 2}})
		
		o(string).equals("a%5Bb%5D=1&a%5Bc%5D=2")
	})
	o("builds from deep nested object", function() {
		var string = buildQueryString({a: {b: {c: 1, d: 2}}})
		
		o(string).equals("a%5Bb%5D%5Bc%5D=1&a%5Bb%5D%5Bd%5D=2")
	})
	o("builds from nested array", function() {
		var string = buildQueryString({a: ["x", "y"]})
		
		o(string).equals("a%5B0%5D=x&a%5B1%5D=y")
	})
	o("builds from deep nested array", function() {
		var string = buildQueryString({a: [["x", "y"]]})
		
		o(string).equals("a%5B0%5D%5B0%5D=x&a%5B0%5D%5B1%5D=y")
	})
	o("builds from deep nested array in object", function() {
		var string = buildQueryString({a: {b: ["x", "y"]}})
		
		o(string).equals("a%5Bb%5D%5B0%5D=x&a%5Bb%5D%5B1%5D=y")
	})
	o("builds from deep nested object in array", function() {
		var string = buildQueryString({a: [{b: 1, c: 2}]})
		
		o(string).equals("a%5B0%5D%5Bb%5D=1&a%5B0%5D%5Bc%5D=2")
	})
	o("builds date", function() {
		var string = buildQueryString({a: new Date(0)})
		
		o(string).equals("a=" + encodeURIComponent(new Date(0).toString()))
	})
	o("builds null into empty string (like jQuery)", function() {
		var string = buildQueryString({a: null})
		
		o(string).equals("a=")
	})
	o("builds undefined into empty string (like jQuery)", function() {
		var string = buildQueryString({a: undefined})
		
		o(string).equals("a=")
	})
	o("builds zero", function() {
		var string = buildQueryString({a: 0})
		
		o(string).equals("a=0")
	})
	o("builds false", function() {
		var string = buildQueryString({a: false})
		
		o(string).equals("a=false")
	})
})
