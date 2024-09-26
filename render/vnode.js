"use strict"

function Vnode(tag, key, attrs, children) {
	return {tag, key, attrs, children, dom: undefined, domSize: undefined, state: undefined, events: undefined, instance: undefined}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node))
	if (node == null || typeof node === "boolean") return null
	if (typeof node === "object") return node
	return Vnode("#", undefined, undefined, String(node))
}
Vnode.normalizeChildren = function(input) {
	if (input.length) {
		var isKeyed = input[0] != null && input[0].key != null
		var keys = new Set()
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < input.length; i++) {
			if ((input[i] != null && input[i].key != null) !== isKeyed) {
				throw new TypeError(
					isKeyed && (input[i] != null || typeof input[i] === "boolean")
						? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m.fragment({key: ...}), instead of a hole."
						: "In fragments, vnodes must either all have keys or none have keys."
				)
			}
			if (isKeyed) {
				if (keys.has(input[i].key)) {
					throw new TypeError(`Duplicate key detected: ${input[i].key}`)
				}
				keys.add(input[i].key)
			}
		}
		input = input.map(Vnode.normalize)
	}
	return input
}

module.exports = Vnode
