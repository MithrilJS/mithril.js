// Allowed terminators for `m.match`:
// - `.` for `:file.:ext`
// - `-` for `:lang-:locale`
// - `/` for `/:some/:path/`
// - end for `/:some/:path`
// Escape with `\\`
// Use `*rest` for rest

// Caution: `m.p` and the failure path of `m.match` are both perf-sensitive. It only takes a couple
// hundred `m.p` calls with parameters to amount to about 1ms, and there's only about 10ms total
// that one can reasonably use to render stuff. And it's reasonable to expect several dozen `m.p`
// calls with parameters even in a medium-sized app.
//
// The more complicated one, `m.match`, fortunately is fairly cheap in the common case of mismatch.
// However, `m.p`'s common case is *with variables*, and getting the runtime of that down wasn't
// easy. (`m.p` for context was designed with usage like `m(m.Link, {href: m.p(...)})` in mind.)

import {hasOwn} from "../util.js"

var toString = {}.toString

var invalidTemplateChars = /[:*][$_\p{IDS}](?![$\p{IDC}]*(?![:*]))/u
var invalidMatchTemplate = /\/\/|[:*](?![$_\p{IDS}][$\p{IDC}]*(?![:*]))|\*.*?[^$\p{IDC}]|:([$_\p{IDS}][$\p{IDC}]*)[^$\p{IDC}].*?[:*]\1(?![$\p{IDC}])/u
var escapeOrParameter = /\\.|[:*][$_\p{IDS}][$\p{IDC}]*/ug
var escapeOnly = /\\(.)/g
// I escape literal text so people can use things like `:file.:ext` or `:lang-:locale` in routes.
// This is all merged into one pass so I don't also accidentally escape `-` and make it harder to
// detect it to ban it from template parameters.
var matcherCompile = /([:*])([$_\p{IDS}][$\p{IDC}]*)|\\\\|\\?([$^*+.()|[\]{}])|\\(.)/ug

var serializeQueryValue = (qs, prefix, value) => {
	if (value == null || value === false) return
	if (Array.isArray(value)) {
		for (var i of value) {
			serializeQueryValue(qs, `${prefix}[]`, i)
		}
	} else {
		if (typeof value === "object") {
			var proto = Object.getPrototypeOf(value)
			if (proto == null || proto === Object.prototype || toString.call(value) === "[object Object]") {
				for (var k in value) {
					if (hasOwn.call(value, k)) {
						serializeQueryValue(qs, `${prefix}[${k}]`, value[k])
					}
				}
				return
			}
		}
		qs.v += qs.s + encodeURIComponent(prefix) + (value === true ? "" : `=${encodeURIComponent(value)}`)
		qs.s = "&"
	}
}

var makeQueryBuilder = (sep, value) => ({s: sep, v: value})

var q = (params) => {
	var qs = makeQueryBuilder("", "")
	for (var key in params) {
		if (hasOwn.call(params, key)) serializeQueryValue(qs, key, params[key])
	}
	return qs.v
}

// Returns `path` from `template` + `params`
var p = (template, params) => {
	if (invalidTemplateChars.test(template)) {
		throw new SyntaxError("Template parameter names must be separated by either a '/', '-', or '.'.")
	}
	if (params == null) return template.replace(escapeOnly, "$1")
	var queryIndex = template.indexOf("?")
	var hashIndex = template.indexOf("#")
	var queryEnd = hashIndex < 0 ? template.length : hashIndex
	var pathEnd = queryIndex < 0 ? queryEnd : queryIndex
	var path = template.slice(0, pathEnd)
	var inTemplate = new Set()
	var resolved = ""
	var start = escapeOrParameter.lastIndex = 0
	var exec

	while ((exec = escapeOrParameter.exec(path)) != null) {
		var index = exec.index
		resolved += path.slice(start, index)
		start = escapeOrParameter.lastIndex
		if (path[index] === "\\") {
			start = index + 1
		} else {
			var key = path.slice(index + 1, start)
			inTemplate.add(key)
			key = params[key]
			resolved += (
				key != null
					// Escape normal parameters, but not variadic ones.
					? (path[index] === "*" ? key : encodeURIComponent(`${key}`))
					// If no such parameter exists, don't interpolate it.
					: path.slice(index, start)
			)
		}
	}

	resolved += path.slice(start)

	// In case the template substitution adds new query/hash parameters.
	var newQueryIndex = resolved.indexOf("?")
	var newHashIndex = resolved.indexOf("#")
	var newQueryEnd = newHashIndex < 0 ? resolved.length : newHashIndex
	var newPathEnd = newQueryIndex < 0 ? newQueryEnd : newQueryIndex
	var qs = makeQueryBuilder("?", resolved.slice(0, newPathEnd))

	if (queryIndex >= 0) {
		qs.v += template.slice(queryIndex, queryEnd)
		qs.s = "&"
	}

	if (newQueryIndex >= 0) {
		qs.v += qs.s + resolved.slice(newQueryIndex, newQueryEnd)
		qs.s = "&"
	}

	for (var key in params) {
		if (hasOwn.call(params, key) && !inTemplate.has(key)) {
			serializeQueryValue(qs, key, params[key])
		}
	}

	if (hashIndex >= 0) {
		qs.v += template.slice(hashIndex)
	} else {
		qs.s = ""
	}

	if (newHashIndex >= 0) {
		qs.v += qs.s + resolved.slice(newHashIndex)
	}

	return qs.v
}

/** @typedef {RegExp & {r: number, p: URLSearchParams}} Matcher */

/** @type {Map<string, Matcher>} */
var cache = new Map()

/** @param {string} pattern @returns {Matcher} */
var compile = (pattern) => {
	if (invalidMatchTemplate.test(pattern)) {
		throw new SyntaxError("Invalid pattern")
	}

	var queryIndex = pattern.indexOf("?")
	var hashIndex = pattern.indexOf("#")
	var index = queryIndex < hashIndex ? queryIndex : hashIndex
	var rest
	var re = new RegExp(`^${pattern.slice(0, index < 0 ? undefined : index).replace(
		matcherCompile,
		(_, p, name, esc1, esc2) => {
			if (p === "*") {
				rest = name
				return `(?<${name}>.*)`
			} else if (p === ":") {
				return `(?<${name}>[^/]+)`
			} else {
				return esc2 || `\\${esc1 || "\\"}`
			}
		}
	)}$`, "u")
	cache.set(pattern, re)
	re.r = rest
	re.p = new URLSearchParams(index < 0 ? "" : pattern.slice(index, hashIndex < 0 ? undefined : hashIndex))
	return re
}

/** @param {{path: string, params: URLSearchParams}} route */
var match = ({path, params}, pattern) => {
	var re = cache.get(pattern)
	if (!re) {
		re = /*@__NOINLINE__*/compile(pattern)
	}

	var exec = re.exec(path)
	var restIndex = re.r
	if (!exec) return

	for (var [k, v] of re.p) {
		if (params.get(k) !== v) return
	}

	// Taking advantage of guaranteed insertion order and group iteration order here to reduce the
	// condition to a simple numeric comparison.
	for (var k in exec.groups) {
		if (restIndex--) {
			exec.groups[k] = decodeURIComponent(exec.groups[k])
		}
	}

	return {...exec.groups}
}

export {p, q, match}
