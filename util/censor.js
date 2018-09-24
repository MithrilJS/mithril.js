"use strict"

// Note: this avoids as much allocation and overhead as possible.
var hasOwn = {}.hasOwnProperty
var magic = [
	"key", "oninit", "oncreate", "onbeforeupdate", "onupdate",
	"onbeforeremove", "onremove",
]

function includesOwn(attrs, keys) {
	if (Array.isArray(keys)) {
		for (var i = 0; i < keys.length; i++) {
			if (hasOwn.call(attrs, keys[i])) return true
		}
	}
	return false
}

function filterOne(attrs, list) {
	var result = {}

	for (var key in attrs) {
		if (hasOwn.call(attrs, key) && list.indexOf(key) < 0) {
			result[key] = attrs[key]
		}
	}

	return result
}

function filterTwo(attrs, extras) {
	var result = {}

	for (var key in attrs) {
		if (hasOwn.call(attrs, key) &&
				magic.indexOf(key) < 0 &&
				extras.indexOf(key) < 0) {
			result[key] = attrs[key]
		}
	}

	return result
}

module.exports = function(attrs, extras) {
	if (includesOwn(attrs, magic)) {
		return includesOwn(attrs, extras) ?
			filterTwo(attrs, extras) :
			filterOne(attrs, magic)
	} else {
		return includesOwn(attrs, extras) ?
			filterOne(attrs, extras) :
			attrs
	}
}
