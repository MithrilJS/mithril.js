var toString = {}.toString

var serializeQueryValue = (key, value) => {
	if (value == null || value === false) {
		return ""
	} else if (Array.isArray(value)) {
		return value.map((i) => serializeQueryValue(`${key}[]`, i)).join("&")
	} else if (toString.call(value) !== "[object Object]") {
		return `${encodeURIComponent(key)}${value === true ? "" : `=${encodeURIComponent(value)}`}`
	} else {
		return Object.entries(value).map(([k, v]) => serializeQueryValue(`${key}[${k}]`, v)).join("&")
	}
}

var q = (params) => Object.entries(params).map(([k, v]) => serializeQueryValue(k, v)).join("&")

var invalidTemplateChars = /:([^\/\.-]+)(\.{3})?:/

// Returns `path` from `template` + `params`
var p = (template, params) => {
	if (invalidTemplateChars.test(template)) {
		throw new SyntaxError("Template parameter names must be separated by either a '/', '-', or '.'.")
	}
	if (params == null) return template
	var queryIndex = template.indexOf("?")
	var hashIndex = template.indexOf("#")
	var queryEnd = hashIndex < 0 ? template.length : hashIndex
	var pathEnd = queryIndex < 0 ? queryEnd : queryIndex
	var path = template.slice(0, pathEnd)
	var query = Object.assign({}, params)

	var resolved = path.replace(/:([^\/\.-]+)(\.{3})?/g, (m, key, variadic) => {
		delete query[key]
		// If no such parameter exists, don't interpolate it.
		if (params[key] == null) return m
		// Escape normal parameters, but not variadic ones.
		return variadic ? params[key] : encodeURIComponent(String(params[key]))
	})

	// In case the template substitution adds new query/hash parameters.
	var newQueryIndex = resolved.indexOf("?")
	var newHashIndex = resolved.indexOf("#")
	var newQueryEnd = newHashIndex < 0 ? resolved.length : newHashIndex
	var newPathEnd = newQueryIndex < 0 ? newQueryEnd : newQueryIndex
	var result = resolved.slice(0, newPathEnd)

	if (queryIndex >= 0) result += template.slice(queryIndex, queryEnd)
	if (newQueryIndex >= 0) result += (queryIndex < 0 ? "?" : "&") + resolved.slice(newQueryIndex, newQueryEnd)
	var querystring = q(query)
	if (querystring) result += (queryIndex < 0 && newQueryIndex < 0 ? "?" : "&") + querystring
	if (hashIndex >= 0) result += template.slice(hashIndex)
	if (newHashIndex >= 0) result += (hashIndex < 0 ? "" : "&") + resolved.slice(newHashIndex)
	return result
}

export {p, q}
