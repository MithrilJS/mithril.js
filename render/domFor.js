"use strict"

var delayedRemoval = new WeakMap

function *domFor({dom, domSize}, {generation} = {}) {
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