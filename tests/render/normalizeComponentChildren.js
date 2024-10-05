import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/core/hyperscript.js"
import render from "../../src/core/render.js"

o.spec("component children", function () {
	var $window = domMock()
	var root = $window.document.createElement("div")

	o.spec("component children", function () {
		var component = (attrs) => attrs.children

		var vnode = m(component, "a")

		render(root, vnode)

		o("are not normalized on ingestion", function () {
			o(vnode.attrs.children[0]).equals("a")
		})

		o("are normalized upon view interpolation", function () {
			o(vnode.instance.children.length).equals(1)
			o(vnode.instance.children[0].tag).equals("#")
			o(vnode.instance.children[0].children).equals("a")
		})
	})
})
