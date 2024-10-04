"use strict"

var m = require("../render/hyperscript")

var Use = () => {
	var key = 0
	return {
		view: (v, o) => {
			if (o && !(
				v.attrs.d.length === o.attrs.d.length &&
				v.attrs.d.every((b, i) => Object.is(b, o.attrs.d[i]))
			)) {
				key++
			}

			return m.key(key, v.children)
		}
	}
}

module.exports = (deps, ...children) => m(Use, {d: [...deps]}, ...children)
