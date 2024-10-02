"use strict"

function Vnode(tag, key, attrs, children) {
	return {tag, key, attrs, children, dom: undefined, state: undefined, events: undefined, instance: undefined}
}
Vnode.normalize = function(node) {
	if (node == null || typeof node === "boolean") return null
	if (typeof node !== "object") return Vnode("#", undefined, undefined, String(node))
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node.slice()))
	return node
}
Vnode.normalizeChildren = function(input) {
	if (input.length) {
		input[0] = Vnode.normalize(input[0])
		var isKeyed = input[0] != null && input[0].tag === "="
		var keys = new Set()
		// Note: this is a *very* perf-sensitive check.
		// Fun fact: merging the loop like this is somehow faster than splitting
		// it, noticeably so.
		for (var i = 1; i < input.length; i++) {
			input[i] = Vnode.normalize(input[i])
			if ((input[i] != null && input[i].tag === "=") !== isKeyed) {
				throw new TypeError(
					isKeyed
						? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit empty key vnode, `m.key()`, instead of a hole."
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
	}
	return input
}

module.exports = Vnode
