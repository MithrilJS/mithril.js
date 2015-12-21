(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.mithril = factory();
}(this, function () { 'use strict';

    var type$1 = {}.toString;

    function isFunction(object) {
        return typeof object === "function";
    };

    function isObject(object) {
        return type$1.call(object) === "[object Object]";
    };

    function isString(object) {
        return type$1.call(object) === "[object String]";
    };

    var isArray = Array.isArray || function (object) {
        return type$1.call(object) === "[object Array]";
    };

    var parser     = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g;
    var attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
    /**
     *
     * @param {Tag} The DOM node tag
     * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
     * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array, or splat (optional)
     *
     */
    function parse(tag, pairs) {
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
                cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" :true);
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

    function gettersetter(store) {
        var prop = function() {
            if (arguments.length) store = arguments[0];
            return store;
        };

        prop.toJSON = function() {
            return store;
        };

        return prop;
    }

    function prop (store) {
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

    //Promiz.mithril.js | Zolmeister | MIT
    //a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
    //1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
    //2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
    function Deferred(successCallback, failureCallback) {
        var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
        var self = this, state = 0, promiseValue = 0, next = [];

        self.promise = {};

        self.resolve = function(value) {
            if (!state) {
                promiseValue = value;
                state = RESOLVING;

                fire();
            }
            return this;
        };

        self.reject = function(value) {
            if (!state) {
                promiseValue = value;
                state = REJECTING;

                fire();
            }
            return this;
        };

        self.promise.then = function(successCallback, failureCallback) {
            var deferred = new Deferred(successCallback, failureCallback)
            if (state === RESOLVED) {
                deferred.resolve(promiseValue);
            }
            else if (state === REJECTED) {
                deferred.reject(promiseValue);
            }
            else {
                next.push(deferred);
            }
            return deferred.promise
        };

        function finish(type) {
            state = type || REJECTED;
            next.map(function(deferred) {
                state === RESOLVED ? deferred.resolve(promiseValue) : deferred.reject(promiseValue);
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
                }
                catch (e) {
                    m.deferred.onerror(e);
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
            }
            catch (e) {
                m.deferred.onerror(e);
                promiseValue = e;
                state = REJECTING;
                return fire();
            }

            if (state === REJECTING) {
                m.deferred.onerror(promiseValue)
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
                    }
                    else if (state === REJECTING && isFunction(failureCallback)) {
                        promiseValue = failureCallback(promiseValue);
                        state = RESOLVING;
                    }
                }
                catch (e) {
                    m.deferred.onerror(e);
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
    }

    var $document;

    function identity(value) { return value; }

    function ajax(options) {
        if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
            var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36)
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
                + "&" + buildQueryString(options.data || {});
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
                throw new Error("Request data should be either be a string or FormData. Check the `serialize` option in `m.request`");
            }
            xhr.send(data);
            return xhr;
        }
    }

    function bindData(xhrOptions, data, serialize) {
        if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
            var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
            var querystring = buildQueryString(data);
            xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "");
        }
        else xhrOptions.data = serialize(data);
        return xhrOptions;
    }

    function parameterizeUrl(url, data) {
        var tokens = url.match(/:[a-z]\w+/gi);
        if (tokens && data) {
            forEach(tokens, function (token) {
                var key = token.slice(1);
                url = url.replace(token, data[key]);
                delete data[key];
            });
        }
        return url;
    }

    function request (xhrOptions) {
        if (xhrOptions.background !== true) m.startComputation();
        var deferred = new Deferred();
        var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp"
        var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
        var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
        var extract = isJSONP ? function(jsonp) { return jsonp.responseText } : xhrOptions.extract || function(xhr) {
            if (xhr.responseText.length === 0 && deserialize === JSON.parse) {
                return null
            } else {
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
                        forEach(response, function (res, i) {
                            response[i] = new xhrOptions.type(res);
                        });
                    } else if (xhrOptions.type) {
                        response = new xhrOptions.type(response);
                    }
                    deferred.resolve(response)
                } else {
                    deferred.reject(response)
                }

                deferred[e.type === "load" ? "resolve" : "reject"](response);
            }
            catch (e) {
                deferred.reject(e);
            }
            finally {
                if (xhrOptions.background !== true) m.endComputation()
            }
        }

        ajax(xhrOptions);
        deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
        return deferred.promise;
    };

    var m$1 = parse;

    m$1.version = function() {
        return "v0.2.2-rc.1";
    };

    m$1.prop = prop;
    m$1.request = request;

    return m$1;

}));