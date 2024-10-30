/* global window: false */
import m from "../core.js"

export var WithRouter = ({prefix, initial: href}) => {
	if (prefix == null) prefix = ""

	if (typeof prefix !== "string") {
		throw new TypeError("The route prefix must be a string if given")
	}

	var mustReplace, redraw, currentUrl, currentPath

	var updateRouteWithHref = () => {
		var url = new URL(href)
		var urlPath = url.pathname + url.search + url.hash
		var decodedPrefix = prefix
		var index = urlPath.indexOf(decodedPrefix)
		if (index < 0) index = urlPath.indexOf(decodedPrefix = encodeURI(decodedPrefix))
		if (index >= 0) urlPath = urlPath.slice(index + decodedPrefix.length)
		if (urlPath[0] !== "/") urlPath = `/${urlPath}`

		currentUrl = new URL(urlPath, href)
		currentPath = decodeURI(currentUrl.pathname)
		mustReplace = false
	}

	var updateRoute = () => {
		if (href === window.location.href) return
		href = window.location.href
		var prevUrl = currentUrl
		updateRouteWithHref()
		if (currentUrl.href !== prevUrl.href) redraw()
	}

	var set = (path, {replace, state} = {}) => {
		if (mustReplace) replace = true
		mustReplace = true
		void (async () => {
			await 0 // wait for next microtask
			updateRoute()
		})()
		redraw()
		if (typeof window === "object") {
			window.history[replace ? "replaceState" : "pushState"](state, "", prefix + path)
		}
	}

	if (!href) {
		if (typeof window !== "object") {
			throw new TypeError("Outside the DOM, `href` must be set")
		}
		href = window.location.href
		window.addEventListener("popstate", updateRoute)
	}

	updateRouteWithHref()

	return function ({children}) {
		redraw = this.redraw

		return [
			m.remove(() => window.removeEventListener("popstate", updateRoute)),
			m.set({
				route: {
					prefix,
					path: currentPath,
					params: currentUrl.searchParams,
					current: currentPath + currentUrl.search + currentUrl.hash,
					set,
				},
			}, children),
		]
	}
}

// Let's provide a *right* way to manage a route link, rather than letting people screw up
// accessibility on accident.
//
// Note: this does *not* support disabling. Instead, consider more accessible alternatives like not
// showing the link in the first place. If you absolutely have to disable the link, disable it by
// removing this component (like via `m("div", {disabled}, !disabled && m(Link))`). There's
// friction here for a reason.
var Link = () => {
	var href, opts, setRoute
	var listener = (ev) => {
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
			!ev.defaultPrevented &&
			// Ignore everything but left clicks
			(ev.button === 0 || ev.which === 0 || ev.which === 1) &&
			// Let the browser handle `target=_blank`, etc.
			(!ev.currentTarget.target || ev.currentTarget.target === "_self") &&
			// No modifier keys
			!ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey
		) {
			setRoute(href, opts)
			// Capture the event, and don't double-call `redraw`.
			return m.capture(ev)
		}
	}

	return function (attrs, old) {
		setRoute = this.route.set
		href = attrs.h
		opts = attrs.o
		return [
			m.layout((dom) => {
				dom.href = this.route.prefix + href
				if (!old) dom.addEventListener("click", listener)
			}),
			m.remove((dom) => {
				dom.removeEventListener("click", listener)
			}),
		]
	}
}

export var link = (href, opts) => m(Link, {h: `${href}`, o: opts})
