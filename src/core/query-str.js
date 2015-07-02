var types = require('./types'),
	type = types.type,
	ARRAY = types.ARRAY;
	OBJECT = types.OBJECT;

function parseQueryString(str) {
	if (str.charAt(0) === "?") str = str.substring(1);
	
	var pairs = str.split("&"), params = {};
	for (var i = 0, len = pairs.length; i < len; i++) {
		var pair = pairs[i].split("=");
		var key = decodeURIComponent(pair[0])
		var value = pair.length == 2 ? decodeURIComponent(pair[1]) : null
		if (params[key] != null) {
			if (type.call(params[key]) !== ARRAY) params[key] = [params[key]]
			params[key].push(value)
		}
		else params[key] = value
	}
	return params
}

function buildQueryString(object, prefix) {
	var duplicates = {}
	var str = []
	for (var prop in object) {
		var key = prefix ? prefix + "[" + prop + "]" : prop
		var value = object[prop]
		var valueType = type.call(value)
		var pair = (value === null) ? encodeURIComponent(key) :
			valueType === OBJECT ? buildQueryString(value, key) :
			valueType === ARRAY ? value.reduce(function(memo, item) {
				if (!duplicates[key]) duplicates[key] = {}
				if (!duplicates[key][item]) {
					duplicates[key][item] = true
					return memo.concat(encodeURIComponent(key) + "=" + encodeURIComponent(item))
				}
				return memo
			}, []).join("&") :
			encodeURIComponent(key) + "=" + encodeURIComponent(value)
		if (value !== undefined) str.push(pair)
	}
	return str.join("&")
}

module.exports = {
	buildQueryString: buildQueryString,
	parseQueryString: parseQueryString
}
