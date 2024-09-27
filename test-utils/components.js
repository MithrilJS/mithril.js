"use strict"

var m = require("../render/hyperscript")

module.exports = [
	{
		kind: "constructible",
		create: function(methods) {
			class C {
				view() {
					return m("div")
				}
			}
			Object.assign(C.prototype, methods || {})
			return C
		}
	}, {
		kind: "closure",
		create: function(methods) {
			return () => Object.assign({view: () => m("div")}, methods || {})
		}
	}
]
