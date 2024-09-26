"use strict"

var hyperscript = require("./hyperscript")

module.exports = function(...args) {
	return hyperscript("[", ...args)
}
