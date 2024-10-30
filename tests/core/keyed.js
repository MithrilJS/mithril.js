/* eslint-disable no-bitwise */
import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("keyed with view", function() {
	o("works empty", function() {
		var view = o.spy(() => {})
		var vnode = m.keyed([], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(0)
		o(vnode.a.size).equals(0)
	})
	o("supports `undefined` keys", function() {
		var child = m("p")
		var view = o.spy(() => [undefined, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(undefined)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports `null` keys", function() {
		var child = m("p")
		var view = o.spy(() => [null, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(null)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports `false` keys", function() {
		var child = m("p")
		var view = o.spy(() => [false, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(false)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports `true` keys", function() {
		var child = m("p")
		var view = o.spy(() => [true, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(true)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports empty string keys", function() {
		var child = m("p")
		var view = o.spy(() => ["", child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals("")
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports non-empty string keys", function() {
		var child = m("p")
		var view = o.spy(() => ["a", child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals("a")
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports falsy number keys", function() {
		var child = m("p")
		var view = o.spy(() => [0, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(0)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports truthy number keys", function() {
		var child = m("p")
		var view = o.spy(() => [123, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(123)
		o([...vnode.a][0][1]).equals(child)
	})
	if (typeof BigInt === "function") {
		// eslint-disable-next-line no-undef
		const B = BigInt
		o("supports falsy bigint keys", function() {
			var child = m("p")
			var view = o.spy(() => [B(0), child])
			var vnode = m.keyed([1], view)

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

			o(view.callCount).equals(1)
			o(vnode.a.size).equals(1)
			o([...vnode.a][0][0]).equals(B(0))
			o([...vnode.a][0][1]).equals(child)
		})
		o("supports truthy bigint keys", function() {
			var child = m("p")
			var view = o.spy(() => [B(123), child])
			var vnode = m.keyed([1], view)

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

			o(view.callCount).equals(1)
			o(vnode.a.size).equals(1)
			o([...vnode.a][0][0]).equals(B(123))
			o([...vnode.a][0][1]).equals(child)
		})
	}
	o("supports symbol keys", function() {
		var key = Symbol("test")
		var child = m("p")
		var view = o.spy(() => [key, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(key)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports object keys", function() {
		var key = {}
		var child = m("p")
		var view = o.spy(() => [key, child])
		var vnode = m.keyed([1], view)

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(view.callCount).equals(1)
		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(key)
		o([...vnode.a][0][1]).equals(child)
	})
	o("rejects duplicate `undefined` keys", function() {
		var child = m("p")
		var view = o.spy(() => [undefined, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate `null` keys", function() {
		var child = m("p")
		var view = o.spy(() => [null, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate `false` keys", function() {
		var child = m("p")
		var view = o.spy(() => [false, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate `true` keys", function() {
		var child = m("p")
		var view = o.spy(() => [true, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate empty string keys", function() {
		var child = m("p")
		var view = o.spy(() => ["", child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate non-empty string keys", function() {
		var child = m("p")
		var view = o.spy(() => ["a", child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate falsy number keys", function() {
		var child = m("p")
		var view = o.spy(() => [0, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate truthy number keys", function() {
		var child = m("p")
		var view = o.spy(() => [123, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	if (typeof BigInt === "function") {
		// eslint-disable-next-line no-undef
		const B = BigInt
		o("rejects duplicate falsy bigint keys", function() {
			var child = m("p")
			var view = o.spy(() => [B(0), child])

			o(() => m.keyed([1, 2], view)).throws(TypeError)
		})
		o("rejects duplicate truthy bigint keys", function() {
			var child = m("p")
			var view = o.spy(() => [B(123), child])

			o(() => m.keyed([1, 2], view)).throws(TypeError)
		})
	}
	o("rejects duplicate symbol keys", function() {
		var key = Symbol("test")
		var child = m("p")
		var view = o.spy(() => [key, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("rejects duplicate object keys", function() {
		var key = {}
		var child = m("p")
		var view = o.spy(() => [key, child])

		o(() => m.keyed([1, 2], view)).throws(TypeError)
	})
	o("handles `undefined` hole", function() {
		var vnode = m.keyed(["foo", "bar"], (key) => (key === "foo" ? undefined : [key, "a"]))

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `null` hole", function() {
		var vnode = m.keyed(["foo", "bar"], (key) => (key === "foo" ? null : [key, "a"]))

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `false` hole", function() {
		var vnode = m.keyed(["foo", "bar"], (key) => (key === "foo" ? false : [key, "a"]))

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `true` hole", function() {
		var vnode = m.keyed(["foo", "bar"], (key) => (key === "foo" ? true : [key, "a"]))

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `undefined` child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, undefined])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles `null` child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, null])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles `false child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, false])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles `true` child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, true])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles string child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, "a"])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
	})
	o("handles falsy string child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, ""])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("")
	})
	o("handles number child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, 1])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("1")
	})
	o("handles falsy number child", function() {
		var vnode = m.keyed(["foo"], (key) => [key, 0])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("0")
	})
	o("handles fragment", function() {
		var vnode = m.keyed(["foo"], (key) => [key, ["", "a"]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o([...vnode.a][0][1].c.length).equals(2)
		o([...vnode.a][0][1].c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].c[0].a).equals("")
		o([...vnode.a][0][1].c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].c[1].a).equals("a")
	})
})

o.spec("keyed direct", function() {
	o("works empty", function() {
		var vnode = m.keyed([])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(0)
	})
	o("supports `undefined` keys", function() {
		var child = m("p")
		var vnode = m.keyed([[undefined, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(undefined)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports `null` keys", function() {
		var child = m("p")
		var vnode = m.keyed([[null, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(null)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports `false` keys", function() {
		var child = m("p")
		var vnode = m.keyed([[false, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(false)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports `true` keys", function() {
		var child = m("p")
		var vnode = m.keyed([[true, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(true)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports empty string keys", function() {
		var child = m("p")
		var vnode = m.keyed([["", child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals("")
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports non-empty string keys", function() {
		var child = m("p")
		var vnode = m.keyed([["a", child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals("a")
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports falsy number keys", function() {
		var child = m("p")
		var vnode = m.keyed([[0, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(0)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports truthy number keys", function() {
		var child = m("p")
		var vnode = m.keyed([[123, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(123)
		o([...vnode.a][0][1]).equals(child)
	})
	if (typeof BigInt === "function") {
		// eslint-disable-next-line no-undef
		const B = BigInt
		o("supports falsy bigint keys", function() {
			var child = m("p")
			var vnode = m.keyed([[B(0), child]])

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

			o(vnode.a.size).equals(1)
			o([...vnode.a][0][0]).equals(B(0))
			o([...vnode.a][0][1]).equals(child)
		})
		o("supports truthy bigint keys", function() {
			var child = m("p")
			var vnode = m.keyed([[B(123), child]])

			o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

			o(vnode.a.size).equals(1)
			o([...vnode.a][0][0]).equals(B(123))
			o([...vnode.a][0][1]).equals(child)
		})
	}
	o("supports symbol keys", function() {
		var key = Symbol("test")
		var child = m("p")
		var vnode = m.keyed([[key, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(key)
		o([...vnode.a][0][1]).equals(child)
	})
	o("supports object keys", function() {
		var key = {}
		var child = m("p")
		var vnode = m.keyed([[key, child]])

		o(vnode.m & m.TYPE_MASK).equals(m.TYPE_KEYED)

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][0]).equals(key)
		o([...vnode.a][0][1]).equals(child)
	})
	o("rejects duplicate `undefined` keys", function() {
		o(() => m.keyed([[undefined, m("p")], [undefined, m("p")]])).throws(TypeError)
	})
	o("rejects duplicate `null` keys", function() {
		o(() => m.keyed([[null, m("p")], [null, m("p")]])).throws(TypeError)
	})
	o("rejects duplicate `false` keys", function() {
		o(() => m.keyed([[false, m("p")], [false, m("p")]])).throws(TypeError)
	})
	o("rejects duplicate `true` keys", function() {
		o(() => m.keyed([[true, m("p")], [true, m("p")]])).throws(TypeError)
	})
	o("rejects duplicate empty string keys", function() {
		o(() => m.keyed([["", m("p")], ["", m("p")]])).throws(TypeError)
	})
	o("rejects duplicate non-empty string keys", function() {
		o(() => m.keyed([["a", m("p")], ["a", m("p")]])).throws(TypeError)
	})
	o("rejects duplicate falsy number keys", function() {
		o(() => m.keyed([[0, m("p")], [0, m("p")]])).throws(TypeError)
	})
	o("rejects duplicate truthy number keys", function() {
		o(() => m.keyed([[123, m("p")], [123, m("p")]])).throws(TypeError)
	})
	if (typeof BigInt === "function") {
		// eslint-disable-next-line no-undef
		const B = BigInt
		o("rejects duplicate falsy bigint keys", function() {
			o(() => m.keyed([[B(0), m("p")], [B(0), m("p")]])).throws(TypeError)
		})
		o("rejects duplicate truthy bigint keys", function() {
			o(() => m.keyed([[B(123), m("p")], [B(123), m("p")]])).throws(TypeError)
		})
	}
	o("rejects duplicate symbol keys", function() {
		var key = Symbol("test")
		o(() => m.keyed([[key, m("p")], [key, m("p")]])).throws(TypeError)
	})
	o("rejects duplicate object keys", function() {
		var key = {}
		o(() => m.keyed([[key, m("p")], [key, m("p")]])).throws(TypeError)
	})
	o("handles `undefined` hole", function() {
		var vnode = m.keyed([undefined, ["bar", "a"]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `null` hole", function() {
		var vnode = m.keyed([null, ["bar", "a"]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `false` hole", function() {
		var vnode = m.keyed([false, ["bar", "a"]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `true` hole", function() {
		var vnode = m.keyed([true, ["bar", "a"]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
		o([...vnode.a][0][0]).equals("bar")
	})
	o("handles `undefined` child", function() {
		var vnode = m.keyed([["foo", undefined]])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles `null` child", function() {
		var vnode = m.keyed([["foo", null]])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles `false child", function() {
		var vnode = m.keyed([["foo", false]])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles `true` child", function() {
		var vnode = m.keyed([["foo", true]])

		o([...vnode.a]).deepEquals([["foo", null]])
	})
	o("handles string child", function() {
		var vnode = m.keyed([["foo", "a"]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("a")
	})
	o("handles falsy string child", function() {
		var vnode = m.keyed([["foo", ""]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("")
	})
	o("handles number child", function() {
		var vnode = m.keyed([["foo", 1]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("1")
	})
	o("handles falsy number child", function() {
		var vnode = m.keyed([["foo", 0]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].a).equals("0")
	})
	o("handles fragment", function() {
		var vnode = m.keyed([["foo", ["", "a"]]])

		o(vnode.a.size).equals(1)
		o([...vnode.a][0][1].m & m.TYPE_MASK).equals(m.TYPE_FRAGMENT)
		o([...vnode.a][0][1].c.length).equals(2)
		o([...vnode.a][0][1].c[0].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].c[0].a).equals("")
		o([...vnode.a][0][1].c[1].m & m.TYPE_MASK).equals(m.TYPE_TEXT)
		o([...vnode.a][0][1].c[1].a).equals("a")
	})
})
