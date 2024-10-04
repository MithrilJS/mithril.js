"use strict"

var m = require("../render/hyperscript")

module.exports = [
	{
		kind: "constructible",
		create: function(methods) {
			if (!methods) methods = {}
			var constructor = methods.constructor
			if (constructor) delete methods.constructor
			class C {
				constructor(vnode) {
					if (typeof constructor === "function") {
						constructor.call(this, vnode)
					}
				}
				view() {
					return m("div")
				}
			}
			Object.assign(C.prototype, methods)
			return C
		}
	}, {
		kind: "closure",
		create: function(methods) {
			if (!methods) methods = {}
			var constructor = methods.constructor
			if (constructor) delete methods.constructor
			return (vnode) => {
				var result = Object.assign({view: () => m("div")}, methods)

				if (typeof constructor === "function") {
					constructor.call(result, vnode)
				}

				return result
			}
		}
	}
]
