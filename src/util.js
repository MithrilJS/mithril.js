// These two exist so I'm only saving it once.
export var hasOwn = {}.hasOwnProperty
export var toString = {}.toString
export var assign = Object.assign || function(target, source) {
	for (var key in source) {
		if (hasOwn.call(source, key)) target[key] = source[key]
	}
}
