/*
Caution: `m.p` and the failure path of `m.match` are both perf-sensitive. More so than you might
think. And unfortunately, string indexing is incredibly slow.

Suppose we're in a large CRUD app with 20 resources and 10 pages for each resource, for a total of
200 routes. And further, suppose we're on a complicated management page (like a domain management
page) with a grid of 50 rows and 8 routed icon links each. Each link has its URL constructed via
`m.p(...)`, for a total of 400 calls. (This is high, but still realistic. At the time of writing,
Namesilo's UI for selecting domains and performing batch operations on them is designed as a table
with about that many icon links and up to 100 domains per page.)

To meet 60 FPS, we generally have to have the whole page rendered in under 10ms for the browser to
not skip frames. To give the user some buffer for view inefficiency, let's aim for 2ms of overhead
for all the `m.match` and `m.p` calls. From some local benchmarking, the failure path of `m.match`
requires about 1us/op, so 200 routes would come out to about 0.2ms. (The success path is well under
0.1ms, so its overhead is negligible.) That leaves us about 1.8ms for 400 calls to `m.p(...)`. Do
the math, and that comes out to a whopping 4.5 us/call for us to meet our deadline.

I've tried the following for `m.p`, and most of them ended up being too slow. Times are for calls
with two string interpolation parameters (the slow path), measured on an older laptop. The laptop
experiences a roughly 30-60% perf boost when charging over when running from battery. The lower end
is while charging, the higher end is while on battery.

- A direct port of v2's `m.buildPathname`: 15-25 us
	- This provides headroom for up to about 70 calls per frame.
- Replace its inner `template.replace` with a `re.exec(template)` loop: 12-18 microseconds
	- This provides headroom for up to about 100 calls per frame.
- Switch from using match strings to computing positions from `exec.index`: 6.5-12 microseconds
	- This provides headroom for up to about 150 calls per frame.
- Switch from using match strings to computing positions from `exec.index`: 6.5-12 microseconds
	- This provides headroom for up to about 150 calls per frame.
- Iterate string directly: 2-3.5 microseconds
	- This provides headroom for up to about 500 calls per frame.

I've tried optimizing it further, but I'm running into the limits of string performance at this
point. And the computing positions from `exec.index` is about the fastest I could get any
regexp-based solution to go.

Also, I tried at first restricting parameters to JS identifiers (like `m.match` parameters are, as
I use named groups to generate the properties), but that, just on the regexp side, cut performance
in more than half. The `exec.match` form, the ideal one for regexp-based solutions, slowed down
from 12 microseconds to about 35-40 microseconds. And that would reduce headroom down to only about
45-50 calls per frame. This rate is simply too slow to even be viable for some smaller apps.
*/

// Allowed terminators for `m.match`:
// - `.` for `:file.:ext`
// - `-` for `:lang-:locale`
// - `/` for `/:some/:path/`
// - end for `/:some/:path`
// Escape with `\\`
// Use `*rest` for rest

import {hasOwn} from "../util.js"

var toString = {}.toString

var invalidMatchTemplate = /\/\/|[:*][^$_\p{IDS}]|[:*].[$\p{IDC}]*[:*]|\*.*?[^$\p{IDC}]|:([$_\p{IDS}][$\p{IDC}]*)[^$\p{IDC}].*?[:*]\1(?![$\p{IDC}])/u
// I escape literal text so people can use things like `:file.:ext` or `:lang-:locale` in routes.
// This is all merged into one pass so I don't also accidentally escape `-` and make it harder to
// detect it to ban it from template parameters.
var matcherCompile = /([:*])([$_\p{IDS}][$\p{IDC}]*)|\\\\|\\?([$^*+.()|[\]{}])|\\(.)/ug

var serializeQueryValue = (pq, result, prefix, value) => {
	var proto

	if (value != null && value !== false) {
		if (Array.isArray(value)) {
			for (var i of value) {
				result = serializeQueryValue(pq, result, `${prefix}[]`, i)
			}
		} else if (
			typeof value === "object" &&
			((proto = Object.getPrototypeOf(value)) == null || proto === Object.prototype || toString.call(value) === "[object Object]")
		) {
			for (var k in value) {
				if (hasOwn.call(value, k)) {
					result = serializeQueryValue(pq, result, `${prefix}[${k}]`, value[k])
				}
			}
		} else {
			var sep = pq.s
			pq.s = "&"
			result += sep + encodeURIComponent(prefix) + (value === true ? "" : `=${
				typeof value === "number" || typeof value === "bigint"
					? value
					: encodeURIComponent(value)
			}`)
		}
	}

	return result
}

var serializeQueryParams = (sep, value, exclude, params) => {
	var pq = {s: sep}
	for (var key in params) {
		if (hasOwn.call(params, key) && !exclude.includes(key)) {
			value = serializeQueryValue(pq, value, key, params[key])
		}
	}
	return value
}

var q = (params) => serializeQueryParams("", "", [], params)

var QUERY = 0
var ESCAPE = 1
var CHAR = 2
// Structure:
// Bit 0: is raw
// Bit 1: is next
// Bit 2: always set
var VAR_START = 4
// var RAW_VAR_START = 5
var VAR_NEXT = 6
// var RAW_VAR_NEXT = 7
var STATE_IS_RAW = 1
var STATE_IS_NEXT = 2


// Returns `path` from `template` + `params`
/**
 * @param {string} template
 * @param {undefined | null | Record<string, any>} params
 */
var p = (template, params) => {
	// This carefully only iterates the template once.
	var prev = 0
	var start = 0
	var state = CHAR
	// An array is fine. It's almost never large enough for the overhead of hashing to pay off.
	var inTemplate = []
	// Used for later.
	var hash = ""
	var queryIndex = -1
	var hashIndex = -1
	var result = ""
	var sep = "?"

	var NOT_VAR_NEXT = VAR_NEXT - 1

	// Using `for ... of` so the engine can do bounds check elimination more easily.
	for (var i = 0;; i++) {
		var ch = template.charAt(i)

		if (
			state > NOT_VAR_NEXT &&
			(ch === "" || ch === "#" || ch === "?" || ch === "\\" || ch === "/" || ch === "." || ch === "-")
		) {
			var segment = template.slice(start + 1, i)

			// If no such parameter exists, don't interpolate it.
			if (params != null && params[segment] != null) {
				inTemplate.push(segment)
				segment = `${params[segment]}`

				// Escape normal parameters, but not variadic ones.
				// eslint-disable-next-line no-bitwise
				if (state & STATE_IS_RAW) {
					var newHashIndex = segment.indexOf("#")
					var newQueryIndex = (newHashIndex < 0 ? segment : segment.slice(0, newHashIndex)).indexOf("?")
					if (newQueryIndex >= 0) {
						sep = "&"
						queryIndex = result.length + (prev - start) + newQueryIndex
					}
					if (newHashIndex >= 0) {
						hashIndex = result.length + (prev - start) + newHashIndex
					}
				} else {
					segment = encodeURIComponent(segment)
				}

				// Drop the preceding `:`/`*`/`\` character from the appended segment
				if (prev !== start) {
					result += template.slice(prev, start)
				}

				result += segment

				// Start from the next end
				prev = i
			}
		}

		if (ch === "#") {
			if (hashIndex < 0) hashIndex = i
		} else if (ch !== "") {
			if (state === QUERY) {
				// do nothing
			} else if (ch === "?") {
				// The query start cannot be escaped. It's a proper URL delimiter.
				if (queryIndex < 0) {
					queryIndex = i
					sep = "&"
				} else {
					// Inject an `&` in place of a `?`. Note that `sep === "&"`
					if (prev !== i) result += template.slice(prev, i)
					result += "&"
					prev = i + 1
				}
				state = QUERY
			} else if (state === ESCAPE) {
				// Drop the preceding `\` character from the appended segment
				if (prev !== start) {
					result += template.slice(prev, start)
				}

				state = CHAR
				start = prev = i
			} else if (ch === "\\") {
				start = i
				state = ESCAPE
			} else if (ch === ":" || ch === "*") {
				if (state > CHAR) {
					throw new SyntaxError("Template parameter names must be separated by either a '/', '-', or '.'.")
				}
				// eslint-disable-next-line no-bitwise
				state = VAR_START | (ch === "*")
				start = i
			} else if (ch === "/" || ch === "." || ch === "-") {
				state = CHAR
			} else if (state > CHAR) {
				// eslint-disable-next-line no-bitwise
				state |= STATE_IS_NEXT
			}

			continue
		}

		if (prev === 0 && params == null) {
			return template
		}

		if (prev < template.length) {
			result += template.slice(prev)
		}

		if (hashIndex >= 0) {
			hash = result.slice(hashIndex)
			result = result.slice(0, hashIndex)
		}

		return serializeQueryParams(sep, result, inTemplate, params) + hash
	}
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
