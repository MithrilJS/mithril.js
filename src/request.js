import {Deferred} from "./deferred.js";
import {propify} from "./prop.js";
import {$document} from "./env.js";
import {isFunction, isString, isArray} from "./types.js";
import {forEach} from "./iterate.js";
import {build as buildQueryString} from "./query-string.js";
import {start, end} from "./computation.js";

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
            + "&" + buildQueryString(options.data || {});
        $document.body.appendChild(script);
    } else {
        var xhr = new window.XMLHttpRequest();
        xhr.open(options.method, options.url, true, options.user, options.password);
        xhr.onreadystatechange = function () {
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
        var querystring = buildQueryString(data);

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

export function request(xhrOptions) {
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
