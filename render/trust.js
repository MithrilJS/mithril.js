"use strict"

var Node = require("../render/node")

module.exports = function(html) {
	return Node("<", undefined, undefined, html, undefined, undefined)
}
