"use strict"

var delayedRemoval = new WeakMap
module.exports.delayedRemoval = delayedRemoval

module.exports.domFor = function *domFor({dom, domSize}, {generation} = {}) {
	if(dom == null)
		return

	if (domSize == null) {
		if (delayedRemoval.get(dom) === generation)
			yield dom
	}
	else while (domSize) {
		if (delayedRemoval.get(dom) === generation) {
			yield dom
			domSize--
		}
		dom = dom.nextSibling
	}
}
