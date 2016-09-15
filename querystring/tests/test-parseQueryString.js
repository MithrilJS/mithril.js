"use strict"

var o = require("../../ospec/ospec")
var parseQueryString = require("../../querystring/parse")

o.spec("parseQueryString", function() {
	o("works", function() {
		var data = parseQueryString("?aaa=bbb")
		o(data).deepEquals({aaa: "bbb"})
	})
	o("parses empty string", function() {
		var data = parseQueryString("")
		o(data).deepEquals({})
	})
	o("parses flat object", function() {
		var data = parseQueryString("?a=b&c=d")
		o(data).deepEquals({a: "b", c: "d"})
	})
	o("handles escaped values", function() {
		var data = parseQueryString("?%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23=%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
		o(data).deepEquals({";:@&=+$,/?%#": ";:@&=+$,/?%#"})
	})
	o("handles escaped slashes followed by a number", function () {
		var data = parseQueryString("?hello=%2Fen%2F1")
		o(data.hello).equals("/en/1")
	})
	o("handles escaped square brackets", function() {
		var data = parseQueryString("?a%5B%5D=b")
		o(data).deepEquals({"a": ["b"]})
	})
	o("handles escaped unicode", function() {
		var data = parseQueryString("?%C3%B6=%C3%B6")
		o(data).deepEquals({"ö": "ö"})
	})
	o("handles unicode", function() {
		var data = parseQueryString("?ö=ö")
		o(data).deepEquals({"ö": "ö"})
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
	o("does not cast void to number", function() {
		var data = parseQueryString("a")
		o(data).deepEquals({a: ""})
	})
})
