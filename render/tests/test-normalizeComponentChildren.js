"use strict"

var o = require("ospec")
var domMock = require("../../test-utils/domMock")
var loadMithril = require("../../test-utils/load").mithril

o.spec("component children", function () {
	var m, $window, root

	o.beforeEach(function() {
		$window = domMock()
		root = $window.document.createElement("div")
		m = loadMithril({window: $window})
	})

	o("are not normalized on ingestion", function () {
		var component = {
			view: function (vnode) {
				return vnode.children
			}
		}

		var vnode = m(component, "a")

		m.render(root, vnode)

		o(vnode.children[0]).equals("a")
	})

	o("are normalized upon view interpolation", function () {
		var component = {
			view: function (vnode) {
				return vnode.children
			}
		}

		var vnode = m(component, "a")

		m.render(root, vnode)

		o(vnode.instance.children.length).equals(1)
		o(vnode.instance.children[0].tag).equals("#")
		o(vnode.instance.children[0].children).equals("a")
	})
})
