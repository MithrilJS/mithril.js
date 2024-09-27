"use strict"

var delayedRemoval = new WeakMap

function *domFor(vnode, object = {}) {
	// To avoid unintended mangling of the internal bundler,
	// parameter destructuring is not used here.
	var dom = vnode.dom
	var domSize = vnode.domSize
	var generation = object.generation
	if (dom != null) do {
		const {nextSibling} = dom

		if (delayedRemoval.get(dom) === generation) {
			yield dom
			domSize--
		}

		dom = nextSibling
	}
	while (domSize)
}

module.exports = {
	delayedRemoval: delayedRemoval,
	domFor: domFor,
}
