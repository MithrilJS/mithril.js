"use strict"

var o = require("ospec")
var loadMithril = require("../../test-utils/loadMithril")

o.spec("trust", function() {
	var m; o.beforeEach(function() { m = loadMithril() })

	o("works with html", function() {
		var vnode = m.trust("<a></a>")

		o(vnode.tag).equals("<")
		o(vnode.children).equals("<a></a>")
	})
	o("works with text", function() {
		var vnode = m.trust("abc")

		o(vnode.tag).equals("<")
		o(vnode.children).equals("abc")
	})
	o("casts null to empty string", function() {
		var vnode = m.trust(null)

		o(vnode.tag).equals("<")
		o(vnode.children).equals("")
	})
	o("casts undefined to empty string", function() {
		var vnode = m.trust(undefined)

		o(vnode.tag).equals("<")
		o(vnode.children).equals("")
	})
})
