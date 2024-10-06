import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("attributes", function() {
	var $window, root
	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.body
	})
	o.spec("basics", function() {
		o("works (create/update/remove)", function() {

			var a = m("div")
			var b = m("div", {id: "test"})
			var c = m("div")

			m.render(root, a);

			o(a.dom.hasAttribute("id")).equals(false)

			m.render(root, b);

			o(b.dom.getAttribute("id")).equals("test")

			m.render(root, c);

			o(c.dom.hasAttribute("id")).equals(false)
		})
		o("undefined attr is equivalent to a lack of attr", function() {
			var a = m("div", {id: undefined})
			var b = m("div", {id: "test"})
			var c = m("div", {id: undefined})

			m.render(root, a);

			o(a.dom.hasAttribute("id")).equals(false)

			m.render(root, b);

			o(b.dom.hasAttribute("id")).equals(true)
			o(b.dom.getAttribute("id")).equals("test")

			// #1804
			m.render(root, c);

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

			m.render(root, [
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

			m.render(root, [
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

			m.render(root, a)

			o(a.dom.attributes["readonly"].value).equals("")
		})
		o("when input readonly is false, attribute is not present", function() {
			var a = m("input", {readonly: false})

			m.render(root, a)

			o(a.dom.attributes["readonly"]).equals(undefined)
		})
	})
	o.spec("input checked", function() {
		o("when input checked is true, attribute is not present", function() {
			var a = m("input", {checked: true})

			m.render(root, a)

			o(a.dom.checked).equals(true)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
		o("when input checked is false, attribute is not present", function() {
			var a = m("input", {checked: false})

			m.render(root, a)

			o(a.dom.checked).equals(false)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
		o("after input checked is changed by 3rd party, it can still be changed by render", function() {
			var a = m("input", {checked: false})
			var b = m("input", {checked: true})

			m.render(root, a)

			a.dom.checked = true //setting the javascript property makes the value no longer track the state of the attribute
			a.dom.checked = false

			m.render(root, b)

			o(a.dom.checked).equals(true)
			o(a.dom.attributes["checked"]).equals(undefined)
		})
	})
	o.spec("input.value", function() {
		o("can be set as text", function() {
			var a = m("input", {value: "test"})

			m.render(root, a);

			o(a.dom.value).equals("test")
		})
		o("a lack of attribute removes `value`", function() {
			var a = m("input")
			var b = m("input", {value: "test"})
			var c = m("input")

			m.render(root, a)

			o(a.dom.value).equals("")

			m.render(root, b)

			o(a.dom.value).equals("test")

			// https://github.com/MithrilJS/mithril.js/issues/1804#issuecomment-304521235
			m.render(root, c)

			o(a.dom.value).equals("")
		})
		o("can be set as number", function() {
			var a = m("input", {value: 1})

			m.render(root, a);

			o(a.dom.value).equals("1")
		})
		o("null becomes the empty string", function() {
			var a = m("input", {value: null})
			var b = m("input", {value: "test"})
			var c = m("input", {value: null})

			m.render(root, a);

			o(a.dom.value).equals("")
			o(a.dom.getAttribute("value")).equals(null)

			m.render(root, b);

			o(b.dom.value).equals("test")
			o(b.dom.getAttribute("value")).equals(null)

			m.render(root, c);

			o(c.dom.value).equals("")
			o(c.dom.getAttribute("value")).equals(null)
		})
		o("'' and 0 are different values", function() {
			var a = m("input", {value: 0})
			var b = m("input", {value: ""})
			var c = m("input", {value: 0})

			m.render(root, a);

			o(a.dom.value).equals("0")

			m.render(root, b);

			o(b.dom.value).equals("")

			// #1595 redux
			m.render(root, c);

			o(c.dom.value).equals("0")
		})
		o("isn't set when equivalent to the previous value and focused", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body

			var a =m("input")
			var b = m("input", {value: "1"})
			var c = m("input", {value: "1"})
			var d = m("input", {value: 1})
			var e = m("input", {value: 2})

			m.render(root, a)
			var spies = $window.__getSpies(a.dom)
			a.dom.focus()

			o(spies.valueSetter.callCount).equals(0)

			m.render(root, b)

			o(b.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, c)

			o(c.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, d)

			o(d.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, e)

			o(d.dom.value).equals("2")
			o(spies.valueSetter.callCount).equals(2)
		})
	})
	o.spec("input.type", function() {
		o("works", function() {
			var $window = domMock()
			var root = $window.document.body

			var a = m("input", {type: "radio"})
			var b = m("input", {type: "text"})
			var c = m("input")

			m.render(root, a)

			o(a.dom.getAttribute("type")).equals("radio")

			m.render(root, b)

			o(b.dom.getAttribute("type")).equals("text")

			m.render(root, c)

			o(c.dom.hasAttribute("type")).equals(false)
		})
	})
	o.spec("textarea.value", function() {
		o("can be removed by not passing a value", function() {
			var a = m("textarea", {value:"x"})
			var b = m("textarea")

			m.render(root, a)

			o(a.dom.value).equals("x")

			// https://github.com/MithrilJS/mithril.js/issues/1804#issuecomment-304521235
			m.render(root, b)

			o(b.dom.value).equals("")
		})
		o("isn't set when equivalent to the previous value and focused", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body

			var a = m("textarea")
			var b = m("textarea", {value: "1"})
			var c = m("textarea", {value: "1"})
			var d = m("textarea", {value: 1})
			var e = m("textarea", {value: 2})

			m.render(root, a)
			var spies = $window.__getSpies(a.dom)
			a.dom.focus()

			o(spies.valueSetter.callCount).equals(0)

			m.render(root, b)

			o(b.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, c)

			o(c.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, d)

			o(d.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, e)

			o(d.dom.value).equals("2")
			o(spies.valueSetter.callCount).equals(2)
		})
	})
	o.spec("link href", function() {
		o("when link href is true, attribute is present", function() {
			var a = m("a", {href: true})

			m.render(root, a)

			o(a.dom.attributes["href"]).notEquals(undefined)
		})
		o("when link href is false, attribute is not present", function() {
			var a = m("a", {href: false})

			m.render(root, a)

			o(a.dom.attributes["href"]).equals(undefined)
		})
	})
	o.spec("canvas width and height", function() {
		o("uses attribute API", function() {
			var canvas = m("canvas", {width: "100%"})

			m.render(root, canvas)

			o(canvas.dom.attributes["width"].value).equals("100%")
			o(canvas.dom.width).equals(100)
		})
	})
	o.spec("svg", function() {
		o("when className is specified then it should be added as a class", function() {
			var a = m("svg", {className: "test"})

			m.render(root, a);

			o(a.dom.attributes["class"].value).equals("test")
		})
		/* eslint-disable no-script-url */
		o("handles xlink:href", function() {
			var vnode = m("svg", {ns: "http://www.w3.org/2000/svg"},
				m("a", {ns: "http://www.w3.org/2000/svg", "xlink:href": "javascript:;"})
			)
			m.render(root, vnode)

			o(vnode.dom.nodeName).equals("svg")
			o(vnode.dom.firstChild.attributes["href"].value).equals("javascript:;")
			o(vnode.dom.firstChild.attributes["href"].namespaceURI).equals("http://www.w3.org/1999/xlink")

			vnode = m("svg", {ns: "http://www.w3.org/2000/svg"},
				m("a", {ns: "http://www.w3.org/2000/svg"})
			)
			m.render(root, vnode)

			o(vnode.dom.nodeName).equals("svg")
			o("href" in vnode.dom.firstChild.attributes).equals(false)
		})
		/* eslint-enable no-script-url */
	})
	o.spec("option.value", function() {
		o("can be set as text", function() {
			var a = m("option", {value: "test"})

			m.render(root, a);

			o(a.dom.value).equals("test")
		})
		o("can be set as number", function() {
			var a = m("option", {value: 1})

			m.render(root, a);

			o(a.dom.value).equals("1")
		})
		o("null removes the attribute", function() {
			var a = m("option", {value: null})
			var b = m("option", {value: "test"})
			var c = m("option", {value: null})

			m.render(root, a);

			o(a.dom.value).equals("")
			o(a.dom.hasAttribute("value")).equals(false)

			m.render(root, b);

			o(b.dom.value).equals("test")
			o(b.dom.getAttribute("value")).equals("test")

			m.render(root, c);

			o(c.dom.value).equals("")
			o(c.dom.hasAttribute("value")).equals(false)
		})
		o("'' and 0 are different values", function() {
			var a = m("option", {value: 0}, "")
			var b = m("option", {value: ""}, "")
			var c = m("option", {value: 0}, "")

			m.render(root, a);

			o(a.dom.value).equals("0")

			m.render(root, b);

			o(a.dom.value).equals("")

			// #1595 redux
			m.render(root, c);

			o(c.dom.value).equals("0")
		})
		o("isn't set when equivalent to the previous value", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body

			var a = m("option")
			var b = m("option", {value: "1"})
			var c = m("option", {value: "1"})
			var d = m("option", {value: 1})
			var e = m("option", {value: 2})

			m.render(root, a)
			var spies = $window.__getSpies(a.dom)

			o(spies.valueSetter.callCount).equals(0)

			m.render(root, b)

			o(b.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, c)

			o(c.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, d)

			o(d.dom.value).equals("1")
			o(spies.valueSetter.callCount).equals(1)

			m.render(root, e)

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
			m.render(root, select)
		})
		*/
		o("can be set as text", function() {
			var a = makeSelect()
			var b = makeSelect("2")
			var c = makeSelect("a")

			m.render(root, a)

			o(a.dom.value).equals("1")
			o(a.dom.selectedIndex).equals(0)

			m.render(root, b)

			o(b.dom.value).equals("2")
			o(b.dom.selectedIndex).equals(1)

			m.render(root, c)

			o(c.dom.value).equals("a")
			o(c.dom.selectedIndex).equals(2)
		})
		o("setting null unsets the value", function() {
			var a = makeSelect(null)

			m.render(root, a)

			o(a.dom.value).equals("")
			o(a.dom.selectedIndex).equals(-1)
		})
		o("values are type converted", function() {
			var a = makeSelect(1)
			var b = makeSelect(2)

			m.render(root, a)

			o(a.dom.value).equals("1")
			o(a.dom.selectedIndex).equals(0)

			m.render(root, b)

			o(b.dom.value).equals("2")
			o(b.dom.selectedIndex).equals(1)
		})
		o("'' and 0 are different values when focused", function() {
			var a = makeSelect("")
			var b = makeSelect(0)

			m.render(root, a)
			a.dom.focus()

			o(a.dom.value).equals("")

			// #1595 redux
			m.render(root, b)

			o(b.dom.value).equals("0")
		})
		o("'' and null are different values when focused", function() {
			var a = makeSelect("")
			var b = makeSelect(null)
			var c = makeSelect("")

			m.render(root, a)
			a.dom.focus()

			o(a.dom.value).equals("")
			o(a.dom.selectedIndex).equals(4)

			m.render(root, b)

			o(b.dom.value).equals("")
			o(b.dom.selectedIndex).equals(-1)

			m.render(root, c)

			o(c.dom.value).equals("")
			o(c.dom.selectedIndex).equals(4)
		})
		o("updates with the same value do not re-set the attribute if the select has focus", function() {
			var $window = domMock({spy: o.spy})
			var root = $window.document.body

			var a = makeSelect()
			var b = makeSelect("1")
			var c = makeSelect(1)
			var d = makeSelect("2")

			m.render(root, a)
			var spies = $window.__getSpies(a.dom)
			a.dom.focus()

			o(spies.valueSetter.callCount).equals(0)
			o(a.dom.value).equals("1")

			m.render(root, b)

			o(spies.valueSetter.callCount).equals(0)
			o(b.dom.value).equals("1")

			m.render(root, c)

			o(spies.valueSetter.callCount).equals(0)
			o(c.dom.value).equals("1")

			m.render(root, d)

			o(spies.valueSetter.callCount).equals(1)
			o(d.dom.value).equals("2")
		})
	})
	o.spec("contenteditable throws on untrusted children", function() {
		o("including elements", function() {
			var div = m("div", {contenteditable: true}, m("script", {src: "http://evil.com"}))
			var succeeded = false

			try {
				m.render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(false)
		})
		o("tolerating empty children", function() {
			var div = m("div", {contenteditable: true})
			var succeeded = false

			try {
				m.render(root, div)

				succeeded = true
			}
			catch(e){/* ignore */}

			o(succeeded).equals(true)
		})
	})
	o.spec("mutate attr object", function() {
		o("throw when reusing attrs object", function() {
			const attrs = {className: "on"}
			m.render(root, {tag: "input", attrs})

			attrs.className = "off"
			o(() => m.render(root, {tag: "input", attrs})).throws(Error)
		})
	})
})
