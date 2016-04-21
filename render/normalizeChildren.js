module.exports = function normalizeChildren(children) {
	for (var i = 0; i < children.length; i++) {
		if (children[i] instanceof Array) children[i] = {tag: "[", key: undefined, attrs: undefined, children: normalizeChildren(children[i]), text: undefined}
		else if (children[i] != null && typeof children[i] !== "object") children[i] = {tag: "#", key: undefined, attrs: undefined, children: children[i], text: undefined}
	}
	return children
}