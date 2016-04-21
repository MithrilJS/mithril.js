"use strict"

var o = require("../../ospec/ospec")
var parseQueryString = require("../../querystring/parse")

o.spec("parseQueryString", function() {
	o("works", function() {
		var data = parseQueryString("?aaa=bbb")
		o(data).deepEquals({aaa: "bbb"})
	})
	o("parses flat object", function() {
		var data = parseQueryString("?a=b&c=d")
		o(data).deepEquals({a: "b", c: "d"})
	})
	o("parses without question mark", function() {
		var data = parseQueryString("a=b&c=d")
		o(data).deepEquals({a: "b", c: "d"})
	})
	o("parses nested object", function() {
		var data = parseQueryString("a[b]=x&a[c]=y")
		o(data).deepEquals({a: {b: "x", c: "y"}})
	})
	o("parses deep nested object", function() {
		var data = parseQueryString("a[b][c]=x&a[b][d]=y")
		o(data).deepEquals({a: {b: {c: "x", d: "y"}}})
	})
	o("parses nested array", function() {
		var data = parseQueryString("a[0]=x&a[1]=y")
		o(data).deepEquals({a: ["x", "y"]})
	})
	o("parses deep nested array", function() {
		var data = parseQueryString("a[0][0]=x&a[0][1]=y")
		o(data).deepEquals({a: [["x", "y"]]})
	})
	o("parses deep nested object in array", function() {
		var data = parseQueryString("a[0][c]=x&a[0][d]=y")
		o(data).deepEquals({a: [{c: "x", d: "y"}]})
	})
	o("parses deep nested array in object", function() {
		var data = parseQueryString("a[b][0]=x&a[b][1]=y")
		o(data).deepEquals({a: {b: ["x", "y"]}})
	})
	o("parses array without index", function() {
		var data = parseQueryString("a[]=x&a[]=y&b[]=w&b[]=z")
		o(data).deepEquals({a: ["x", "y"], b: ["w", "z"]})
	})
	/*TODO remove since build generates a[0]=b syntax
	o("generates array for duplicate items", function() {
		var data = parseQueryString("a=b&a=c&a=d")
		o(data).deepEquals({a: ["b", "c", "d"]})
	})
	*/
	o("casts booleans", function() {
		var data = parseQueryString("a=true&b=false")
		o(data).deepEquals({a: true, b: false})
	})
	o("casts numbers", function() {
		var data = parseQueryString("a=1&b=-2.3&c=0x10&d=1e2&e=Infinity")
		o(data).deepEquals({a: 1, b: -2.3, c: 16, d: 100, e: Infinity})
	})
	o("casts NaN", function() {
		var data = parseQueryString("a=NaN")
		o(isNaN(data.a)).equals(true)
	})
	o("casts Date", function() {
		var data = parseQueryString("a=" + new Date(0))
		o(data.a instanceof Date).equals(true)
		o(data.a.getTime()).equals(0)
	})
	o("does not cast empty string to number", function() {
		var data = parseQueryString("a=")
		o(data).deepEquals({a: ""})
	})
})
