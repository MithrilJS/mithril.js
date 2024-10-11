/* eslint-disable no-bitwise */
import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("fragment literal", function() {
	o("works", function() {
		var child = m("p")
		var frag = m.normalize([child])

		o(frag.m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)

		o(Array.isArray(frag.c)).equals(true)
		o(frag.c.length).equals(1)
		o(frag.c[0]).equals(child)
	})
	o.spec("children", function() {
		o("handles string single child", function() {
			var vnode = m.normalize(["a"])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m.normalize([""])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("")
		})
		o("handles number single child", function() {
			var vnode = m.normalize([1])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m.normalize([0])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m.normalize([true])

			o(vnode.c).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m.normalize([false])

			o(vnode.c).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m.normalize([null])

			o(vnode.c[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m.normalize([undefined])

			o(vnode.c).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m.normalize(["", "a"])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("")
			o(vnode.c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[1].s).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m.normalize([0, 1])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
			o(vnode.c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[1].s).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m.normalize([false, true])

			o(vnode.c).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m.normalize([null, undefined])

			o(vnode.c).deepEquals([null, null])
		})
	})
})

o.spec("fragment component", function() {
	o("works", function() {
		var child = m("p")
		var frag = m(m.Fragment, null, child)

		o(frag.m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)

		o(Array.isArray(frag.c)).equals(true)
		o(frag.c.length).equals(1)
		o(frag.c[0]).equals(child)
	})
	o.spec("children", function() {
		o("handles string single child", function() {
			var vnode = m(m.Fragment, null, ["a"])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m(m.Fragment, null, [""])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("")
		})
		o("handles number single child", function() {
			var vnode = m(m.Fragment, null, [1])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m(m.Fragment, null, [0])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m(m.Fragment, null, [true])

			o(vnode.c).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m(m.Fragment, null, [false])

			o(vnode.c).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m(m.Fragment, null, [null])

			o(vnode.c[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m(m.Fragment, null, [undefined])

			o(vnode.c).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m(m.Fragment, null, ["", "a"])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("")
			o(vnode.c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[1].s).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m(m.Fragment, null, [0, 1])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
			o(vnode.c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[1].s).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m(m.Fragment, null, [false, true])

			o(vnode.c).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m(m.Fragment, null, [null, undefined])

			o(vnode.c).deepEquals([null, null])
		})
		o("handles falsy number single child without attrs", function() {
			var vnode = m(m.Fragment, null, 0)

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
		})
	})
})

o.spec("key", function() {
	o("works", function() {
		var child = m("p")
		var frag = m.key(undefined, child)

		o(frag.m & m.TYPE_MASK).equals(m.TYPE_KEY)

		o(Array.isArray(frag.c)).equals(true)
		o(frag.c.length).equals(1)
		o(frag.c[0]).equals(child)

		o(frag.t).equals(undefined)
	})
	o("supports non-null keys", function() {
		var frag = m.key(7, [])
		o(frag.m & m.TYPE_MASK).equals(m.TYPE_KEY)

		o(Array.isArray(frag.c)).equals(true)
		o(frag.c.length).equals(0)

		o(frag.t).equals(7)
	})
	o.spec("children", function() {
		o("handles string single child", function() {
			var vnode = m.key("foo", ["a"])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("a")
		})
		o("handles falsy string single child", function() {
			var vnode = m.key("foo", [""])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("")
		})
		o("handles number single child", function() {
			var vnode = m.key("foo", [1])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("1")
		})
		o("handles falsy number single child", function() {
			var vnode = m.key("foo", [0])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
		})
		o("handles boolean single child", function() {
			var vnode = m.key("foo", [true])

			o(vnode.c).deepEquals([null])
		})
		o("handles falsy boolean single child", function() {
			var vnode = m.key("foo", [false])

			o(vnode.c).deepEquals([null])
		})
		o("handles null single child", function() {
			var vnode = m.key("foo", [null])

			o(vnode.c[0]).equals(null)
		})
		o("handles undefined single child", function() {
			var vnode = m.key("foo", [undefined])

			o(vnode.c).deepEquals([null])
		})
		o("handles multiple string children", function() {
			var vnode = m.key("foo", ["", "a"])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("")
			o(vnode.c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[1].s).equals("a")
		})
		o("handles multiple number children", function() {
			var vnode = m.key("foo", [0, 1])

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
			o(vnode.c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[1].s).equals("1")
		})
		o("handles multiple boolean children", function() {
			var vnode = m.key("foo", [false, true])

			o(vnode.c).deepEquals([null, null])
		})
		o("handles multiple null/undefined child", function() {
			var vnode = m.key("foo", [null, undefined])

			o(vnode.c).deepEquals([null, null])
		})
		o("handles falsy number single child without attrs", function() {
			var vnode = m.key("foo", 0)

			o(vnode.c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
			o(vnode.c[0].s).equals("0")
		})
	})
})
