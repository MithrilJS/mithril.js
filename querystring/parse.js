"use strict"

module.exports = function(string) {
	if (string === "" || string == null) return {}
	if (string.charAt(0) === "?") string = string.slice(1)

	var entries = string.split("&"), data = {}
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i].split("=")
		var key = decodeURIComponent(entry[0])
		var value = entry.length === 2 ? decodeURIComponent(entry[1]) : ""

		if (value === "true") value = true
		else if (value === "false") value = false

		var levels = key.split(/\]\[?|\[/)
		var cursor = data
		if (key.indexOf("[") > -1) levels.pop()
		for (var j = 0; j < levels.length; j++) {
			var level = levels[j], nextLevel = levels[j + 1]
			var isArray = nextLevel == ""
			var isValue = j === levels.length - 1
			var levelValue = isValue ? value : isArray ? [] : {}

			if (cursor instanceof Array) {
				cursor.push(levelValue)
			} else {
				if (cursor[level] == null) {
					cursor[level] = levelValue
				} else {
					levelValue = cursor[level]
				}
			}
			cursor = levelValue
		}
	}
	return data
}
