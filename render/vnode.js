"use strict"

function Vnode(tag, key, attrs, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, is: undefined, domSize: undefined, state: undefined, events: undefined, instance: undefined}
}
Vnode.normalize = function(node) {
	if (Array.isArray(node)) return Vnode("[", undefined, undefined, Vnode.normalizeChildren(node), undefined, undefined)
	if (node == null || typeof node === "boolean") return null
	if (typeof node === "object") return node
	return Vnode("#", undefined, undefined, String(node), undefined, undefined)
}
Vnode.normalizeChildren = function(input) {
	// Preallocate the array length (initially holey) and fill every index immediately in order.
	// Benchmarking shows better performance on V8.
	var children = new Array(input.length)
	// Count the number of keyed normalized vnodes for consistency check.
	// Note: this is a perf-sensitive check.
	// Fun fact: merging the loop like this is somehow faster than splitting
	// the check within updateNodes(), noticeably so.
	var numKeyed = 0
	for (var i = 0; i < input.length; i++) {
		children[i] = Vnode.normalize(input[i])
		if (children[i] !== null && children[i].key != null) numKeyed++
	}
	if (numKeyed !== 0 && numKeyed !== input.length) {
		throw new TypeError(children.includes(null)
			? "In fragments, vnodes must either all have keys or none have keys. You may wish to consider using an explicit keyed empty fragment, m.fragment({key: ...}), instead of a hole."
			: "In fragments, vnodes must either all have keys or none have keys."
		)
	}
	return children
}

module.exports = Vnode
