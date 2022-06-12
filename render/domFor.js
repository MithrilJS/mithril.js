"use strict"

var delayedRemoval = new WeakMap
module.exports.delayedRemoval = delayedRemoval

module.exports.domFor = function *domFor({dom, domSize}, {generation} = {}) {
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
