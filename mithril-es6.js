(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.mithril = factory();
}(this, function () { 'use strict';

    var encode = encodeURIComponent;
    var decode = decodeURIComponent;
    function noop() {}

    var type = {}.toString;

    function isFunction(object) {
        return typeof object === "function";
    }

    function isObject(object) {
        return type.call(object) === "[object Object]";
    }

    function isString(object) {
        return type.call(object) === "[object String]";
    }

    var isArray = Array.isArray || function(object) {
        return type.call(object) === "[object Array]";
    }

    var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g;
    var attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
    /**
     *
     * @param {Tag} The DOM node tag
     * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
     * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
     *
     */
    function parse(tag, pairs) {
        /*eslint max-statements:[2, 24] */
        for (var args = [], i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
        if (isObject(tag)) return parameterize(tag, args);
        var hasAttrs = pairs != null && isObject(pairs) && !("tag" in pairs || "view" in pairs || "subtree" in pairs);
        var attrs = hasAttrs ? pairs : {};
        var classAttrName = "class" in attrs ? "class" : "className";
        var cell = {tag: "div", attrs: {}};
        var match, classes = [];
        if (!isString(tag)) throw new Error("selector in m(selector, attrs, children) should be a string");
        while ((match = parser.exec(tag)) != null) {
            if (match[1] === "" && match[2]) cell.tag = match[2];
            else if (match[1] === "#") cell.attrs.id = match[2];
            else if (match[1] === ".") classes.push(match[2]);
            else if (match[3][0] === "[") {
                var pair = attrParser.exec(match[3]);
                cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true);
            }
        }

        var children = hasAttrs ? args.slice(1) : args;
        if (children.length === 1 && isArray(children[0])) {
            cell.children = children[0];
        }
        else {
            cell.children = children;
        }

        for (var attrName in attrs) {
            if (attrs.hasOwnProperty(attrName)) {
                if (attrName === classAttrName && attrs[attrName] != null && attrs[attrName] !== "") {
                    classes.push(attrs[attrName]);
                    cell.attrs[attrName] = ""; //create key in correct iteration order
                }
                else cell.attrs[attrName] = attrs[attrName];
            }
        }
        if (classes.length) cell.attrs[classAttrName] = classes.join(" ");

        return cell;
    }

    function parameterize(component, args) {
        var controller = function() {
            return (component.controller || noop).apply(this, args) || this;
        };
        if (component.controller) controller.prototype = component.controller.prototype;
        var view = function(ctrl) {
            var currentArgs = arguments.length > 1 ? args.concat([].slice.call(arguments, 1)) : args;
            return component.view.apply(component, currentArgs ? [ctrl].concat(currentArgs) : [ctrl]);
        };
        view.$original = component.view;
        var output = {controller: controller, view: view};
        if (args[0] && args[0].key != null) output.attrs = {key: args[0].key};
        return output;
    }

    function forEach(list, f) {
        /*eslint no-empty:0 */
        for (var i = 0; i < list.length && !f(list[i], i++);) {}
    }

    function gettersetter(store) {
        var val = function() {
            if (arguments.length) store = arguments[0];
            return store;
        };

        val.toJSON = function() {
            return store;
        };

        return val;
    }

    function prop(store) {
        //note: using non-strict equality check here because we're checking if store is null OR undefined
        if ((store != null && isObject(store) || isFunction(store)) && isFunction(store.then)) {
            return propify(store);
        }

        return gettersetter(store);
    }

    function propify(promise, initialValue) {
        var local = prop(initialValue);
        promise.then(local);
        local.then = function(resolve, reject) {
            return propify(promise.then(resolve, reject), initialValue);
        };
        local["catch"] = local.then.bind(null, null);
        return local;
    }

    var $document;
    var $location;
    var $cancelAnimationFrame;
    var $requestAnimationFrame;

    var redrawing = false;
    var forcing = false;
    var lastRedrawId = null;
    var lastRedrawCallTime = 0;
    var FRAME_BUDGET = 16;
    var computePreRedrawHook = null;
    var computePostRedrawHook = null;
    function preredraw(value) {
        computePreRedrawHook = value;
    }

    function postredraw(value) {
        computePostRedrawHook = value;
    }

    function redraw(force) {
        if (redrawing) return;
        redrawing = true;
        if (force) forcing = true;
        try {
            //lastRedrawId is a positive number if a second redraw is requested before the next animation frame
            //lastRedrawID is null if it's the first redraw and not an event handler
            if (lastRedrawId && !force) {
                //when rAF: always reschedule redraw
                //when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame,
                //otherwise keep currently scheduled timeout
                if ($requestAnimationFrame === window.requestAnimationFrame
                    || Date.now() - lastRedrawCallTime > FRAME_BUDGET) {
                    if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
                    lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET);
                }
            }
            else {
                redraw();
                lastRedrawId = $requestAnimationFrame(function() { lastRedrawId = null; }, FRAME_BUDGET);
            }
        }
        finally {
            redrawing = forcing = false;
        }
    }

    redraw.strategy = prop();

    var pendingRequests = 0;

    function start() {
        pendingRequests++;
    }

    function end() {
        if (pendingRequests > 1) {
            pendingRequests--;
        }
        else {
            pendingRequests = 0;
            redraw();
        }
    }

    function endFirst() {
        if (redraw.strategy() === "none") {
            pendingRequests--;
            redraw.strategy("diff");
        }
        else {
            end();
        }
    }

    function clear() {
        pendingRequests = 0;
    }

    var roots = [];
    var components = [];
    var controllers = [];
    var unloaders = [];
    var nodeCache = [];
    var cellCache = {};
    function unload(cached) {
        if (cached.configContext && isFunction(cached.configContext.onunload)) {
            cached.configContext.onunload();
            cached.configContext.onunload = null;
        }
        if (cached.controllers) {
            forEach(cached.controllers, function(controller) {
                if (isFunction(controller.onunload)) controller.onunload({preventDefault: noop});
            });
        }
        if (cached.children) {
            if (isArray(cached.children)) forEach(cached.children, unload);
            else if (cached.children.tag) unload(cached.children);
        }
    }

    function clear$1(nodes, cached) {
        for (var i = nodes.length - 1; i > -1; i--) {
            if (nodes[i] && nodes[i].parentNode) {
                try { nodes[i].parentNode.removeChild(nodes[i]); }
                catch (e) {
                    //ignore if this fails due to order of events
                    //(see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
                    //eslint-disable-line
                }
                cached = [].concat(cached);
                if (cached[i]) unload(cached[i]);
            }
        }
        //release memory if nodes is an array. This check should fail if nodes is a NodeList (see loop above)
        if (nodes.length) nodes.length = 0;
    }

    function getCellCacheKey(element) {
        var index = nodeCache.indexOf(element);
        return index < 0 ? nodeCache.push(element) - 1 : index;
    }

    function reset(root) {
        var cacheKey = getCellCacheKey(root);
        clear$1(root.childNodes, cellCache[cacheKey]);
        cellCache[cacheKey] = undefined;
    }

    function removeRootElement(root, index) {
        roots.splice(index, 1);
        controllers.splice(index, 1);
        components.splice(index, 1);
        reset(root);
        nodeCache.splice(getCellCacheKey(root), 1);
    }

    function clearUnloaders() {
        unloaders = [];
    }

    var topComponent;

    function mount(root, component) {
        /*eslint max-statements:[2, 26] */
        if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
        var index = roots.indexOf(root);
        if (index < 0) index = roots.length;

        var isPrevented = false;
        var event = {
            preventDefault: function() {
                isPrevented = true;
                preredraw(null);
                postredraw(null);
            }
        };

        forEach(unloaders, function(unloader) {
            unloader.handler.call(unloader.controller, event);
            unloader.controller.onunload = null;
        });

        if (isPrevented) {
            forEach(unloaders, function(unloader) {
                unloader.controller.onunload = unloader.handler;
            });
        }
        else clearUnloaders();

        if (controllers[index] && isFunction(controllers[index].onunload)) {
            controllers[index].onunload(event);
        }

        var isNullComponent = component === null;

        if (!isPrevented) {
            redraw.strategy("all");
            start();
            roots[index] = root;
            var currentComponent = component ? (topComponent = component) : (topComponent = component = {controller: noop});
            var controller = new (component.controller || noop)();
            //controllers may call m.mount recursively (via m.route redirects, for example)
            //this conditional ensures only the last recursive m.mount call is applied
            if (currentComponent === topComponent) {
                controllers[index] = controller;
                components[index] = component;
            }
            endFirst();
            if (isNullComponent) {
                removeRootElement(root, index);
            }
            return controllers[index];
        }
        if (isNullComponent) {
            removeRootElement(root, index);
        }
    }

    // Promiz.mithril.js | Zolmeister | MIT
    // a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
    // 1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
    // 2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
    function Deferred(successCallback, failureCallback) {
        /*eslint-disable*/
        var RESOLVING = 1;
        var REJECTING = 2;
        var RESOLVED = 3;
        var REJECTED = 4;
        var self = this;
        var state = 0;
        var promiseValue = 0;
        var next = [];

        self.promise = {};

        self.resolve = function (value) {
            if (!state) {
                promiseValue = value;
                state = RESOLVING;

                fire();
            }
            return this;
        };

        self.reject = function (value) {
            if (!state) {
                promiseValue = value;
                state = REJECTING;

                fire();
            }
            return this;
        };

        self.promise.then = function (successCallback, failureCallback) {
            var local = new Deferred(successCallback, failureCallback)
            
            if (state === RESOLVED) {
                local.resolve(promiseValue);
            } else if (state === REJECTED) {
                local.reject(promiseValue);
            } else {
                next.push(local);
            }
            
            return local.promise;
        };

        function finish(type) {
            state = type || REJECTED;

            next.map(function (local) {
                local[state === RESOLVED ? "resolve" : "reject"](promiseValue);
            });
        }

        function thennable(then, successCallback, failureCallback, notThennableCallback) {
            if (((promiseValue != null && isObject(promiseValue)) || isFunction(promiseValue)) && isFunction(then)) {
                try {
                    // count protects against abuse calls from spec checker
                    var count = 0;
                    then.call(promiseValue, function(value) {
                        if (count++) return;
                        promiseValue = value;
                        successCallback();
                    }, function (value) {
                        if (count++) return;
                        promiseValue = value;
                        failureCallback();
                    });
                } catch (e) {
                    deferred.onerror(e);
                    promiseValue = e;
                    failureCallback();
                }
            } else {
                notThennableCallback();
            }
        }

        function fire() {
            // check if it's a thenable
            var then;
            try {
                then = promiseValue && promiseValue.then;
            } catch (e) {
                deferred.onerror(e);
                promiseValue = e;
                state = REJECTING;
                return fire();
            }

            if (state === REJECTING) {
                deferred.onerror(promiseValue)
            }

            thennable(then, function () {
                state = RESOLVING
                fire()
            }, function () {
                state = REJECTING
                fire()
            }, function () {
                try {
                    if (state === RESOLVING && isFunction(successCallback)) {
                        promiseValue = successCallback(promiseValue);
                    } else if (state === REJECTING && isFunction(failureCallback)) {
                        promiseValue = failureCallback(promiseValue);
                        state = RESOLVING;
                    }
                } catch (e) {
                    deferred.onerror(e);
                    promiseValue = e;
                    return finish();
                }

                if (promiseValue === self) {
                    promiseValue = TypeError();
                    finish();
                } else {
                    thennable(then, function () {
                        finish(RESOLVED);
                    }, finish, function () {
                        finish(state === RESOLVING && RESOLVED);
                    });
                }
            });
        }
        /*eslint-enable*/
    }

    function deferred() {
        var local = new Deferred();
        local.promise = propify(local.promise);

        return local;
    }

    deferred.onerror = function(e) {
        if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) {
            clear();

            throw e;
        }
    };

    function build(object, prefix) {
        var duplicates = {};
        var str = [];
        for (var prop in object) {
            var key = prefix ? prefix + "[" + prop + "]" : prop;
            var value = object[prop];

            if (value === null) {
                str.push(encode(key));
            }
            else if (isObject(value)) {
                str.push(build(value, key));
            }
            else if (isArray(value)) {
                var keys = [];
                duplicates[key] = duplicates[key] || {};
                forEach(value, function(item) {
                    if (!duplicates[key][item]) {
                        duplicates[key][item] = true;
                        keys.push(encode(key) + "=" + encode(item));
                    }
                });
                str.push(keys.join("&"));
            }
            else if (value !== undefined) {
                str.push(encode(key) + "=" + encode(value));
            }
        }
        return str.join("&");
    }

    function parse$1(str) {
        if (str === "" || str == null) return {};
        if (str.charAt(0) === "?") str = str.slice(1);

        var pairs = str.split("&");
        var params = {};

        forEach(pairs, function(string) {
            var pair = string.split("=");
            var key = decode(pair[0]);
            var value = pair.length === 2 ? decode(pair[1]) : null;
            if (params[key] != null) {
                if (!isArray(params[key])) params[key] = [params[key]];
                params[key].push(value);
            }
            else params[key] = value;
        });

        return params;
    }

    function identity(value) { return value; }

    function ajax(options) {
        /*eslint max-statements:[2, 23] */
        if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
            var callbackKey = "mithril_callback_"
                + new Date().getTime()
                + "_" + (Math.round(Math.random() * 1e16)).toString(36);
            var script = $document.createElement("script");

            window[callbackKey] = function(resp) {
                script.parentNode.removeChild(script);
                options.onload({
                    type: "load",
                    target: {
                        responseText: resp
                    }
                });
                window[callbackKey] = undefined;
            };

            script.onerror = function() {
                script.parentNode.removeChild(script);

                options.onerror({
                    type: "error",
                    target: {
                        status: 500,
                        responseText: JSON.stringify({
                            error: "Error making jsonp request"
                        })
                    }
                });
                window[callbackKey] = undefined;

                return false;
            }

            script.onload = function() {
                return false;
            };

            script.src = options.url
                + (options.url.indexOf("?") > 0 ? "&" : "?")
                + (options.callbackKey ? options.callbackKey : "callback")
                + "=" + callbackKey
                + "&" + build(options.data || {});
            $document.body.appendChild(script);
        }
        else {
            var xhr = new window.XMLHttpRequest();
            xhr.open(options.method, options.url, true, options.user, options.password);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
                    else options.onerror({type: "error", target: xhr});
                }
            };

            if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
                xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            }

            if (options.deserialize === JSON.parse) {
                xhr.setRequestHeader("Accept", "application/json, text/*");
            }

            if (isFunction(options.config)) {
                var maybeXhr = options.config(xhr, options);
                if (maybeXhr != null) xhr = maybeXhr;
            }

            var data = options.method === "GET" || !options.data ? "" : options.data;
            if (data && (!isString(data) && data.constructor !== window.FormData)) {
                throw new Error(
                    "Request data should be either be a string or FormData."
                    + " Check the `serialize` option in `m.request`"
                );
            }
            xhr.send(data);
            return xhr;
        }
    }

    function bindData(xhrOptions, data, serialize) {
        if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
            var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
            var querystring = build(data);

            xhrOptions.url += (querystring ? prefix + querystring : "");
        }
        else xhrOptions.data = serialize(data);

        return xhrOptions;
    }

    function parameterizeUrl(url, data) {
        var tokens = url.match(/:[a-z]\w+/gi);
        if (tokens && data) {
            forEach(tokens, function(token) {
                var key = token.slice(1);
                url = url.replace(token, data[key]);
                delete data[key];
            });
        }
        return url;
    }

    function request(xhrOptions) {
        if (xhrOptions.background !== true) start();
        var deferred = new Deferred();
        var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp"
        var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
        var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
        var extract = isJSONP ? function(jsonp) { return jsonp.responseText } : xhrOptions.extract || function(xhr) {
            if (xhr.responseText.length === 0 && deserialize === JSON.parse) {
                return null
            }
            else {
                return xhr.responseText
            }
        };
        xhrOptions.method = (xhrOptions.method || "GET").toUpperCase();
        xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
        xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
        xhrOptions.onload = xhrOptions.onerror = function(e) {
            try {
                e = e || event;
                var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
                var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
                if (e.type === "load") {
                    if (isArray(response) && xhrOptions.type) {
                        forEach(response, function(res, i) {
                            response[i] = new xhrOptions.type(res);
                        });
                    }
                    else if (xhrOptions.type) {
                        response = new xhrOptions.type(response);
                    }

                    deferred.resolve(response)
                }
                else {
                    deferred.reject(response)
                }

                deferred[e.type === "load" ? "resolve" : "reject"](response);
            }
            catch (error) {
                deferred.reject(error);
            }
            finally {
                if (xhrOptions.background !== true) end()
            }
        }

        ajax(xhrOptions);
        deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
        return deferred.promise;
    }

    var modes = {pathname: "", hash: "#", search: "?"};
    var redirect = noop;
    var routeParams;
    var currentRoute;
    var isDefaultRoute = false;
    function normalizeRoute(route) {
        return route.slice(modes[route.mode].length);
    }

    function routeByValue(root, router, path) {
        routeParams = {};

        var queryStart = path.indexOf("?");
        if (queryStart !== -1) {
            routeParams = parse$1(path.substr(queryStart + 1, path.length));
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
            args = route.mode === "pathname" && currentTarget.search ? parse$1(currentTarget.search.slice(1)) : {};
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
            var params = queryIndex > -1 ? parse$1(currentRoute.slice(queryIndex + 1)) : {};
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
    route.parseQueryString = parse$1;

    function trust(value) {
        /*eslint no-new-wrapper:0 */
        value = new String(value);
        value.$trusted = true;
        return value;
    }

    function component(component) {
        for (var args = [], i = 1; i < arguments.length; i++) args.push(arguments[i]);
        return parameterize(component, args);
    }

    var m = parse;

    m.version = function() {
        return "v0.2.3";
    };

    m.mount = mount;
    m.prop = prop;
    m.redraw = redraw;
    m.request = request;
    m.route = route;
    m.trust = trust;
    m.component = component;

    return m;

}));