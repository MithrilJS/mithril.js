"use strict"

var o = require("ospec")
var p = require("../../src/std/p")

o.spec("p", () => {
	function test(prefix) {
		o("returns path if no params", () => {
			var string = p(prefix + "/route/foo", undefined)

			o(string).equals(`${prefix}/route/foo`)
		})
		o("skips interpolation if no params", () => {
			var string = p(prefix + "/route/:id", undefined)

			o(string).equals(`${prefix}/route/:id`)
		})
		o("appends query strings", () => {
			var string = p(prefix + "/route/foo", {a: "b", c: 1})

			o(string).equals(`${prefix}/route/foo?a=b&c=1`)
		})
		o("inserts template parameters at end", () => {
			var string = p(prefix + "/route/:id", {id: "1"})

			o(string).equals(`${prefix}/route/1`)
		})
		o("inserts template parameters at beginning", () => {
			var string = p(prefix + "/:id/foo", {id: "1"})

			o(string).equals(`${prefix}/1/foo`)
		})
		o("inserts template parameters at middle", () => {
			var string = p(prefix + "/route/:id/foo", {id: "1"})

			o(string).equals(`${prefix}/route/1/foo`)
		})
		o("inserts variadic paths", () => {
			var string = p(prefix + "/route/:foo...", {foo: "id/1"})

			o(string).equals(`${prefix}/route/id/1`)
		})
		o("inserts variadic paths with initial slashes", () => {
			var string = p(prefix + "/route/:foo...", {foo: "/id/1"})

			o(string).equals(`${prefix}/route//id/1`)
		})
		o("skips template parameters at end if param missing", () => {
			var string = p(prefix + "/route/:id", {param: 1})

			o(string).equals(`${prefix}/route/:id?param=1`)
		})
		o("skips template parameters at beginning if param missing", () => {
			var string = p(prefix + "/:id/foo", {param: 1})

			o(string).equals(`${prefix}/:id/foo?param=1`)
		})
		o("skips template parameters at middle if param missing", () => {
			var string = p(prefix + "/route/:id/foo", {param: 1})

			o(string).equals(`${prefix}/route/:id/foo?param=1`)
		})
		o("skips variadic template parameters if param missing", () => {
			var string = p(prefix + "/route/:foo...", {param: "/id/1"})

			o(string).equals(`${prefix}/route/:foo...?param=%2Fid%2F1`)
		})
		o("handles escaped values", () => {
			var data = p(prefix + "/route/:foo", {"foo": ";:@&=+$,/?%#"})

			o(data).equals(`${prefix}/route/%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23`)
		})
		o("handles unicode", () => {
			var data = p(prefix + "/route/:ö", {"ö": "ö"})

			o(data).equals(`${prefix}/route/%C3%B6`)
		})
		o("handles zero", () => {
			var string = p(prefix + "/route/:a", {a: 0})

			o(string).equals(`${prefix}/route/0`)
		})
		o("handles false", () => {
			var string = p(prefix + "/route/:a", {a: false})

			o(string).equals(`${prefix}/route/false`)
		})
		o("handles dashes", () => {
			var string = p(prefix + "/:lang-:region/route", {
				lang: "en",
				region: "US"
			})

			o(string).equals(`${prefix}/en-US/route`)
		})
		o("handles dots", () => {
			var string = p(prefix + "/:file.:ext/view", {
				file: "image",
				ext: "png"
			})

			o(string).equals(`${prefix}/image.png/view`)
		})
		o("merges query strings", () => {
			var string = p(prefix + "/item?a=1&b=2", {c: 3})

			o(string).equals(`${prefix}/item?a=1&b=2&c=3`)
		})
		o("merges query strings with other parameters", () => {
			var string = p(prefix + "/item/:id?a=1&b=2", {id: "foo", c: 3})

			o(string).equals(`${prefix}/item/foo?a=1&b=2&c=3`)
		})
		o("consumes template parameters without modifying query string", () => {
			var string = p(prefix + "/item/:id?a=1&b=2", {id: "foo"})

			o(string).equals(`${prefix}/item/foo?a=1&b=2`)
		})
		o("handles flat object in query string", () => {
			var string = p(prefix, {a: "b", c: 1})

			o(string).equals(`${prefix}?a=b&c=1`)
		})
		o("handles escaped values in query string", () => {
			var data = p(prefix, {";:@&=+$,/?%#": ";:@&=+$,/?%#"})

			o(data).equals(`${prefix}?%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23=%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23`)
		})
		o("handles unicode in query string", () => {
			var data = p(prefix, {"ö": "ö"})

			o(data).equals(`${prefix}?%C3%B6=%C3%B6`)
		})
		o("handles nested object in query string", () => {
			var string = p(prefix, {a: {b: 1, c: 2}})

			o(string).equals(`${prefix}?a%5Bb%5D=1&a%5Bc%5D=2`)
		})
		o("handles deep nested object in query string", () => {
			var string = p(prefix, {a: {b: {c: 1, d: 2}}})

			o(string).equals(`${prefix}?a%5Bb%5D%5Bc%5D=1&a%5Bb%5D%5Bd%5D=2`)
		})
		o("handles nested array in query string", () => {
			var string = p(prefix, {a: ["x", "y"]})

			o(string).equals(`${prefix}?a%5B%5D=x&a%5B%5D=y`)
		})
		o("handles array w/ dupe values in query string", () => {
			var string = p(prefix, {a: ["x", "x"]})

			o(string).equals(`${prefix}?a%5B%5D=x&a%5B%5D=x`)
		})
		o("handles deep nested array in query string", () => {
			var string = p(prefix, {a: [["x", "y"]]})

			o(string).equals(`${prefix}?a%5B%5D%5B%5D=x&a%5B%5D%5B%5D=y`)
		})
		o("handles deep nested array in object in query string", () => {
			var string = p(prefix, {a: {b: ["x", "y"]}})

			o(string).equals(`${prefix}?a%5Bb%5D%5B%5D=x&a%5Bb%5D%5B%5D=y`)
		})
		o("handles deep nested object in array in query string", () => {
			var string = p(prefix, {a: [{b: 1, c: 2}]})

			o(string).equals(`${prefix}?a%5B%5D%5Bb%5D=1&a%5B%5D%5Bc%5D=2`)
		})
		o("handles date in query string", () => {
			var string = p(prefix, {a: new Date(0)})

			o(string).equals(`${prefix}?a=${encodeURIComponent(new Date(0).toString())}`)
		})
		o("handles zero in query string", () => {
			var string = p(prefix, {a: 0})

			o(string).equals(`${prefix}?a=0`)
		})
		o("retains empty string literally", () => {
			var string = p(prefix, {a: ""})

			o(string).equals(`${prefix}?a=`)
		})
		o("drops `null` from query string", () => {
			var string = p(prefix, {a: null})

			o(string).equals(prefix)
		})
		o("drops `undefined` from query string", () => {
			var string = p(prefix, {a: undefined})

			o(string).equals(prefix)
		})
		o("turns `true` into value-less string in query string", () => {
			var string = p(prefix, {a: true})

			o(string).equals(`${prefix}?a`)
		})
		o("drops `false` from query string", () => {
			var string = p(prefix, {a: false})

			o(string).equals(prefix)
		})
	}
	o.spec("absolute", () => { test("") })
	o.spec("relative", () => { test("..") })
	o.spec("absolute + domain", () => { test("https://example.com") })
	o.spec("absolute + `file:`", () => { test("file://") })
})
