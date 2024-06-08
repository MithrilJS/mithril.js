"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")
var trust = require("../../render/trust")

o.spec("attributes", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
		render = vdom($window)
	})
	o.spec("basics", function() {
		o("works (create/update/remove)", function() {

			var a = m("div")
			var b = m("div", {id: "test"})
			var c = m("div")

			render(root, a);

			o(a.dom.hasAttribute("id")).equals(false)

			render(root, b);

			o(b.dom.getAttribute("id")).equals("test")

			render(root, c);

			o(c.dom.hasAttribute("id")).equals(false)
		})
		o("undefined attr is equivalent to a lack of attr", function() {
			var a = m("div", {id: undefined})
			var b = m("div", {id: "test"})
			var c = m("div", {id: undefined})

			render(root, a);

			o(a.dom.hasAttribute("id")).equals(false)

			render(root, b);

			o(b.dom.hasAttribute("id")).equals(true)
			o(b.dom.getAttribute("id")).equals("test")

			// #1804
			render(root, c);

			o(c.dom.hasAttribute("id")).equals(false)
		})
	})
	o.spec("customElements", function(){

		o("when vnode is customElement without property, custom setAttribute called", function(){
			var f = $window.document.createElement
			var spies = []

			$window.document.createElement = function(tag, is){
				var el = f(tag, is)
				var spy = o.spy(el.setAttribute)
				el.setAttribute = spy
				spies.push(spy)
				spy.elem = el
				return el
			}

			render(root, [
				m("input", {value: "hello"}),
				m("input", {value: "hello"}),
				m("input", {value: "hello"}),
				m("custom-element", {custom: "x"}),
				m("input", {is: "something-special", custom: "x"}),
				m("custom-element", {is: "something-special", custom: "x"})
			])

			o(spies[1].callCount).equals(0)
			o(spies[0].callCount).equals(0)
			o(spies[2].callCount).equals(0)
			o(spies[3].calls).deepEquals([{this: spies[3].elem, args: ["custom", "x"]}])
			o(spies[4].calls).deepEquals([{this: spies[4].elem, args: ["custom", "x"]}])
			o(spies[5].calls).deepEquals([{this: spies[5].elem, args: ["custom", "x"]}])
		})

		o("when vnode is customElement with property, custom setAttribute not called", function(){
			var f = $window.document.createElement
			var spies = []
			var getters = []
			var setters = []

			$window.document.createElement = function(tag, is){
				var el = f(tag, is)
				var spy = o.spy(el.setAttribute)
				el.setAttribute = spy
				spies.push(spy)
				spy.elem = el
				if (tag === "custom-element" || is && is.is === "something-special") {
					var custom = "foo"
					var getter, setter
					Object.defineProperty(el, "custom", {
						configurable: true,
						enumerable: true,
						get: getter = o.spy(function () { return custom }),
						set: setter = o.spy(function (value) { custom = value })
					})
					getters.push(getter)
					setters.push(setter)
				}
				return el
			}

			render(root, [
				m("input", {value: "hello"}),
				m("input", {value: "hello"}),
				m("input", {value: "hello"}),
				m("custom-element", {custom: "x"}),
				m("input", {is: "something-special", custom: "x"}),
				m("custom-element", {is: "something-special", custom: "x"})
			])

			o(spies[0].callCount).equals(0)
			o(spies[1].callCount).equals(0)
			o(spies[2].callCount).equals(0)
			o(spies[3].callCount).equals(0)
			o(spies[4].callCount).equals(0)
			o(spies[5].callCount).equals(0)
			o(getters[0].callCount).equals(0)
			o(getters[1].callCount).equals(0)
			o(getters[2].callCount).equals(0)
			o(setters[0].calls).deepEquals([{this: spies[3].elem, args: ["x"]}])
			o(setters[1].calls).deepEquals([{this: spies[4].elem, args: ["x"]}])
			o(setters[2].calls).deepEquals([{this: spies[5].elem, args: ["x"]}])
		})

	})
	o.spec("input readonly", function() {
		o("when input readonly is true, attribute is present", function() {
			var a = m("input", {readonly: true})

			render(root, a)

			o(a.dom.attributes["readonly"].value).equals("")
		})
		o("when input readonly is false, attribute is not present", function() {
			var a = m("input", {readonly: false})

			render(root, a)

			o(a.dom.attributes["readonly"]).equals(undefined)
		})
	})
	o.spec("input checked", function() {
		o("when input checked is true, attribute is not present", function() {
			var a = m("input", {checked: true})

			render(root, a)

			o(a.dom.checked).equals(true)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
		o("when input checked is false, attribute is not present", function() {
			var a = m("input", {checked: false})

			render(root, a)

			o(a.dom.checked).equals(false)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
		o("after input checked is changed by 3rd party, it can still be changed by render", function() {
			var a = m("input", {checked: false})
			var b = m("input", {checked: true})

			render(root, a)

			a.dom.checked = true //setting the javascript property makes the value no longer track the state of the attribute
			a.dom.checked = false

			render(root, b)

			o(a.dom.checked).equals(true)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
	})
	o.spec("input.value", function() {
		o("can be set as text", function() {
			var a = m("input", {value: "test"})

			render(root, a);

			o(a.dom.value).equals("test")
		})
		o("a lack of attribute removes `value`", function() {
			var a = m("input")
			var b = m("input", {value: "test"})
			var c = m("input")

			render(root, a)

			o(a.dom.value).equals("")

			render(root, b)

			o(a.dom.value).equals("test")

			// https://github.com/MithrilJS/mithril.js/issues/1804#issuecomment-304521235
			render(root, c)

			o(a.dom.value).equals("")
		})
		o("can be set as number", function() {
			var a = m("input", {value: 1})

			render(root, a);

			o(a.dom.value).equals("1")
		})
		o("null becomes the empty string", function() {
			var a = m("input", {value: null})
			var b = m("input", {value: "test"})
			var c = m("input", {value: null})

			render(root, a);

			o(a.dom.value).equals("")
			o(a.dom.getAttribute("value")).equals(null)

			render(root, b);

			o(b.dom.value).equals("test")
			o(b.dom.getAttribute("value")).equals(null)

			render(root, c);

			o(c.dom.value).equals("")
			o(c.dom.getAttribute("value")).equals(null)
		})
		o("'' and 0 are different values", function() {
			var a = m("input", {value: 0})
			var b = m("input", {value: ""})
			var c = m("input", {value: 0})

			render(root, a);

			o(a.dom.value).equals("0")

			render(root, b);

			o(b.dom.value).equals("")

			// #1595 redux
			render(root, c);

			o(c.dom.value).equals("0")
		})
		o("isn't set when equivalent to the previous value and focused", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body
			var render = vdom($window)

			var a =m("input")
			var b = m("input", {value: "1"})
			var c = m("input", {value: "1"})
			var d = m("input", {value: 1})
			var e = m("input", {value: 2})

			render(root, a)
			var spies = $window.__getSpies(a.dom)
			a.dom.focus()

			o(spies.valueSetter.callCount).equals(0)

			render(root, b)

			o(b.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, c)

			o(c.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, d)

			o(d.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, e)

			o(d.dom.value).equals("2")
			o(spies.valueSetter.callCount).equals(2)
		})
	})
	o.spec("input.type", function() {
		o("the input.type setter is never used", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body
			var render = vdom($window)

			var a = m("input", {type: "radio"})
			var b = m("input", {type: "text"})
			var c = m("input")

			render(root, a)
			var spies = $window.__getSpies(a.dom)

			o(spies.typeSetter.callCount).equals(0)
			o(a.dom.getAttribute("type")).equals("radio")

			render(root, b)

			o(spies.typeSetter.callCount).equals(0)
			o(b.dom.getAttribute("type")).equals("text")

			render(root, c)

			o(spies.typeSetter.callCount).equals(0)
			o(c.dom.hasAttribute("type")).equals(false)
		})
	})
	o.spec("textarea.value", function() {
		o("can be removed by not passing a value", function() {
			var a = m("textarea", {value:"x"})
			var b = m("textarea")

			render(root, a)

			o(a.dom.value).equals("x")

			// https://github.com/MithrilJS/mithril.js/issues/1804#issuecomment-304521235
			render(root, b)

			o(b.dom.value).equals("")
		})
		o("isn't set when equivalent to the previous value and focused", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body
			var render = vdom($window)

			var a = m("textarea")
			var b = m("textarea", {value: "1"})
			var c = m("textarea", {value: "1"})
			var d = m("textarea", {value: 1})
			var e = m("textarea", {value: 2})

			render(root, a)
			var spies = $window.__getSpies(a.dom)
			a.dom.focus()

			o(spies.valueSetter.callCount).equals(0)

			render(root, b)

			o(b.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, c)

			o(c.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, d)

			o(d.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, e)

			o(d.dom.value).equals("2")
			o(spies.valueSetter.callCount).equals(2)
		})
	})
	o.spec("link href", function() {
		o("when link href is true, attribute is present", function() {
			var a = m("a", {href: true})

			render(root, a)

			o(a.dom.attributes["href"]).notEquals(undefined)
		})
		o("when link href is false, attribute is not present", function() {
			var a = m("a", {href: false})

			render(root, a)

			o(a.dom.attributes["href"]).equals(undefined)
		})
	})
	o.spec("canvas width and height", function() {
		o("uses attribute API", function() {
			var canvas = m("canvas", {width: "100%"})

			render(root, canvas)

			o(canvas.dom.attributes["width"].value).equals("100%")
			o(canvas.dom.width).equals(100)
		})
	})
	o.spec("svg", function() {
		o("when className is specified then it should be added as a class", function() {
			var a = m("svg", {className: "test"})

			render(root, a);

			o(a.dom.attributes["class"].value).equals("test")
		})
		/* eslint-disable no-script-url */
		o("handles xlink:href", function() {
			var vnode = m("svg", {ns: "http://www.w3.org/2000/svg"},
				m("a", {ns: "http://www.w3.org/2000/svg", "xlink:href": "javascript:;"})
			)
			render(root, vnode)

			o(vnode.dom.nodeName).equals("svg")
			o(vnode.dom.firstChild.attributes["href"].value).equals("javascript:;")
			o(vnode.dom.firstChild.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")

			vnode = m("svg", {ns: "http://www.w3.org/2000/svg"},
				m("a", {ns: "http://www.w3.org/2000/svg"})
			)
			render(root, vnode)

			o(vnode.dom.nodeName).equals("svg")
			o("href" in vnode.dom.firstChild.attributes).equals(false)
		})
		/* eslint-enable no-script-url */
	})
	o.spec("option.value", function() {
		o("can be set as text", function() {
			var a = m("option", {value: "test"})

			render(root, a);

			o(a.dom.value).equals("test")
		})
		o("can be set as number", function() {
			var a = m("option", {value: 1})

			render(root, a);

			o(a.dom.value).equals("1")
		})
		o("null removes the attribute", function() {
			var a = m("option", {value: null})
			var b = m("option", {value: "test"})
			var c = m("option", {value: null})

			render(root, a);

			o(a.dom.value).equals("")
			o(a.dom.hasAttribute("value")).equals(false)

			render(root, b);

			o(b.dom.value).equals("test")
			o(b.dom.getAttribute("value")).equals("test")

			render(root, c);

			o(c.dom.value).equals("")
			o(c.dom.hasAttribute("value")).equals(false)
		})
		o("'' and 0 are different values", function() {
			var a = m("option", {value: 0}, "")
			var b = m("option", {value: ""}, "")
			var c = m("option", {value: 0}, "")

			render(root, a);

			o(a.dom.value).equals("0")

			render(root, b);

			o(a.dom.value).equals("")

			// #1595 redux
			render(root, c);

			o(c.dom.value).equals("0")
		})
		o("isn't set when equivalent to the previous value", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body
			var render = vdom($window)

			var a = m("option")
			var b = m("option", {value: "1"})
			var c = m("option", {value: "1"})
			var d = m("option", {value: 1})
			var e = m("option", {value: 2})

			render(root, a)
			var spies = $window.__getSpies(a.dom)

			o(spies.valueSetter.callCount).equals(0)

			render(root, b)

			o(b.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, c)

			o(c.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, d)

			o(d.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			render(root, e)

			o(d.dom.value).equals("2")
			o(spies.valueSetter.callCount).equals(2)
		})
	})
	o.spec("select.value", function() {
		function makeSelect(value) {
			var attrs = (arguments.length === 0) ? {} : {value: value}
			return m("select", attrs,
				m("option", {value: "1"}),
				m("option", {value: "2"}),
				m("option", {value: "a"}),
				m("option", {value: "0"}),
				m("option", {value: ""})
			)
		}
		/* FIXME
		   This incomplete test is meant for testing #1916.
		   However it cannot be completed until #1978 is addressed
		   which is a lack a working select.selected / option.selected
		   attribute. Ask @dead-claudia.

		o("render select options", function() {
			var select = m("select", {selectedIndex: 0},
				m("option", {value: "1", selected: ""})
			)
			render(root, select)
		})
		*/
		o("can be set as text", function() {
			var a = makeSelect()
			var b = makeSelect("2")
			var c = makeSelect("a")

			render(root, a)

			o(a.dom.value).equals("1")
			o(a.dom.selectedIndex).equals(0)

			render(root, b)

			o(b.dom.value).equals("2")
			o(b.dom.selectedIndex).equals(1)

			render(root, c)

			o(c.dom.value).equals("a")
			o(c.dom.selectedIndex).equals(2)
		})
		o("setting null unsets the value", function() {
			var a = makeSelect(null)

			render(root, a)

			o(a.dom.value).equals("")
			o(a.dom.selectedIndex).equals(-1)
		})
		o("values are type converted", function() {
			var a = makeSelect(1)
			var b = makeSelect(2)

			render(root, a)

			o(a.dom.value).equals("1")
			o(a.dom.selectedIndex).equals(0)

			render(root, b)

			o(b.dom.value).equals("2")
			o(b.dom.selectedIndex).equals(1)
		})
		o("'' and 0 are different values when focused", function() {
			var a = makeSelect("")
			var b = makeSelect(0)

			render(root, a)
			a.dom.focus()

			o(a.dom.value).equals("")

			// #1595 redux
			render(root, b)

			o(b.dom.value).equals("0")
		})
		o("'' and null are different values when focused", function() {
			var a = makeSelect("")
			var b = makeSelect(null)
			var c = makeSelect("")

			render(root, a)
			a.dom.focus()

			o(a.dom.value).equals("")
			o(a.dom.selectedIndex).equals(4)

			render(root, b)

			o(b.dom.value).equals("")
			o(b.dom.selectedIndex).equals(-1)

			render(root, c)

			o(c.dom.value).equals("")
			o(c.dom.selectedIndex).equals(4)
		})
		o("updates with the same value do not re-set the attribute if the select has focus", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body
			var render = vdom($window)

			var a = makeSelect()
			var b = makeSelect("1")
			var c = makeSelect(1)
			var d = makeSelect("2")

			render(root, a)
			var spies = $window.__getSpies(a.dom)
			a.dom.focus()

			o(spies.valueSetter.callCount).equals(0)
			o(a.dom.value).equals("1")

			render(root, b)

			o(spies.valueSetter.callCount).equals(0)
			o(b.dom.value).equals("1")

			render(root, c)

			o(spies.valueSetter.callCount).equals(0)
			o(c.dom.value).equals("1")

			render(root, d)

			o(spies.valueSetter.callCount).equals(1)
			o(d.dom.value).equals("2")
		})
	})
	o.spec("contenteditable throws on untrusted children", function() {
		o("including elements", function() {
			var div = m("div", {contenteditable: true}, m("script", {src: "http://evil.com"}))
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(false)
		})
		o("tolerating empty children", function() {
			var div = m("div", {contenteditable: true})
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(true)
		})
		o("tolerating trusted content", function() {
			var div = m("div", {contenteditable: true}, trust("<a></a>"))
			var succeeded = false

			try {
				render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(true)
		})
	})
	o.spec("mutate attr object", function() {
		o("warn when reusing attrs object", function() {
			const _consoleWarn = console.warn
			console.warn = o.spy()

			const attrs = {className: "on"}
			render(root, {tag: "input", attrs})

			attrs.className = "off"
			render(root, {tag: "input", attrs})

			o(console.warn.callCount).equals(1)
			o(console.warn.args[0]).equals("Don't reuse attrs object, use new object for every redraw, this will throw in next major")

			console.warn = _consoleWarn
		})
	})
})
