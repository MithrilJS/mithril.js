"use strict"

var delayedRemoval = new WeakMap
module.exports.delayedRemoval = delayedRemoval

module.exports.domFor = function *domFor(vnode, {generation} = {generation: undefined}) {
	let {dom, domSize} = vnode
	if (dom != null) {
		if (domSize == null) {
			if (delayedRemoval.get(dom) === generation) {
				yield dom
			}
		} else {
			let i = 0, next
			while (i < domSize) {
				next = dom.nextSibling
				if (delayedRemoval.get(dom) === generation) {
					yield dom
					i++
				}
				dom = next
			}
		}
	}
}
