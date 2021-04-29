import "./mount-redraw.js"
import "./promise.js"
import "./buildPathname.js"
import "./censor.js"
import "./parsePathname.js"
import {assign} from "./util.js"
import m from "./m.js"

// Compiles a template into a function that takes a resolved path (without query
// strings) and returns an object containing the template parameters with their
// parsed values. This expects the input of the compiled template to be the
// output of `parsePathname`. Note that it does *not* remove query parameters
// specified in the template.
function compileTemplate(template) {
	var templateData = m.parsePathname(template)
	var templateKeys = Object.keys(templateData.params)
	var keys = []
	var regexp = new RegExp("^" + templateData.path.replace(
		// I escape literal text so people can use things like `:file.:ext` or
		// `:lang-:locale` in routes. This is all merged into one pass so I
		// don't also accidentally escape `-` and make it harder to detect it to
		// ban it from template parameters.
		/:([^\/.-]+)(\.{3}|\.(?!\.)|-)?|[\\^$*+.()|\[\]{}]/g,
		function(m, key, extra) {
			if (key == null) return "\\" + m
			keys.push({k: key, r: extra === "..."})
			if (extra === "...") return "(.*)"
			if (extra === ".") return "([^/]+)\\."
			return "([^/]+)" + (extra || "")
		}
	) + "$")
	return function(data) {
		// First, check the params. Usually, there isn't any, and it's just
		// checking a static set.
		for (var i = 0; i < templateKeys.length; i++) {
			if (templateData.params[templateKeys[i]] !== data.params[templateKeys[i]]) return false
		}
		// If no interpolations exist, let's skip all the ceremony
		if (!keys.length) return regexp.test(data.path)
		var values = regexp.exec(data.path)
		if (values == null) return false
		for (var i = 0; i < keys.length; i++) {
			data.params[keys[i].k] = keys[i].r ? values[i + 1] : decodeURIComponent(values[i + 1])
		}
		return true
	}
}

var sentinel = {}

var p = Promise.resolve()

var scheduled = false

// state === 0: init
// state === 1: scheduled
// state === 2: done
var ready = false
var state = 0

var compiled, fallbackRoute

var currentResolver = sentinel, component, attrs, currentPath, lastUpdate

var RouterRoot = {
	onbeforeupdate: function() {
		state = state ? 2 : 1
		return !(!state || sentinel === currentResolver)
	},
	onremove: function() {
		window.removeEventListener("popstate", fireAsync, false)
		window.removeEventListener("hashchange", resolveRoute, false)
	},
	view: function() {
		if (!state || sentinel === currentResolver) return
		// Wrap in a fragment to preserve existing key semantics
		var vnode = [m(component, attrs)]
		return currentResolver ? currentResolver.render(vnode[0]) : vnode
	},
}

function resolveRoute() {
	scheduled = false
	// Consider the pathname holistically. The prefix might even be invalid,
	// but that's not our problem.
	var prefix = window.location.hash
	if (m.route.prefix[0] !== "#") {
		prefix = window.location.search + prefix
		if (m.route.prefix[0] !== "?") {
			prefix = window.location.pathname + prefix
			if (prefix[0] !== "/") prefix = "/" + prefix
		}
	}
	// This seemingly useless `.concat()` speeds up the tests quite a bit,
	// since the representation is consistently a relatively poorly
	// optimized cons string.
	var path = prefix.concat()
		.replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
		.slice(m.route.prefix.length)
	var data = m.parsePathname(path)

	assign(data.params, window.history.state)

	function reject(e) {
		console.error(e)
		setPath(fallbackRoute, null, {replace: true})
	}

	loop(0)
	function loop(i) {
		// state === 0: init
		// state === 1: scheduled
		// state === 2: done
		for (; i < compiled.length; i++) {
			if (compiled[i].check(data)) {
				var payload = compiled[i].component
				var matchedRoute = compiled[i].route
				var localComp = payload
				var update = lastUpdate = function(comp) {
					if (update !== lastUpdate) return
					if (comp === m.route.SKIP) return loop(i + 1)
					component = comp != null && (typeof comp.view === "function" || typeof comp === "function")? comp : "div"
					attrs = data.params, currentPath = path, lastUpdate = null
					currentResolver = payload.render ? payload : null
					if (state === 2) m.redraw()
					else {
						state = 2
						m.redraw.sync()
					}
				}
				// There's no understating how much I *wish* I could
				// use `async`/`await` here...
				if (payload.view || typeof payload === "function") {
					payload = {}
					update(localComp)
				}
				else if (payload.onmatch) {
					p.then(function () {
						return payload.onmatch(data.params, path, matchedRoute)
					}).then(update, path === fallbackRoute ? null : reject)
				}
				else update("div")
				return
			}
		}

		if (path === fallbackRoute) {
			throw new Error("Could not resolve default route " + fallbackRoute + ".")
		}
		setPath(fallbackRoute, null, {replace: true})
	}
}

// Set it unconditionally so `m.route.set` and `m.route.Link` both work,
// even if neither `pushState` nor `hashchange` are supported. It's
// cleared if `hashchange` is used, since that makes it automatically
// async.
function fireAsync() {
	if (!scheduled) {
		scheduled = true
		// TODO: just do `m.redraw()` here and elide the timer dependency. Note
		// that this will muck with tests a *lot*, so it's not as easy of a
		// change as it sounds.
		if (typeof window.setImmediate === "function") {
			window.setImmediate(resolveRoute)
		} else {
			window.setTimeout(resolveRoute)
		}
	}
}

function setPath(path, data, options) {
	path = m.buildPathname(path, data)
	if (ready) {
		fireAsync()
		var state = options ? options.state : null
		var title = options ? options.title : null
		if (options && options.replace) window.history.replaceState(state, title, m.route.prefix + path)
		else window.history.pushState(state, title, m.route.prefix + path)
	}
	else {
		window.location.href = m.route.prefix + path
	}
}

m.route = function(root, defaultRoute, routes) {
	if (!root) throw new TypeError("DOM element being rendered to does not exist.")

	compiled = Object.keys(routes).map(function(route) {
		if (route[0] !== "/") throw new SyntaxError("Routes must start with a '/'.")
		if ((/:([^\/\.-]+)(\.{3})?:/).test(route)) {
			throw new SyntaxError("Route parameter names must be separated with either '/', '.', or '-'.")
		}
		return {
			route: route,
			component: routes[route],
			check: compileTemplate(route),
		}
	})
	fallbackRoute = defaultRoute
	if (defaultRoute != null) {
		var defaultData = m.parsePathname(defaultRoute)

		if (!compiled.some(function (i) { return i.check(defaultData) })) {
			throw new ReferenceError("Default route doesn't match any known routes.")
		}
	}

	if (typeof window.history.pushState === "function") {
		window.addEventListener("popstate", fireAsync, false)
	} else if (m.route.prefix[0] === "#") {
		window.addEventListener("hashchange", resolveRoute, false)
	}

	ready = true
	m.mount(root, RouterRoot)
	resolveRoute()
}
m.route.set = function(path, data, options) {
	if (lastUpdate != null) {
		options = options || {}
		options.replace = true
	}
	lastUpdate = null
	setPath(path, data, options)
}
m.route.get = function() {return currentPath}
m.route.prefix = "#!"
m.route.SKIP = {}
m.route.Link = {
	view: function(vnode) {
		// Omit the used parameters from the rendered element - they are
		// internal. Also, censor the various lifecycle methods.
		//
		// We don't strip the other parameters because for convenience we
		// let them be specified in the selector as well.
		var child = m(
			vnode.attrs.selector || "a",
			m.censor(vnode.attrs, ["options", "params", "selector", "onclick"]),
			vnode.children
		)
		var options, onclick, href

		// Let's provide a *right* way to disable a route link, rather than
		// letting people screw up accessibility on accident.
		//
		// The attribute is coerced so users don't get surprised over
		// `disabled: 0` resulting in a button that's somehow routable
		// despite being visibly disabled.
		if (child.attrs.disabled = Boolean(child.attrs.disabled)) {
			child.attrs.href = null
			child.attrs["aria-disabled"] = "true"
			// If you *really* do want add `onclick` on a disabled link, use
			// an `oncreate` hook to add it.
		} else {
			options = vnode.attrs.options
			onclick = vnode.attrs.onclick
			// Easier to build it now to keep it isomorphic.
			href = m.buildPathname(child.attrs.href, vnode.attrs.params)
			child.attrs.href = m.route.prefix + href
			child.attrs.onclick = function(e) {
				var result
				if (typeof onclick === "function") {
					result = onclick.call(e.currentTarget, e)
				} else if (onclick == null || typeof onclick !== "object") {
					// do nothing
				} else if (typeof onclick.handleEvent === "function") {
					onclick.handleEvent(e)
				}

				// Adapted from React Router's implementation:
				// https://github.com/ReactTraining/react-router/blob/520a0acd48ae1b066eb0b07d6d4d1790a1d02482/packages/react-router-dom/modules/Link.js
				//
				// Try to be flexible and intuitive in how we handle links.
				// Fun fact: links aren't as obvious to get right as you
				// would expect. There's a lot more valid ways to click a
				// link than this, and one might want to not simply click a
				// link, but right click or command-click it to copy the
				// link target, etc. Nope, this isn't just for blind people.
				if (
					// Skip if `onclick` prevented default
					result !== false && !e.defaultPrevented &&
					// Ignore everything but left clicks
					(e.button === 0 || e.which === 0 || e.which === 1) &&
					// Let the browser handle `target=_blank`, etc.
					(!e.currentTarget.target || e.currentTarget.target === "_self") &&
					// No modifier keys
					!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
				) {
					e.preventDefault()
					e.redraw = false
					m.route.set(href, null, options)
				}
			}
		}
		return child
	},
}
m.route.param = function(key) {
	return attrs && key != null ? attrs[key] : attrs
}
