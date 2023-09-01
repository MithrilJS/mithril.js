// This exists so I'm only saving it once.
"use strict"

let hasOwn = require("./hasOwn")

module.exports = Object.assign || function(target, source) {
	for (let key in source) {
		if (hasOwn.call(source, key)) target[key] = source[key]
	}
}
