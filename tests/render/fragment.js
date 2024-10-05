"use strict"

var o = require("ospec")
var m = require("../../src/core/hyperscript")

o.spec("fragment literal", function() {
	o("works", function() {
		var child = m("p")
		var frag = m.normalize([child])

		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(1)
		o(frag.children[0]).equals(child)
	})
	o.spec("children", function() {
		o("handles string single child", function() {
			var vnode = m.normalize(["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m.normalize([""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m.normalize([1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m.normalize([0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m.normalize([true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m.normalize([false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m.normalize([null])

			o(vnode.children[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m.normalize([undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m.normalize(["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m.normalize([0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m.normalize([false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m.normalize([null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
	})
})

o.spec("fragment component", function() {
	o("works", function() {
		var child = m("p")
		var frag = m(m.Fragment, null, child)

		o(frag.tag).equals("[")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(1)
		o(frag.children[0]).equals(child)
	})
	o.spec("children", function() {
		o("handles string single child", function() {
			var vnode = m(m.Fragment, null, ["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m(m.Fragment, null, [""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m(m.Fragment, null, [1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m(m.Fragment, null, [0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m(m.Fragment, null, [true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m(m.Fragment, null, [false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m(m.Fragment, null, [null])

			o(vnode.children[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m(m.Fragment, null, [undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m(m.Fragment, null, ["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m(m.Fragment, null, [0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m(m.Fragment, null, [false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m(m.Fragment, null, [null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles falsy number single child without attrs", function() {
			var vnode = m(m.Fragment, null, 0)

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
	})
})

o.spec("key", function() {
	o("works", function() {
		var child = m("p")
		var frag = m.key(undefined, child)

		o(frag.tag).equals("=")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(1)
		o(frag.children[0]).equals(child)

		o(frag.state).equals(undefined)
	})
	o("supports non-null keys", function() {
		var frag = m.key(7, [])
		o(frag.tag).equals("=")

		o(Array.isArray(frag.children)).equals(true)
		o(frag.children.length).equals(0)

		o(frag.state).equals(7)
	})
	o.spec("children", function() {
		o("handles string single child", function() {
			var vnode = m.key("foo", ["a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m.key("foo", [""])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
		})
		o("handles number single child", function() {
			var vnode = m.key("foo", [1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m.key("foo", [0])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m.key("foo", [true])

			o(vnode.children).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m.key("foo", [false])

			o(vnode.children).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m.key("foo", [null])

			o(vnode.children[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m.key("foo", [undefined])

			o(vnode.children).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m.key("foo", ["", "a"])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m.key("foo", [0, 1])

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
			o(vnode.children[1].tag).equals("#")
			o(vnode.children[1].children).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m.key("foo", [false, true])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m.key("foo", [null, undefined])

			o(vnode.children).deepEquals([null, null])
		})
		o("handles falsy number single child without attrs", function() {
			var vnode = m.key("foo", 0)

			o(vnode.children[0].tag).equals("#")
			o(vnode.children[0].children).equals("0")
		})
	})
})
