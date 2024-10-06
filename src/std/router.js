/* global window: false */
import m from "../core.js"

import {p} from "../util.js"

var mustReplace = false
var routePrefix, currentUrl, currentPath, currentHref

function updateRouteWithHref(href, update) {
	if (currentHref === href) return
	currentHref = href
	if (update) m.redraw()

	var url = new URL(href)
	var urlPath = url.pathname + url.search + url.hash
	var index = urlPath.indexOf(routePrefix)
	var prefix = routePrefix
	if (index < 0) index = urlPath.indexOf(prefix = encodeURI(prefix))
	if (index >= 0) urlPath = urlPath.slice(index + prefix.length)
	if (urlPath[0] !== "/") urlPath = `/${urlPath}`

	currentUrl = new URL(urlPath, href)
	currentPath = decodeURI(currentUrl.pathname)
	mustReplace = false
}

function updateRoute() {
	updateRouteWithHref(window.location.href, true)
}

function set(path, {replace, state} = {}) {
	if (!currentUrl) {
		throw new ReferenceError("Route state must be fully initialized first")
	}
	if (mustReplace) replace = true
	mustReplace = true
	p.then(updateRoute)
	if (typeof window === "object") {
		m.redraw()
		window.history[replace ? "replaceState" : "pushState"](state, "", routePrefix + path)
	}
}

export default {
	init(prefix = "#!", href) {
		if (!href) {
			if (typeof window !== "object") {
				throw new TypeError("Outside the DOM, `href` must be provided")

			}
			window.addEventListener("popstate", updateRoute, false)
			window.addEventListener("hashchange", updateRoute, false)
			href = window.location.href
		}

		routePrefix = prefix
		updateRouteWithHref(href, false)
	},
	set,
	get: () => currentPath + currentUrl.search + currentUrl.hash,
	get path() { return currentPath },
	get params() { return currentUrl.searchParams },
	// Let's provide a *right* way to manage a route link, rather than letting people screw up
	// accessibility on accident.
	link: (opts) => (
		opts.disabled
			// If you *really* do want add `onclick` on a disabled link, spread this and add it
			// explicitly in your code.
			? {disabled: true, "aria-disabled": "true"}
			: {
				href: routePrefix + opts.href,
				onclick(e) {
					if (typeof opts.onclick === "function") {
						opts.onclick.apply(this, arguments)
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
						!e.defaultPrevented &&
						// Ignore everything but left clicks
						(e.button === 0 || e.which === 0 || e.which === 1) &&
						// Let the browser handle `target=_blank`, etc.
						(!e.currentTarget.target || e.currentTarget.target === "_self") &&
						// No modifier keys
						!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
					) {
						set(opts.href, opts)
						// Capture the event, and don't double-call `redraw`.
						return m.capture(e)
					}
				},
			}),
}
