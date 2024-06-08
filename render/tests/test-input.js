"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var vdom = require("../../render/render")
var m = require("../../render/hyperscript")

o.spec("form inputs", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		render = vdom($window)
		root = $window.document.createElement("div")
		$window.document.body.appendChild(root)
	})
	o.afterEach(function() {
		while (root.firstChild) root.removeChild(root.firstChild)
		root.vnodes = null
	})

	o.spec("input", function() {
		o("maintains focus after move", function() {
			var input = m("input", {key: 1})
			var a = m("a", {key: 2})
			var b = m("b", {key: 3})

			render(root, [input, a, b])
			input.dom.focus()
			render(root, [a, input, b])

			o($window.document.activeElement).equals(input.dom)
		})

		o("maintains focus when changed manually in hook", function() {
			var input = m("input", {oncreate: function() {
				input.dom.focus();
			}});

			render(root, input)

			o($window.document.activeElement).equals(input.dom)
		})

		o("syncs input value if DOM value differs from vdom value", function() {
			var input = m("input", {value: "aaa", oninput: function() {}})
			var updated = m("input", {value: "aaa", oninput: function() {}})

			render(root, input)

			//simulate user typing
			var e = $window.document.createEvent("KeyboardEvent")
			e.initEvent("input", true, true)
			input.dom.focus()
			input.dom.value += "a"
			input.dom.dispatchEvent(e)

			//re-render may use same vdom value as previous render call
			render(root, updated)

			o(updated.dom.value).equals("aaa")
		})

		o("clear element value if vdom value is set to undefined (aka removed)", function() {
			var input = m("input", {value: "aaa", oninput: function() {}})
			var updated = m("input", {value: undefined, oninput: function() {}})

			render(root, input)
			render(root, updated)

			o(updated.dom.value).equals("")
		})

		o("syncs input checked attribute if DOM value differs from vdom value", function() {
			var input = m("input", {type: "checkbox", checked: true, onclick: function() {}})
			var updated = m("input", {type: "checkbox", checked: true, onclick: function() {}})

			render(root, input)

			//simulate user clicking checkbox
			var e = $window.document.createEvent("MouseEvents")
			e.initEvent("click", true, true)
			input.dom.focus()
			input.dom.dispatchEvent(e)

			//re-render may use same vdom value as previous render call
			render(root, updated)

			o(updated.dom.checked).equals(true)
		})

		o("syncs file input value attribute if DOM value differs from vdom value and is empty", function() {
			var input = m("input", {type: "file", value: "", onclick: function() {}})
			var updated = m("input", {type: "file", value: "", onclick: function() {}})
			var spy = o.spy()
			var error = console.error

			render(root, input)

			input.dom.value = "test.png"

			try {
				console.error = spy
				render(root, updated)
			} finally {
				console.error = error
			}

			o(updated.dom.value).equals("")
			o(spy.callCount).equals(0)
		})

		o("warns and ignores file input value attribute if DOM value differs from vdom value and is non-empty", function() {
			var input = m("input", {type: "file", value: "", onclick: function() {}})
			var updated = m("input", {type: "file", value: "other.png", onclick: function() {}})
			var spy = o.spy()
			var error = console.error

			render(root, input)

			input.dom.value = "test.png"

			try {
				console.error = spy
				render(root, updated)
			} finally {
				console.error = error
			}

			o(updated.dom.value).equals("test.png")
			o(spy.callCount).equals(1)
		})

		o("retains file input value attribute if DOM value is the same as vdom value and is non-empty", function() {
			var $window = domMock(o)
			var render = vdom($window)
			var root = $window.document.createElement("div")
			$window.document.body.appendChild(root)
			var input = m("input", {type: "file", value: "", onclick: function() {}})
			var updated1 = m("input", {type: "file", value: "test.png", onclick: function() {}})
			var updated2 = m("input", {type: "file", value: "test.png", onclick: function() {}})
			var spy = o.spy()
			var error = console.error

			render(root, input)

			// Verify our assumptions about the outer element state
			o($window.__getSpies(input.dom).valueSetter.callCount).equals(0)
			input.dom.value = "test.png"
			o($window.__getSpies(input.dom).valueSetter.callCount).equals(1)

			try {
				console.error = spy
				render(root, updated1)
			} finally {
				console.error = error
			}

			o(updated1.dom.value).equals("test.png")
			o(spy.callCount).equals(0)
			o($window.__getSpies(updated1.dom).valueSetter.callCount).equals(1)

			try {
				console.error = spy
				render(root, updated2)
			} finally {
				console.error = error
			}

			o(updated2.dom.value).equals("test.png")
			o(spy.callCount).equals(0)
			o($window.__getSpies(updated2.dom).valueSetter.callCount).equals(1)
		})
	})

	o.spec("select", function() {
		o("select works without attributes", function() {
			var select = m("select",
				m("option", {value: "a"}, "aaa")
			)

			render(root, select)

			o(select.dom.value).equals("a")
			o(select.dom.selectedIndex).equals(0)
		})

		o("select option can have empty string value", function() {
			var select = m("select",
				m("option", {value: ""}, "aaa")
			)

			render(root, select)

			o(select.dom.firstChild.value).equals("")
		})

		o("option value defaults to textContent unless explicitly set", function() {
			var select = m("select",
				m("option", "aaa")
			)

			render(root, select)

			o(select.dom.firstChild.value).equals("aaa")
			o(select.dom.value).equals("aaa")

			//test that value changes when content changes
			select = m("select",
				m("option", "bbb")
			)

			render(root, select)

			o(select.dom.firstChild.value).equals("bbb")
			o(select.dom.value).equals("bbb")

			//test that value can be set to "" in subsequent render
			select = m("select",
				m("option", {value: ""}, "aaa")
			)

			render(root, select)

			o(select.dom.firstChild.value).equals("")
			o(select.dom.value).equals("")

			//test that value reverts to textContent when value omitted
			select = m("select",
				m("option", "aaa")
			)

			render(root, select)

			o(select.dom.firstChild.value).equals("aaa")
			o(select.dom.value).equals("aaa")
		})

		o("select yields invalid value without children", function() {
			var select = m("select", {value: "a"})

			render(root, select)

			o(select.dom.value).equals("")
			o(select.dom.selectedIndex).equals(-1)
		})

		o("select value is set correctly on first render", function() {
			var select = m("select", {value: "b"},
				m("option", {value: "a"}, "aaa"),
				m("option", {value: "b"}, "bbb"),
				m("option", {value: "c"}, "ccc")
			)

			render(root, select)

			o(select.dom.value).equals("b")
			o(select.dom.selectedIndex).equals(1)
		})

		o("syncs select value if DOM value differs from vdom value", function() {
			function makeSelect() {
				return m("select", {value: "b"},
					m("option", {value: "a"}, "aaa"),
					m("option", {value: "b"}, "bbb"),
					m("option", {value: "c"}, "ccc")
				)
			}

			render(root, makeSelect())

			//simulate user selecting option
			root.firstChild.value = "c"
			root.firstChild.focus()

			//re-render may use same vdom value as previous render call
			render(root, makeSelect())

			o(root.firstChild.value).equals("b")
			o(root.firstChild.selectedIndex).equals(1)
		})
	})
})
