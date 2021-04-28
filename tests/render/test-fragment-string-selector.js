"use strict"

var o = require("ospec")
var loadMithril = require("../../test-utils/loadMithril")

o.spec("fragment-string-selector", function() {
	var m

	o.beforeEach(function () {
		m = loadMithril()
	})

	o("works", function() {
		var attrs = {foo: 5}
		var child = {tag: "p"}
		var frag = m("[", attrs, [child])

		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(1)
		o(frag.children[0]).equals(child)

		o(frag.attrs).equals(attrs)

		o(frag.key).equals(undefined)
	})
	o("supports keys", function() {
		var attrs = {key: 7}
		var frag = m("[", attrs, [])
		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(0)

		o(frag.attrs).equals(attrs)
		o(frag.attrs.key).equals(7)

		o(frag.key).equals(7)
	})
	o.spec("children with no attrs", function() {
		o("handles string single child", function() {
			var vnode = m("[", ["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m("[", [""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m("[", [1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m("[", [0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m("[", [true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m("[", [false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m("[", [null])

			o(vnode.children[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m("[", [undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m("[", ["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m("[", [0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m("[", [false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m("[", [null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles falsy number single child without attrs", function() {
			var vnode = m("[", 0)

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
	})
	o.spec("children with attrs", function() {
		o("handles string single child", function() {
			var vnode = m("[", {}, ["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m("[", {}, [""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m("[", {}, [1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m("[", {}, [0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m("[", {}, [true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m("[", {}, [false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m("[", {}, [null])

			o(vnode.children).deepEquals([null])
		})
		o("handles undefined single child", function() {
			var vnode = m("[", {}, [undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m("[", {}, ["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m("[", {}, [0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m("[", {}, [false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m("[", {}, [null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
	})
})
