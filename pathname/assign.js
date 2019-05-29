"use strict"

module.exports = Object.assign || function(target, source) {
	Object.keys(source).forEach(function(key) { target[key] = source[key] })
}
