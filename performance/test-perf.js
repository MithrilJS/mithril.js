/* eslint-disable no-confusing-arrow */
"use strict"

/* Based off of preact's perf tests, so including their MIT license */
/*
The MIT License (MIT)

Copyright (c) 2017 Jason Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var o = require("../ospec/ospec")
var browserMock = require("../test-utils/browserMock")

var now = typeof performance!=="undefined" && performance.now ? function () { return performance.now() } : function () { return Date.now() }

function verify(name, threshold, done) {
	return function(result) {
		console.log(
			name + ": " +
			Math.floor(result.hz) + "/s (" +
				result.ticks + " ticks, " +
				Math.floor((result.ticks / threshold) * 100) + "% of threshold" +
			")"
		)

		o(result.ticks <= threshold).equals(true)(result.ticks + " ticks, " + threshold + " allowed")

		done()
	}
}

function loop(iter, time) {
	var start = now(),
		count = 0

	// Run as many instances of iter as possible
	while (now() - start < time) {
		count++
		iter()
	}

	return count
}

function benchmark(iter, callback) {
	var a = 0, // eslint-disable-line no-unused-vars
		count = 5,
		time = 500,
		passes = 0,
		total = 0,
		noops, i

	function noop() {
		try { a++ } finally { a += Math.random() }
	}

	// warm
	for(i=100; i--;) {
		noop()
		iter()
	}

	// Count how many noops() occur in the time period
	noops = loop(noop, time)

	// run iter() through loop() `count` times
	function next() {
		total += loop(iter, time)

		setTimeout(++passes === count ? done : next, 10)
	}

	function done() {
		callback({
			total : total,
			noops : noops,
			count : count,
			time  : time,
			ticks : Math.round(noops / total * count),
			hz    : total / count / time * 1000
		})
	}

	next()
}

o.spec("perf", function() {
	var m, scratch

	o.before(function () {
		var doc = typeof document !== "undefined" ? document : null

		if(!doc) {
			var mock = browserMock()
			if (typeof global !== "undefined") { global.window = mock }

			doc = mock.document
		}

		m = require("../mithril") // eslint-disable-line global-require

		scratch = doc.createElement("div");
		(doc.body || doc.documentElement).appendChild(scratch)
	})

	o.afterEach(function () {
		scratch.innerHTML = ""
	})

	o.after(function () {
		scratch = null
	})

	o("rerender without changes", function (done, timeout) {
		timeout(5000)

		var vdom = m("div", {class: "foo bar", "data-foo": "bar", p: 2},
			m("header",
				m("h1", {class: "asdf"}, "a ", "b", " c ", 0, " d"),
				m("nav",
					m("a", {href: "/foo"}, "Foo"),
					m("a", {href: "/bar"}, "Bar")
				)
			),
			m("main",
				m("form", {onSubmit: function onSubmit() {}},
					m("input", {type: "checkbox", checked: true}),
					m("input", {type: "checkbox", checked: false}),
					m("fieldset",
						m("label",
							m("input", {type: "radio", checked: true})
						),
						m("label",
							m("input", {type: "radio"})
						)
					),
					m("button-bar",
						m("button",
							{style: "width:10px; height:10px; border:1px solid #FFF;"},
							"Normal CSS"
						),
						m("button",
							{style: "top:0 ; right: 20"},
							"Poor CSS"
						),
						m("button",
							{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
							"Poorer CSS"
						),
						m("button",
							{style: {margin: 0, padding: "10px", overflow: "visible"}},
							"Object CSS"
						)
					)
				)
			)
		)

		benchmark(
			function () {
				m.render(scratch, vdom)
			},
			verify("rerender without changes", 5, done)
		)
	})

	o("repeated trees", function (done, timeout) {
		timeout(5000)

		var Header = {
			view : function () {
				return m("header",
					m("h1", {class: "asdf"}, "a ", "b", " c ", 0, " d"),
					m("nav",
						m("a", {href: "/foo"}, "Foo"),
						m("a", {href: "/bar"}, "Bar")
					)
				)
			}
		}

		var Form = {
			view : function () {
				return m("form", {onSubmit: function onSubmit() {}},
					m("input", {type: "checkbox", checked: true}),
					m("input", {type: "checkbox", checked: false}),
					m("fieldset",
						m("label",
							m("input", {type: "radio", checked: true})
						),
						m("label",
							m("input", {type: "radio"})
						)
					),
					m(ButtonBar, null)
				)
			}
		}

		var ButtonBar = {
			view : function () {
				return m("button-bar",
					m(Button,
						{style: "width:10px; height:10px; border:1px solid #FFF;"},
						"Normal CSS"
					),
					m(Button,
						{style: "top:0 ; right: 20"},
						"Poor CSS"
					),
					m(Button,
						{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
						"Poorer CSS"
					),
					m(Button,
						{style: {margin: 0, padding: "10px", overflow: "visible"}},
						"Object CSS"
					)
				)
			}
		}

		var Button = {
			view : function (vnode) {
				return m("button", vnode.attrs, vnode.children)
			}
		}

		var Main = {
			view : function () {
				return m(Form)
			}
		}

		var Root = {
			view : function () {
				return m("div",
					{class: "foo bar", "data-foo": "bar", p: 2},
					m(Header, null),
					m(Main, null)
				)
			}
		}

		benchmark(
			function () {
				m.render(scratch, [m(Root)])
				m.render(scratch, [])
			},
			verify("repeated trees", 3500, done)
		)
	})

	o("construct large VDOM tree", function (done, timeout) {
		timeout(5000)

		var fields = [],
			out = []

		for(var i=100; i--;) {
			fields.push((i * 999).toString(36))
		}

		function digest(vnode) {
			out.push(vnode)
			out.length = 0
		}

		benchmark(
			function () {
				return digest(
					m("div", {class: "foo bar", "data-foo": "bar", p: 2},
						m("header",
							m("h1", {class: "asdf"}, "a ", "b", " c ", 0, " d"),
							m("nav",
								m("a", {href: "/foo"}, "Foo"),
								m("a", {href: "/bar"}, "Bar")
							)
						),
						m("main",
							m("form",
								{onSubmit: function onSubmit() {}},
								m("input", {type: "checkbox", checked: true}),
								m("input", {type: "checkbox"}),
								m("fieldset",
									fields.map(function (field) {
										return m("label",
											field,
											":",
											m("input", {placeholder: field})
										)
									})
								),
								m("button-bar",
									m("button",
										{style: "width:10px; height:10px; border:1px solid #FFF;"},
										"Normal CSS"
									),
									m("button",
										{style: "top:0 ; right: 20"},
										"Poor CSS"
									),
									m("button",
										{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
										"Poorer CSS"
									),
									m("button",
										{style: {margin: 0, padding: "10px", overflow: "visible"}},
										"Object CSS"
									)
								)
							)
						)
					)
				)
			},
			verify("construct large VDOM tree", 2500, done)
		)
	})

	o("mutate styles/properties", function (done, timeout) {
		timeout(5000)

		var counter = 0
		var keyLooper = function (n) { return function (c) { return c % n ? (c + "px") : c } }
		var get = function (obj, i) { return obj[i%obj.length] }
		var classes = ["foo", "foo bar", "", "baz-bat", null]
		var styles = []
		var multivalue = ["0 1px", "0 0 1px 0", "0", "1px", "20px 10px", "7em 5px", "1px 0 5em 2px"]
		var stylekeys = [
			["left", keyLooper(3)],
			["top", keyLooper(2)],
			["margin", function (c) { return get(multivalue, c).replace("1px", c+"px") }],
			["padding", function (c) { return get(multivalue, c) }],
			["position", function (c) { return c%5 ? c%2 ? "absolute" : "relative" : null }],
			["display", function (c) { return c%10 ? c%2 ? "block" : "inline" : "none" }],
			["color", function (c) { return ("rgba(" + (c%255) + ", " + (255 - c%255) + ", " + (50+c%150) + ", " + (c%50/50) + ")") }],
			["border", function (c) { return c%5 ? ((c%10) + "px " + (c%2?"solid":"dotted") + " " + (stylekeys[6][1](c))) : "" }]
		]
		var count = 0
		var i, j, style, conf, app

		for (i=0; i<1000; i++) {
			style = {}
			for (j=0; j<i%10; j++) {
				conf = get(stylekeys, ++counter)
				style[conf[0]] = conf[1](counter)
			}
			styles[i] = style
		}

		app = function (index) {
			return m("div",
				{
					class: get(classes, index),
					"data-index": index,
					title: index.toString(36)
				},
				m("input", {type: "checkbox", checked: index % 3 == 0}),
				m("input", {value: "test " + (Math.floor(index / 4)), disabled: index % 10 ? null : true}),
				m("div", {class: get(classes, index * 10)},
					m("p", {style: get(styles, index)}, "p1"),
					m("p", {style: get(styles, index + 1)}, "p2"),
					m("p", {style: get(styles, index * 2)}, "p3"),
					m("p", {style: get(styles, index * 3 + 1)}, "p4")
				)
			)
		}

		benchmark(
			function () {
				m.render(scratch, app(++count))
			},
			verify("mutate styles/properties", 300, done)
		)
	})
})

o.run()
