"use strict"

var o = require("ospec")
var loadMithril = require("../../test-utils/loadMithril")

o.spec("fragment", function() {
	var m

	o.beforeEach(function () {
		m = loadMithril()
	})

	o("works", function() {
		var attrs = {foo: 5}
		var child = {tag: "p"}
		var frag = m.fragment(attrs, [child])

		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(1)
		o(frag.children[0]).equals(child)

		o(frag.attrs).equals(attrs)

		o(frag.key).equals(undefined)
	})
	o("supports keys", function() {
		var attrs = {key: 7}
		var frag = m.fragment(attrs, [])
		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(0)

		o(frag.attrs).equals(attrs)
		o(frag.attrs.key).equals(7)

		o(frag.key).equals(7)
	})
	o.spec("children with no attrs", function() {
		o("handles string single child", function() {
			var vnode = m.fragment(["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m.fragment([""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m.fragment([1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m.fragment([0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m.fragment([true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m.fragment([false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m.fragment([null])

			o(vnode.children[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m.fragment([undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m.fragment(["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m.fragment([0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m.fragment([false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m.fragment([null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles falsy number single child without attrs", function() {
			var vnode = m.fragment(0)

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
	})
	o.spec("children with attrs", function() {
		o("handles string single child", function() {
			var vnode = m.fragment({}, ["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m.fragment({}, [""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m.fragment({}, [1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m.fragment({}, [0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m.fragment({}, [true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m.fragment({}, [false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m.fragment({}, [null])

			o(vnode.children).deepEquals([null])
		})
		o("handles undefined single child", function() {
			var vnode = m.fragment({}, [undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m.fragment({}, ["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m.fragment({}, [0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m.fragment({}, [false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m.fragment({}, [null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
	})
})
