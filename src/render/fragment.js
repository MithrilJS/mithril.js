import Vnode from "./vnode.js"
import hyperscriptVnode from "./hyperscriptVnode.js"

export default function() {
	var vnode = hyperscriptVnode.apply(0, arguments)

	vnode.tag = "["
	vnode.children = Vnode.normalizeChildren(vnode.children)
	return vnode
}
