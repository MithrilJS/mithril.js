"use strict"

var o = require("../../ospec/ospec")
var domMock = require("../../test-utils/domMock")
var hyperscript = require("../../test-utils/hyperscript")
var m = hyperscript.m
var t = hyperscript.t

var vdom = require("../../render/render")

o.spec("form inputs", function() {
	var $window, root, render
	o.beforeEach(function() {
		$window = domMock()
		render = vdom($window).render
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

		o("syncs input value if DOM value differs from vdom value", function() {
			var input = m("input", {value: "aaa", oninput: function() {}})
			var updated = m("input", {value: "aaa", oninput: function() {}})

			render(root, [input])

			//simulate user typing
			var e = $window.document.createEvent("KeyboardEvent")
			e.initEvent("input", true, true)
			input.dom.focus()
			input.dom.value += "a"
			input.dom.dispatchEvent(e)

			//re-render may use same vdom value as previous render call
			render(root, [updated])

			o(updated.dom.value).equals("aaa")
		})

		o("syncs input checked attribute if DOM value differs from vdom value", function() {
			var input = m("input", {type: "checkbox", checked: true, onclick: function() {}})
			var updated = m("input", {type: "checkbox", checked: true, onclick: function() {}})

			render(root, [input])

			//simulate user clicking checkbox
			var e = $window.document.createEvent("MouseEvents")
			e.initEvent("click", true, true)
			input.dom.focus()
			input.dom.dispatchEvent(e)

			//re-render may use same vdom value as previous render call
			render(root, [updated])

			o(updated.dom.checked).equals(true)
		})
	})

	o.spec("select", function() {
		o("select works without attributes", function() {
			var select = m("select", [
				t("option", {value: "a"}, "aaa"),
			])

			render(root, [select])

			o(select.dom.value).equals("a")
			o(select.dom.selectedIndex).equals(0)
		})

		o("select yields invalid value without children", function() {
			var select = m("select", {value: "a"})

			render(root, [select])

			o(select.dom.value).equals("")
			o(select.dom.selectedIndex).equals(-1)
		})

		o("select value is set correctly on first render", function() {
			var select = m("select", {value: "b"}, [
				t("option", {value: "a"}, "aaa"),
				t("option", {value: "b"}, "bbb"),
				t("option", {value: "c"}, "ccc"),
			])

			render(root, [select])

			o(select.dom.value).equals("b")
			o(select.dom.selectedIndex).equals(1)
		})

		o("syncs select value if DOM value differs from vdom value", function() {
			function makeSelect() {
				return m("select", {value: "b"}, [
					t("option", {value: "a"}, "aaa"),
					t("option", {value: "b"}, "bbb"),
					t("option", {value: "c"}, "ccc"),
				])
			}

			render(root, [makeSelect()])

			//simulate user selecting option
			root.firstChild.value = "c"
			root.firstChild.focus()

			//re-render may use same vdom value as previous render call
			render(root, [makeSelect()])

			o(root.firstChild.value).equals("b")
			o(root.firstChild.selectedIndex).equals(1)
		})
	})

	o.spec("textarea", function() {
		o("updates after user input", function() {
			render(root, [t("textarea", "aaa")])

			//simulate typing
			root.firstChild.value = "bbb"

			//re-render may occur after value attribute is touched
			render(root, [t("textarea", "ccc")])

			o(root.firstChild.value).equals("ccc")
			//FIXME should fail if fix is commented out
		})
	})
})
