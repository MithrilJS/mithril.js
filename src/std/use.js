import m from "../core.js"

var Use = () => {
	var key = 0
	return (n, o) => {
		if (o && !(
			n.d.length === o.d.length &&
			n.d.every((b, i) => Object.is(b, o.d[i]))
		)) {
			key++
		}

		return m.key(key, n.children)
	}
}

var use = (deps, ...children) => m(Use, {d: [...deps]}, ...children)

export {use as default}
