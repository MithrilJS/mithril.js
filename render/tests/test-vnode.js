"use strict"
var o = require("../../ospec/ospec")
var vnode = require("../vnode")

o.spec("vnode", function () {
	o("works", function () {
		o(vnode()).deepEquals({
			tag: undefined,
			key: undefined,
			attrs: undefined,
			children: undefined,
			text: undefined,
			dom: undefined,
			domSize: undefined,
			state: undefined,
			events: undefined,
			instance: undefined,
			skip: false,
			reuse: undefined
		})
		o(vnode(1, 2, 3, 4, 5, 6)).deepEquals({
			tag: 1,
			key: 2,
			attrs: 3,
			children: 4,
			text: 5,
			dom: 6,
			domSize: undefined,
			state: undefined,
			events: undefined,
			instance: undefined,
			skip: false,
			reuse: undefined
		})
	})
})