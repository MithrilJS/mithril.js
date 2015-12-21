import {$document, $location} from "./_env.js";
import {noop, decode} from "./_util.js";
import {isString} from "./_types.js";
import {forEach} from "./_iterate.js";
import {build, parse} from "./_query-string.js";
import {clear} from "./computation.js";
import {preredraw, postredraw} from "./redraw.js";
import {mount} from "./mount.js";

var modes = {pathname: "", hash: "#", search: "?"};
var redirect = noop, routeParams, currentRoute, isDefaultRoute = false;

function normalizeRoute(route) {
    return route.slice(modes[route.mode].length);
}

function routeByValue(root, router, path) {
    routeParams = {};

    var queryStart = path.indexOf("?");
    if (queryStart !== -1) {
        routeParams = parse(path.substr(queryStart + 1, path.length));
        path = path.substr(0, queryStart);
    }

    //Get all routes and check if there's
    //an exact match for the current path
    var keys = Object.keys(router);
    var index = keys.indexOf(path);
    if (index !== -1){
        mount(root, router[keys [index]]);
        return true;
    }

    for (var route in router) {
        if (route === path) {
            mount(root, router[route]);
            return true;
        }

        var matcher = new RegExp(
            "^"
            + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)")
            + "\/?$"
        );

        if (matcher.test(path)) {
            path.replace(matcher, function() {
                var keys = route.match(/:[^\/]+/g) || [];
                var values = [].slice.call(arguments, 1, -2);
                forEach(keys, function(key, i) {
                    routeParams[key.replace(/:|\./g, "")] = decode(values[i]);
                })
                mount(root, router[route]);
            });
            return true;
        }
    }
}

function routeUnobtrusive(e) {
    e = e || event;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return;

    if (e.preventDefault) e.preventDefault();
    else e.returnValue = false;

    var currentTarget = e.currentTarget || e.srcElement,
        args = route.mode === "pathname" && currentTarget.search ? parse(currentTarget.search.slice(1)) : {};
    while (currentTarget && currentTarget.nodeName.toUpperCase() !== "A") currentTarget = currentTarget.parentNode;
    //clear pendingRequests because we want an immediate route change
    clear();
    route(currentTarget[route.mode].slice(modes[route.mode].length), args);
}

function setScroll() {
    if (route.mode !== "hash" && $location.hash) $location.hash = $location.hash;
    else window.scrollTo(0, 0);
}

function route(root, arg1, arg2, vdom) {
    /*eslint max-statements:[2, 28] */
    //route()
    if (arguments.length === 0) return currentRoute;
    //route(el, defaultRoute, routes)
    else if (arguments.length === 3 && isString(arg1)) {
        redirect = function(source) {
            var path = currentRoute = normalizeRoute(source);
            if (!routeByValue(root, arg2, path)) {
                if (isDefaultRoute) {
                    throw new Error("Ensure the default route matches one of the routes defined in route");
                }

                isDefaultRoute = true;
                route(arg1, true);
                isDefaultRoute = false;
            }
        };
        var listener = route.mode === "hash" ? "onhashchange" : "onpopstate";
        window[listener] = function() {
            var path = $location[route.mode];
            if (route.mode === "pathname") path += $location.search;
            if (currentRoute !== normalizeRoute(path)) redirect(path);
        };

        preredraw(setScroll);
        window[listener]();
    }
    //config: route
    else if (root.addEventListener || root.attachEvent) {
        root.href = (route.mode !== "pathname" ? $location.pathname : "") + modes[route.mode] + vdom.attrs.href;
        if (root.addEventListener) {
            root.removeEventListener("click", routeUnobtrusive);
            root.addEventListener("click", routeUnobtrusive);
        }
        else {
            root.detachEvent("onclick", routeUnobtrusive);
            root.attachEvent("onclick", routeUnobtrusive);
        }
    }
    //route(route, params, shouldReplaceHistoryEntry)
    else if (isString(root)) {
        var oldRoute = currentRoute;
        currentRoute = root;
        var args = arg1 || {};
        var queryIndex = currentRoute.indexOf("?");
        var params = queryIndex > -1 ? parse(currentRoute.slice(queryIndex + 1)) : {};
        for (var i in args) params[i] = args[i];
        var querystring = build(params);
        var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute;
        if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

        var shouldReplaceHistoryEntry = (arguments.length === 3 ? arg2 : arg1) === true || oldRoute === root;

        if (window.history.pushState) {
            preredraw(setScroll);
            postredraw(function() {
                window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](
                    null,
                    $document.title,
                    modes[route.mode] + currentRoute
                );
            });
            redirect(modes[route.mode] + currentRoute);
        }
        else {
            $location[route.mode] = currentRoute;
            redirect(modes[route.mode] + currentRoute);
        }
    }
}

route.param = function(key) {
    if (!routeParams) {
        throw new Error("You must call route(element, defaultRoute, routes) before calling route.param()");
    }

    if (!key) {
        return routeParams;
    }

    return routeParams[key];
};

route.mode = "search";

route.buildQueryString = build;
route.parseQueryString = parse;

export {route};
