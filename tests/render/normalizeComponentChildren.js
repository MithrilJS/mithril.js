import o from "ospec"

import domMock from "../../test-utils/domMock.js"
import m from "../../src/entry/mithril.esm.js"

o.spec("component children", function () {
	var $window = domMock()
	var root = $window.document.createElement("div")

	o.spec("component children", function () {
		var component = (attrs) => attrs.children

		var vnode = m(component, "a")

		m.render(root, vnode)

		o("are not normalized on ingestion", function () {
			o(vnode.attrs.children[0]).equals("a")
		})

		o("are normalized upon view interpolation", function () {
			o(vnode.children.children.length).equals(1)
			o(vnode.children.children[0].tag).equals(Symbol.for("m.text"))
			o(vnode.children.children[0].state).equals("a")
		})
	})
})
