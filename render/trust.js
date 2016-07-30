"use strict"

var Vnode = require("../render/vnode")

module.exports = function(html) {
	return Vnode("<", undefined, undefined, html, undefined, undefined)
}
