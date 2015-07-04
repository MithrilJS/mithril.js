var mDOM = require('./DOM');

var m = {};

var types = require('../core/types'),
	type = types.type,
	FUNCTION = types.FUNCTION,
	ARRAY = types.ARRAY,
	STRING = types.STRING,
	OBJECT = types.OBJECT;

var fns = require('../core/fns'),
	clear = fns.clear,
	getCellCacheKey = fns.getCellCacheKey;

var qStr = require('../core/query-str'),
	buildQueryString = qStr.buildQueryString,
	parseQueryString = qStr.parseQueryString;

var $ = require('../core/init')

var noop = function(){};

//routing
var modes = {pathname: "", hash: "#", search: "?"};
var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;
m.route = function() {
	//m.route()
	if (arguments.length === 0) return currentRoute;
	//m.route(el, defaultRoute, routes)
	else if (arguments.length === 3 && type.call(arguments[1]) === STRING) {
		var root = arguments[0], defaultRoute = arguments[1], router = arguments[2];
		redirect = function(source) {
			var path = currentRoute = normalizeRoute(source);
			if (!routeByValue(root, router, path)) {
				if (isDefaultRoute) throw new Error("Ensure the default route matches one of the routes defined in m.route")
				isDefaultRoute = true
				m.route(defaultRoute, true)
				isDefaultRoute = false
			}
		};
		var listener = m.route.mode === "hash" ? "onhashchange" : "onpopstate";
		window[listener] = function() {
			var path = $.location[m.route.mode]
			if (m.route.mode === "pathname") path += $.location.search
			if (currentRoute != normalizeRoute(path)) {
				redirect(path)
			}
		};
		m.route.computePreRedrawHook = setScroll;
		window[listener]()
	}
	//config: m.route
	else if (arguments[0].addEventListener || arguments[0].attachEvent) {
		var element = arguments[0];
		var isInitialized = arguments[1];
		var context = arguments[2];
		var vdom = arguments[3];
		element.href = (m.route.mode !== 'pathname' ? $.location.pathname : '') + modes[m.route.mode] + vdom.attrs.href;
		if (element.addEventListener) {
			element.removeEventListener("click", routeUnobtrusive);
			element.addEventListener("click", routeUnobtrusive)
		}
		else {
			element.detachEvent("onclick", routeUnobtrusive);
			element.attachEvent("onclick", routeUnobtrusive)
		}
	}
	//m.route(route, params, shouldReplaceHistoryEntry)
	else if (type.call(arguments[0]) === STRING) {
		var oldRoute = currentRoute;
		currentRoute = arguments[0];
		var args = arguments[1] || {}
		var queryIndex = currentRoute.indexOf("?")
		var params = queryIndex > -1 ? parseQueryString(currentRoute.slice(queryIndex + 1)) : {}
		for (var i in args) params[i] = args[i]
		var querystring = buildQueryString(params)
		var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute
		if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

		var shouldReplaceHistoryEntry = (arguments.length === 3 ? arguments[2] : arguments[1]) === true || oldRoute === arguments[0];

		if (window.history.pushState) {
			m.route.computePreRedrawHook = setScroll
			m.route.computePostRedrawHook = function() {
				window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](null, $.document.title, modes[m.route.mode] + currentRoute);
			};
			redirect(modes[m.route.mode] + currentRoute)
		}
		else {
			$.location[m.route.mode] = currentRoute
			redirect(modes[m.route.mode] + currentRoute)
		}
	}
};
m.route.param = function(key) {
	if (!routeParams) throw new Error("You must call m.route(element, defaultRoute, routes) before calling m.route.param()")
	return routeParams[key]
};
m.route.mode = "search";
function normalizeRoute(route) {
	return route.slice(modes[m.route.mode].length)
}
function routeByValue(root, router, path) {
	routeParams = {};

	var queryStart = path.indexOf("?");
	if (queryStart !== -1) {
		routeParams = parseQueryString(path.substr(queryStart + 1, path.length));
		path = path.substr(0, queryStart)
	}

	// Get all routes and check if there's
	// an exact match for the current path
	var keys = Object.keys(router);
	var index = keys.indexOf(path);
	if(index !== -1){
		mDOM.mount(root, router[keys [index]]);
		return true;
	}

	for (var route in router) {
		if (route === path) {
			mDOM.mount(root, router[route]);
			return true
		}

		var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$");

		if (matcher.test(path)) {
			path.replace(matcher, function() {
				var keys = route.match(/:[^\/]+/g) || [];
				var values = [].slice.call(arguments, 1, -2);
				for (var i = 0, len = keys.length; i < len; i++) routeParams[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
				mDOM.mount(root, router[route])
			});
			return true
		}
	}
}
function routeUnobtrusive(e) {
	e = e || event;
	if (e.ctrlKey || e.metaKey || e.which === 2) return;
	if (e.preventDefault) e.preventDefault();
	else e.returnValue = false;
	var currentTarget = e.currentTarget || e.srcElement;
	var args = m.route.mode === "pathname" && currentTarget.search ? parseQueryString(currentTarget.search.slice(1)) : {};
	while (currentTarget && currentTarget.nodeName.toUpperCase() != "A") currentTarget = currentTarget.parentNode
	m.route(currentTarget[m.route.mode].slice(modes[m.route.mode].length), args)
}
function setScroll() {
	if (m.route.mode != "hash" && $.location.hash) $.location.hash = $.location.hash;
	else window.scrollTo(0, 0)
}

m.route.buildQueryString = buildQueryString
m.route.parseQueryString = parseQueryString

function reset(root) {
	var cacheKey = getCellCacheKey(root);
	clear(root.childNodes, cellCache[cacheKey]);
	cellCache[cacheKey] = undefined
}

module.exports = m;
