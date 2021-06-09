"use strict"

var o = require("ospec")
var loadMithril = require("../../test-utils/loadMithril")

o.spec("buildPathname", function() {
	var buildPathname
	o.beforeEach(function() { buildPathname = loadMithril().buildPathname })

	o.spec("absolute", function() {
		o("returns path if no params", function () {
			o(buildPathname("/route/foo", undefined))
				.equals("/route/foo")
		})
		o("skips interpolation if no params", function () {
			o(buildPathname("/route/:id", undefined))
				.equals("/route/:id")
		})
		o("appends query strings", function () {
			o(buildPathname("/route/foo", {a: "b", c: 1}))
				.equals("/route/foo?a=b&c=1")
		})
		o("inserts template parameters at end", function () {
			o(buildPathname("/route/:id", {id: "1"}))
				.equals("/route/1")
		})
		o("inserts template parameters at beginning", function () {
			o(buildPathname("/:id/foo", {id: "1"}))
				.equals("/1/foo")
		})
		o("inserts template parameters at middle", function () {
			o(buildPathname("/route/:id/foo", {id: "1"}))
				.equals("/route/1/foo")
		})
		o("inserts variadic paths", function () {
			o(buildPathname("/route/:foo...", {foo: "id/1"}))
				.equals("/route/id/1")
		})
		o("inserts variadic paths with initial slashes", function () {
			o(buildPathname("/route/:foo...", {foo: "/id/1"}))
				.equals("/route//id/1")
		})
		o("skips template parameters at end if param missing", function () {
			o(buildPathname("/route/:id", {param: 1}))
				.equals("/route/:id?param=1")
		})
		o("skips template parameters at beginning if param missing", function () {
			o(buildPathname("/:id/foo", {param: 1}))
				.equals("/:id/foo?param=1")
		})
		o("skips template parameters at middle if param missing", function () {
			o(buildPathname("/route/:id/foo", {param: 1}))
				.equals("/route/:id/foo?param=1")
		})
		o("skips variadic template parameters if param missing", function () {
			o(buildPathname("/route/:foo...", {param: "/id/1"}))
				.equals("/route/:foo...?param=%2Fid%2F1")
		})
		o("handles escaped values", function() {
			o(buildPathname("/route/:foo", {"foo": ";:@&=+$,/?%#"}))
				.equals("/route/%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
		})
		o("handles unicode", function() {
			o(buildPathname("/route/:ö", {"ö": "ö"}))
				.equals("/route/%C3%B6")
		})
		o("handles zero", function() {
			o(buildPathname("/route/:a", {a: 0}))
				.equals("/route/0")
		})
		o("handles false", function() {
			o(buildPathname("/route/:a", {a: false}))
				.equals("/route/false")
		})
		o("handles dashes", function() {
			o(buildPathname("/:lang-:region/route", {lang: "en", region: "US"}))
				.equals("/en-US/route")
		})
		o("handles dots", function() {
			o(buildPathname("/:file.:ext/view", {file: "image", ext: "png"}))
				.equals("/image.png/view")
		})
		o("merges query strings", function() {
			o(buildPathname("/item?a=1&b=2", {c: 3}))
				.equals("/item?a=1&b=2&c=3")
		})
		o("merges query strings with other parameters", function() {
			o(buildPathname("/item/:id?a=1&b=2", {id: "foo", c: 3}))
				.equals("/item/foo?a=1&b=2&c=3")
		})
		o("consumes template parameters without modifying query string", function() {
			o(buildPathname("/item/:id?a=1&b=2", {id: "foo"}))
				.equals("/item/foo?a=1&b=2")
		})
	})

	o.spec("relative", function() {
		o("returns path if no params", function () {
			o(buildPathname("../route/foo", undefined))
				.equals("../route/foo")
		})
		o("skips interpolation if no params", function () {
			o(buildPathname("../route/:id", undefined))
				.equals("../route/:id")
		})
		o("appends query strings", function () {
			o(buildPathname("../route/foo", {a: "b", c: 1}))
				.equals("../route/foo?a=b&c=1")
		})
		o("inserts template parameters at end", function () {
			o(buildPathname("../route/:id", {id: "1"}))
				.equals("../route/1")
		})
		o("inserts template parameters at beginning", function () {
			o(buildPathname("../:id/foo", {id: "1"}))
				.equals("../1/foo")
		})
		o("inserts template parameters at middle", function () {
			o(buildPathname("../route/:id/foo", {id: "1"}))
				.equals("../route/1/foo")
		})
		o("inserts variadic paths", function () {
			o(buildPathname("../route/:foo...", {foo: "id/1"}))
				.equals("../route/id/1")
		})
		o("inserts variadic paths with initial slashes", function () {
			o(buildPathname("../route/:foo...", {foo: "/id/1"}))
				.equals("../route//id/1")
		})
		o("skips template parameters at end if param missing", function () {
			o(buildPathname("../route/:id", {param: 1}))
				.equals("../route/:id?param=1")
		})
		o("skips template parameters at beginning if param missing", function () {
			o(buildPathname("../:id/foo", {param: 1}))
				.equals("../:id/foo?param=1")
		})
		o("skips template parameters at middle if param missing", function () {
			o(buildPathname("../route/:id/foo", {param: 1}))
				.equals("../route/:id/foo?param=1")
		})
		o("skips variadic template parameters if param missing", function () {
			o(buildPathname("../route/:foo...", {param: "/id/1"}))
				.equals("../route/:foo...?param=%2Fid%2F1")
		})
		o("handles escaped values", function() {
			o(buildPathname("../route/:foo", {"foo": ";:@&=+$,/?%#"}))
				.equals("../route/%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
		})
		o("handles unicode", function() {
			o(buildPathname("../route/:ö", {"ö": "ö"}))
				.equals("../route/%C3%B6")
		})
		o("handles zero", function() {
			o(buildPathname("../route/:a", {a: 0}))
				.equals("../route/0")
		})
		o("handles false", function() {
			o(buildPathname("../route/:a", {a: false}))
				.equals("../route/false")
		})
		o("handles dashes", function() {
			o(buildPathname("../:lang-:region/route", {lang: "en", region: "US"}))
				.equals("../en-US/route")
		})
		o("handles dots", function() {
			o(buildPathname("../:file.:ext/view", {file: "image", ext: "png"}))
				.equals("../image.png/view")
		})
		o("merges query strings", function() {
			o(buildPathname("../item?a=1&b=2", {c: 3}))
				.equals("../item?a=1&b=2&c=3")
		})
		o("merges query strings with other parameters", function() {
			o(buildPathname("../item/:id?a=1&b=2", {id: "foo", c: 3}))
				.equals("../item/foo?a=1&b=2&c=3")
		})
		o("consumes template parameters without modifying query string", function() {
			o(buildPathname("../item/:id?a=1&b=2", {id: "foo"}))
				.equals("../item/foo?a=1&b=2")
		})
	})

	o.spec("absolute + domain", function() {
		o("returns path if no params", function () {
			o(buildPathname("https://example.com/route/foo", undefined))
				.equals("https://example.com/route/foo")
		})
		o("skips interpolation if no params", function () {
			o(buildPathname("https://example.com/route/:id", undefined))
				.equals("https://example.com/route/:id")
		})
		o("appends query strings", function () {
			o(buildPathname("https://example.com/route/foo", {a: "b", c: 1}))
				.equals("https://example.com/route/foo?a=b&c=1")
		})
		o("inserts template parameters at end", function () {
			o(buildPathname("https://example.com/route/:id", {id: "1"}))
				.equals("https://example.com/route/1")
		})
		o("inserts template parameters at beginning", function () {
			o(buildPathname("https://example.com/:id/foo", {id: "1"}))
				.equals("https://example.com/1/foo")
		})
		o("inserts template parameters at middle", function () {
			o(buildPathname("https://example.com/route/:id/foo", {id: "1"}))
				.equals("https://example.com/route/1/foo")
		})
		o("inserts variadic paths", function () {
			o(buildPathname("https://example.com/route/:foo...", {foo: "id/1"}))
				.equals("https://example.com/route/id/1")
		})
		o("inserts variadic paths with initial slashes", function () {
			o(buildPathname("https://example.com/route/:foo...", {foo: "/id/1"}))
				.equals("https://example.com/route//id/1")
		})
		o("skips template parameters at end if param missing", function () {
			o(buildPathname("https://example.com/route/:id", {param: 1}))
				.equals("https://example.com/route/:id?param=1")
		})
		o("skips template parameters at beginning if param missing", function () {
			o(buildPathname("https://example.com/:id/foo", {param: 1}))
				.equals("https://example.com/:id/foo?param=1")
		})
		o("skips template parameters at middle if param missing", function () {
			o(buildPathname("https://example.com/route/:id/foo", {param: 1}))
				.equals("https://example.com/route/:id/foo?param=1")
		})
		o("skips variadic template parameters if param missing", function () {
			o(buildPathname("https://example.com/route/:foo...", {param: "/id/1"}))
				.equals("https://example.com/route/:foo...?param=%2Fid%2F1")
		})
		o("handles escaped values", function() {
			o(buildPathname("https://example.com/route/:foo", {"foo": ";:@&=+$,/?%#"}))
				.equals("https://example.com/route/%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
		})
		o("handles unicode", function() {
			o(buildPathname("https://example.com/route/:ö", {"ö": "ö"}))
				.equals("https://example.com/route/%C3%B6")
		})
		o("handles zero", function() {
			o(buildPathname("https://example.com/route/:a", {a: 0}))
				.equals("https://example.com/route/0")
		})
		o("handles false", function() {
			o(buildPathname("https://example.com/route/:a", {a: false}))
				.equals("https://example.com/route/false")
		})
		o("handles dashes", function() {
			o(buildPathname("https://example.com/:lang-:region/route", {lang: "en", region: "US"}))
				.equals("https://example.com/en-US/route")
		})
		o("handles dots", function() {
			o(buildPathname("https://example.com/:file.:ext/view", {file: "image", ext: "png"}))
				.equals("https://example.com/image.png/view")
		})
		o("merges query strings", function() {
			o(buildPathname("https://example.com/item?a=1&b=2", {c: 3}))
				.equals("https://example.com/item?a=1&b=2&c=3")
		})
		o("merges query strings with other parameters", function() {
			o(buildPathname("https://example.com/item/:id?a=1&b=2", {id: "foo", c: 3}))
				.equals("https://example.com/item/foo?a=1&b=2&c=3")
		})
		o("consumes template parameters without modifying query string", function() {
			o(buildPathname("https://example.com/item/:id?a=1&b=2", {id: "foo"}))
				.equals("https://example.com/item/foo?a=1&b=2")
		})
	})

	o.spec("absolute + `file:`", function() {
		o("returns path if no params", function () {
			o(buildPathname("file:///route/foo", undefined))
				.equals("file:///route/foo")
		})
		o("skips interpolation if no params", function () {
			o(buildPathname("file:///route/:id", undefined))
				.equals("file:///route/:id")
		})
		o("appends query strings", function () {
			o(buildPathname("file:///route/foo", {a: "b", c: 1}))
				.equals("file:///route/foo?a=b&c=1")
		})
		o("inserts template parameters at end", function () {
			o(buildPathname("file:///route/:id", {id: "1"}))
				.equals("file:///route/1")
		})
		o("inserts template parameters at beginning", function () {
			o(buildPathname("file:///:id/foo", {id: "1"}))
				.equals("file:///1/foo")
		})
		o("inserts template parameters at middle", function () {
			o(buildPathname("file:///route/:id/foo", {id: "1"}))
				.equals("file:///route/1/foo")
		})
		o("inserts variadic paths", function () {
			o(buildPathname("file:///route/:foo...", {foo: "id/1"}))
				.equals("file:///route/id/1")
		})
		o("inserts variadic paths with initial slashes", function () {
			o(buildPathname("file:///route/:foo...", {foo: "/id/1"}))
				.equals("file:///route//id/1")
		})
		o("skips template parameters at end if param missing", function () {
			o(buildPathname("file:///route/:id", {param: 1}))
				.equals("file:///route/:id?param=1")
		})
		o("skips template parameters at beginning if param missing", function () {
			o(buildPathname("file:///:id/foo", {param: 1}))
				.equals("file:///:id/foo?param=1")
		})
		o("skips template parameters at middle if param missing", function () {
			o(buildPathname("file:///route/:id/foo", {param: 1}))
				.equals("file:///route/:id/foo?param=1")
		})
		o("skips variadic template parameters if param missing", function () {
			o(buildPathname("file:///route/:foo...", {param: "/id/1"}))
				.equals("file:///route/:foo...?param=%2Fid%2F1")
		})
		o("handles escaped values", function() {
			o(buildPathname("file:///route/:foo", {"foo": ";:@&=+$,/?%#"}))
				.equals("file:///route/%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
		})
		o("handles unicode", function() {
			o(buildPathname("file:///route/:ö", {"ö": "ö"}))
				.equals("file:///route/%C3%B6")
		})
		o("handles zero", function() {
			o(buildPathname("file:///route/:a", {a: 0}))
				.equals("file:///route/0")
		})
		o("handles false", function() {
			o(buildPathname("file:///route/:a", {a: false}))
				.equals("file:///route/false")
		})
		o("handles dashes", function() {
			o(buildPathname("file:///:lang-:region/route", {lang: "en", region: "US"}))
				.equals("file:///en-US/route")
		})
		o("handles dots", function() {
			o(buildPathname("file:///:file.:ext/view", {file: "image", ext: "png"}))
				.equals("file:///image.png/view")
		})
		o("merges query strings", function() {
			o(buildPathname("file:///item?a=1&b=2", {c: 3}))
				.equals("file:///item?a=1&b=2&c=3")
		})
		o("merges query strings with other parameters", function() {
			o(buildPathname("file:///item/:id?a=1&b=2", {id: "foo", c: 3}))
				.equals("file:///item/foo?a=1&b=2&c=3")
		})
		o("consumes template parameters without modifying query string", function() {
			o(buildPathname("file:///item/:id?a=1&b=2", {id: "foo"}))
				.equals("file:///item/foo?a=1&b=2")
		})
	})
})
