function Node(tag, key, attrs, children, text, dom) {
	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: {}}
}
Node.normalize = function(node) {
	if (node instanceof Array) return Node("[", undefined, undefined, Node.normalizeChildren(node), undefined, undefined)
	else if (node != null && typeof node !== "object") return Node("#", undefined, undefined, node, undefined, undefined)
	return node
}
Node.normalizeChildren = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		children[i] = Node.normalize(children[i])
	}
	return children
}

module.exports = Node