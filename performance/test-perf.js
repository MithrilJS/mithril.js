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

var now = typeof performance!=="undefined" && performance.now ? () => performance.now() : () => Number(new Date());

function loop(iter, time) {
	var start = now(),
		count = 0;
	while (now()-start < time) {
		count++;
		iter();
	}
	return count;
}

function benchmark(iter, callback) {
	var a = 0, // eslint-disable-line no-unused-vars
		count = 2,
		time = 500,
		passes = 0,
		noops = loop(noop, time),
		iterations = 0,
		i;

	function noop() {
		try { a++; } finally { a += Math.random(); }
	}

	// warm
	for(i=100; i--;) noop(), iter();

	function next() {
		iterations += loop(iter, time);
		setTimeout(++passes===count ? done : next, 10);
	}

	function done() {
		var ticks = Math.round(noops / iterations * count),
			hz = iterations / count / time * 1000,
			message = `${Math.floor(hz)}/s (${ticks} ticks)`;
		callback({iterations, noops, count, time, ticks, hz, message});
	}

	next();
}

o.spec("perf", function() {
	var m, scratch

	o.before(() => {
		var doc = typeof document !== "undefined" ? document : null;

		if(!doc) {
			var mock = browserMock()
			if (typeof global !== "undefined") global.window = mock

			doc = mock.document;
		}
		m = require("../mithril") // eslint-disable-line global-require

		scratch = doc.createElement("div");
		(doc.body || doc.documentElement).appendChild(scratch);
	})

	o.afterEach(() => {
		scratch.innerHTML = "";
	})

	o.after(() => {
		scratch = null
	})

	o("rerender without changes", (done, timeout) => {
		timeout(5000);

		var vdom = m("div", {"class": "foo bar", "data-foo": "bar", p: 2},
			m("header",
				m("h1", {"class": "asdf"}, "a ", "b", " c ", 0, " d"),
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
		);

		benchmark(
			() => m.render(scratch, vdom),
			({ticks, message}) => {
				console.log(`PERF: rerender without changes: ${message}`);

				o(ticks < 150).equals(true);

				done();
			}
		);
	});

	o("repeated trees", (done, timeout) => {
		timeout(5000);

		var Header = {
			view : () => m("header",
				m("h1", {"class": "asdf"}, "a ", "b", " c ", 0, " d"),
				m("nav",
					m("a", {href: "/foo"}, "Foo"),
					m("a", {href: "/bar"}, "Bar")
				)
			)
		}

		var Form = {
			view : () => m("form", {onSubmit: function onSubmit() {}},
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

		var ButtonBar = {
			view : () => m("button-bar",
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

		var Button = {
			view : (vnode) => m("button", vnode.attrs, vnode.children)
		}

		var Main = {
			view : () => m(Form)
		}

		var Root = {
			view : () => m("div",
				{"class": "foo bar", "data-foo": "bar", p: 2},
				m(Header, null),
				m(Main, null)
			)
		}

		var Empty = {
			view : () => m("div")
		}

		var Parent = {
			view : (vnode) => m(vnode.attrs.child)
		}

		benchmark(
			() => {
				m.render(scratch, m(Parent, {child : Root}));
				m.render(scratch, m(Parent, {child : Empty}));
			},
			({ticks, message}) => {
				console.log(`PERF: repeated trees: ${message}`);

				o(ticks < 2000).equals(true);

				done();
			}
		);
	});

	o("large VDOM tree", (done, timeout) => {
		timeout(5000);

		var fields = [],
			out = [];

		for(let i=100; i--;) fields.push((i*999).toString(36));

		function digest(vnode) {
			out.push(vnode);
			out.length = 0;
		}

		benchmark(
			() => digest(
				m("div", {"class": "foo bar", "data-foo": "bar", p: 2},
					m("header",
						m("h1", {"class": "asdf"}, "a ", "b", " c ", 0, " d"),
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
								fields.map((field) => m("label",
									field,
									":",
									m("input", {placeholder: field})
								))
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
				)),
			({ticks, message}) => {
				console.log(`PERF: large VDOM tree: ${message}`);

				o(ticks < 2000).equals(true);

				done();
			}
		);
	});

	o("mutate styles/properties", (done, timeout) => {
		timeout(5000);

		var counter = 0
		var keyLooper = (n) => (c) => c % n ? `${c}px` : c
		var get = (obj, i) => obj[i%obj.length]
		var classes = ["foo", "foo bar", "", "baz-bat", null]
		var styles = []
		var multivalue = ["0 1px", "0 0 1px 0", "0", "1px", "20px 10px", "7em 5px", "1px 0 5em 2px"]
		var stylekeys = [
			["left", keyLooper(3)],
			["top", keyLooper(2)],
			["margin", (c) => get(multivalue, c).replace("1px", c+"px")],
			["padding", (c) => get(multivalue, c)],
			["position", (c) => c%5 ? c%2 ? "absolute" : "relative" : null],
			["display", (c) => c%10 ? c%2 ? "block" : "inline" : "none"],
			["color", (c) => `rgba(${c%255}, ${255 - c%255}, ${50+c%150}, ${c%50/50})`],
			["border", (c) => c%5 ? `${c%10}px ${c%2?"solid":"dotted"} ${stylekeys[6][1](c)}` : ""]
		]
		var count = 0
		var i, j, style, conf, app

		for (i=0; i<1000; i++) {
			style = {};
			for (j=0; j<i%10; j++) {
				conf = get(stylekeys, ++counter);
				style[conf[0]] = conf[1](counter);
			}
			styles[i] = style;
		}

		app = (index) => m("div",
			{"class": get(classes, index), "data-index": index, title: index.toString(36)},
			m("input", {type: "checkbox", checked: index % 3 == 0}),
			m("input", {value: "test " + (Math.floor(index / 4)), disabled: index % 10 ? null : true}),
			m("div", {"class": get(classes, index * 10)},
				m("p", {style: get(styles, index)}, "p1"),
				m("p", {style: get(styles, index + 1)}, "p2"),
				m("p", {style: get(styles, index * 2)}, "p3"),
				m("p", {style: get(styles, index * 3 + 1)}, "p4")
			)
		);

		benchmark(
			() => m.render(scratch, app(++count)),
			({ticks, message}) => {
				console.log(`PERF: mutate styles/properties: ${message}`);

				o(ticks < 350).equals(true);

				done();
			}
		);
	});
})

o.run();
