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

// Note: this tests against the generated bundle in browsers, but it tests
// against `index.js` in Node. Please do keep that in mind while testing.
//
// Mithril.js and Benchmark.js are loaded globally via bundle in the browser, so
// this doesn't require a CommonJS sham polyfill.

// I add it globally just so it's visible in the tests.
/* global m, Benchmark, global, window, document, rootElem: true */

import isBrowser from "./is-browser.js"

import {nestedTree} from "./components/nested-tree.js"
import {simpleTree} from "./components/simple-tree.js"

// eslint-disable-next-line no-undef
var globalObject = typeof globalThis !== "undefined" ? globalThis : isBrowser ? window : global

globalObject.rootElem = null

function cycleRoot() {
	if (rootElem) document.body.removeChild(rootElem)
	document.body.appendChild(rootElem = document.createElement("div"))
}

// Initialize benchmark suite
Benchmark.options.async = true
Benchmark.options.initCount = 10
Benchmark.options.minSamples = 40

if (isBrowser) {
	// Wait long enough for the browser to actually commit the DOM changes to
	// the screen before moving on to the next cycle, so things are at least
	// reasonably fresh each cycle.
	Benchmark.options.delay = 1 / 30 /* frames per second */
}

var suite = new Benchmark.Suite("Mithril.js perf", {
	onStart: function () {
		this.start = Date.now()
	},

	onCycle: function (e) {
		console.log(e.target.toString())
		cycleRoot()
	},

	onComplete: function () {
		console.log("Completed perf tests in " + (Date.now() - this.start) + "ms")
	},

	onError: function (e) {
		console.error(e)
	},
})
// eslint-disable-next-line no-unused-vars
var xsuite = {add: function(name) { console.log("skipping " + name) }}

globalObject.simpleTree = simpleTree
globalObject.nestedTree = nestedTree

suite.add("construct simple tree", {
	fn: function () {
		simpleTree()
	},
})

suite.add("mount simple tree", {
	fn: function () {
		m.mount(rootElem, simpleTree)
	}
})

suite.add("redraw simple tree", {
	setup: function () {
		m.mount(rootElem, simpleTree)
	},
	fn: function () {
		m.redrawSync()
	},
})

suite.add("mount large nested tree", {
	fn: function () {
		m.mount(rootElem, nestedTree)
	}
})

suite.add("redraw large nested tree", {
	setup: function () {
		m.mount(rootElem, nestedTree)
	},
	fn: function () {
		m.redrawSync()
	},
})

suite.add("mutate styles/properties", {
	setup: function () {
		function get(obj, i) { return obj[i % obj.length] }
		var counter = 0
		var classes = ["foo", "foo bar", "", "baz-bat", null, "fooga", null, null, undefined]
		var styles = []
		var multivalue = ["0 1px", "0 0 1px 0", "0", "1px", "20px 10px", "7em 5px", "1px 0 5em 2px"]
		var stylekeys = [
			["left", function (c) { return c % 3 ? c + "px" : c }],
			["top", function (c) { return c % 2 ? c + "px" : c }],
			["margin", function (c) { return get(multivalue, c).replace("1px", c+"px") }],
			["padding", function (c) { return get(multivalue, c) }],
			["position", function (c) { return c%5 ? c%2 ? "absolute" : "relative" : null }],
			["display", function (c) { return c%10 ? c%2 ? "block" : "inline" : "none" }],
			["color", function (c) { return ("rgba(" + (c%255) + ", " + (255 - c%255) + ", " + (50+c%150) + ", " + (c%50/50) + ")") }],
			["border", function (c) { return c%5 ? (c%10) + "px " + (c%2?"solid":"dotted") + " " + stylekeys[6][1](c) : "" }]
		]
		var i, j, style, conf

		for (i=0; i<1000; i++) {
			style = {}
			for (j=0; j<i%10; j++) {
				conf = get(stylekeys, ++counter)
				style[conf[0]] = conf[1](counter)
			}
			styles[i] = style
		}

		var count = 0

		this.app = function () {
			var vnodes = []
			for (var index = ++count, last = index + 300; index < last; index++) {
				vnodes.push(
					m("div.booga",
						{
							class: get(classes, index),
							"data-index": index,
							title: index.toString(36)
						},
						m("input.dooga", {type: "checkbox", checked: index % 3 === 0}),
						m("input", {value: "test " + Math.floor(index / 4), disabled: index % 10 ? null : true}),
						m("div", {class: get(classes, index * 11)},
							m("p", {style: get(styles, index)}, "p1"),
							m("p", {style: get(styles, index + 1)}, "p2"),
							m("p", {style: get(styles, index * 2)}, "p3"),
							m("p.zooga", {style: get(styles, index * 3 + 1), className: get(classes, index * 7)}, "p4")
						)
					)
				)
			}
			return vnodes
		}
	},
	fn: function () {
		m.render(rootElem, this.app())
	},
})

suite.add("repeated add/removal", {
	setup: function () {
		var RepeatedHeader = () => m("header",
			m("h1.asdf", "a ", "b", " c ", 0, " d"),
			m("nav",
				m("a", {href: "/foo"}, "Foo"),
				m("a", {href: "/bar"}, "Bar")
			)
		)

		var RepeatedForm = () => m("form", {onSubmit: function () {}},
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
			m(RepeatedButtonBar, null)
		)

		var RepeatedButtonBar = () => m(".button-bar",
			m(RepeatedButton,
				{style: "width:10px; height:10px; border:1px solid #FFF;"},
				"Normal CSS"
			),
			m(RepeatedButton,
				{style: "top:0 ; right: 20"},
				"Poor CSS"
			),
			m(RepeatedButton,
				{style: "invalid-prop:1;padding:1px;font:12px/1.1 arial,sans-serif;", icon: true},
				"Poorer CSS"
			),
			m(RepeatedButton,
				{style: {margin: 0, padding: "10px", overflow: "visible"}},
				"Object CSS"
			)
		)

		var RepeatedButton = (attrs) => m("button", attrs)

		var RepeatedMain = () => m(RepeatedForm)

		this.RepeatedRoot = () => m("div.foo.bar[data-foo=bar]",
			{p: 2},
			m(RepeatedHeader, null),
			m(RepeatedMain, null)
		)
	},
	fn: function () {
		m.render(rootElem, [m(this.RepeatedRoot)])
		m.render(rootElem, [])
	},
})

suite.add("reorder keyed list", {
	setup: function () {
		const keys = []
		for (let i = 0; i < 1000; i++) keys.push(`key-${i}`)

		function shuffle() {
			// Performs a simple Fisher-Yates shuffle.
			let current = keys.length
			while (current) {
				// eslint-disable-next-line no-bitwise
				const index = (Math.random() * current--) | 0
				const temp = keys[index]
				keys[index] = keys[current]
				keys[current] = temp
			}
		}

		this.app = function () {
			shuffle()
			var vnodes = []
			for (const key of keys) {
				vnodes.push(m("div.item", {key}))
			}
			return vnodes
		}
	},
	fn: function () {
		m.render(rootElem, this.app())
	},
})

if (isBrowser) {
	window.onload = function () {
		cycleRoot()
		suite.run()
	}
} else {
	cycleRoot()
	suite.run()
}
