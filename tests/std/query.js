import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("query", () => {
	o("handles flat object", () => {
		var string = m.query({a: "b", c: 1})

		o(string).equals("a=b&c=1")
	})
	o("handles escaped values", () => {
		var data = m.query({";:@&=+$,/?%#": ";:@&=+$,/?%#"})

		o(data).equals("%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23=%3B%3A%40%26%3D%2B%24%2C%2F%3F%25%23")
	})
	o("handles unicode", () => {
		var data = m.query({"ö": "ö"})

		o(data).equals("%C3%B6=%C3%B6")
	})
	o("handles nested object in query string", () => {
		var string = m.query({a: {b: 1, c: 2}})

		o(string).equals("a%5Bb%5D=1&a%5Bc%5D=2")
	})
	o("handles deep nested object in query string", () => {
		var string = m.query({a: {b: {c: 1, d: 2}}})

		o(string).equals("a%5Bb%5D%5Bc%5D=1&a%5Bb%5D%5Bd%5D=2")
	})
	o("handles nested array in query string", () => {
		var string = m.query({a: ["x", "y"]})

		o(string).equals("a%5B%5D=x&a%5B%5D=y")
	})
	o("handles array w/ dupe values in query string", () => {
		var string = m.query({a: ["x", "x"]})

		o(string).equals("a%5B%5D=x&a%5B%5D=x")
	})
	o("handles deep nested array in query string", () => {
		var string = m.query({a: [["x", "y"]]})

		o(string).equals("a%5B%5D%5B%5D=x&a%5B%5D%5B%5D=y")
	})
	o("handles deep nested array in object in query string", () => {
		var string = m.query({a: {b: ["x", "y"]}})

		o(string).equals("a%5Bb%5D%5B%5D=x&a%5Bb%5D%5B%5D=y")
	})
	o("handles deep nested object in array in query string", () => {
		var string = m.query({a: [{b: 1, c: 2}]})

		o(string).equals("a%5B%5D%5Bb%5D=1&a%5B%5D%5Bc%5D=2")
	})
	o("handles date in query string", () => {
		var string = m.query({a: new Date(0)})

		o(string).equals(`a=${encodeURIComponent(new Date(0).toString())}`)
	})
	o("handles zero in query string", () => {
		var string = m.query({a: 0})

		o(string).equals("a=0")
	})
	o("retains empty string literally", () => {
		var string = m.query({a: ""})

		o(string).equals("a=")
	})
	o("drops `null` from query string", () => {
		var string = m.query({a: null})

		o(string).equals("")
	})
	o("drops `undefined` from query string", () => {
		var string = m.query({a: undefined})

		o(string).equals("")
	})
	o("turns `true` into value-less string in query string", () => {
		var string = m.query({a: true})

		o(string).equals("a")
	})
	o("drops `false` from query string", () => {
		var string = m.query({a: false})

		o(string).equals("")
	})
})
