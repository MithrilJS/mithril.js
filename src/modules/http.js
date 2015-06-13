var mDOM = require('./DOM');

var m = {};

var types = require('../core/types'),
	type = types.type,
	FUNCTION = types.FUNCTION,
	ARRAY = types.ARRAY,
	STRING = types.STRING,
	OBJECT = types.OBJECT;

var fns = require('../core/fns'),
	buildQueryString = fns.buildQueryString,
	propify = fns.propify;

var $ = require('../core/init');

m.deferred = function () {
	var deferred = new Deferred();
	deferred.promise = propify(deferred.promise);
	return deferred
};

//Promiz.mithril.js | Zolmeister | MIT
//a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
//1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
//2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
function Deferred(successCallback, failureCallback) {
	var RESOLVING = 1, REJECTING = 2, RESOLVED = 3, REJECTED = 4;
	var self = this, state = 0, promiseValue = 0, next = [];

	self["promise"] = {};

	self["resolve"] = function(value) {
		if (!state) {
			promiseValue = value;
			state = RESOLVING;

			fire()
		}
		return this
	};

	self["reject"] = function(value) {
		if (!state) {
			promiseValue = value;
			state = REJECTING;

			fire()
		}
		return this
	};

	self.promise["then"] = function(successCallback, failureCallback) {
		var deferred = new Deferred(successCallback, failureCallback);
		if (state === RESOLVED) {
			deferred.resolve(promiseValue)
		}
		else if (state === REJECTED) {
			deferred.reject(promiseValue)
		}
		else {
			next.push(deferred)
		}
		return deferred.promise
	};

	function finish(type) {
		state = type || REJECTED;
		next.map(function(deferred) {
			state === RESOLVED && deferred.resolve(promiseValue) || deferred.reject(promiseValue)
		})
	}

	function thennable(then, successCallback, failureCallback, notThennableCallback) {
		if (((promiseValue != null && type.call(promiseValue) === OBJECT) || typeof promiseValue === FUNCTION) && typeof then === FUNCTION) {
			try {
				// count protects against abuse calls from spec checker
				var count = 0;
				then.call(promiseValue, function(value) {
					if (count++) return;
					promiseValue = value;
					successCallback()
				}, function (value) {
					if (count++) return;
					promiseValue = value;
					failureCallback()
				})
			}
			catch (e) {
				m.deferred.onerror(e);
				promiseValue = e;
				failureCallback()
			}
		} else {
			notThennableCallback()
		}
	}

	function fire() {
		// check if it's a thenable
		var then;
		try {
			then = promiseValue && promiseValue.then
		}
		catch (e) {
			m.deferred.onerror(e);
			promiseValue = e;
			state = REJECTING;
			return fire()
		}
		thennable(then, function() {
			state = RESOLVING;
			fire()
		}, function() {
			state = REJECTING;
			fire()
		}, function() {
			try {
				if (state === RESOLVING && typeof successCallback === FUNCTION) {
					promiseValue = successCallback(promiseValue)
				}
				else if (state === REJECTING && typeof failureCallback === "function") {
					promiseValue = failureCallback(promiseValue);
					state = RESOLVING
				}
			}
			catch (e) {
				m.deferred.onerror(e);
				promiseValue = e;
				return finish()
			}

			if (promiseValue === self) {
				promiseValue = TypeError();
				finish()
			}
			else {
				thennable(then, function () {
					finish(RESOLVED)
				}, finish, function () {
					finish(state === RESOLVING && RESOLVED)
				})
			}
		})
	}
}
m.deferred.onerror = function(e) {
	if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) throw e
};

m.sync = function(args) {
	var method = "resolve";
	function synchronizer(pos, resolved) {
		return function(value) {
			results[pos] = value;
			if (!resolved) method = "reject";
			if (--outstanding === 0) {
				deferred.promise(results);
				deferred[method](results)
			}
			return value
		}
	}

	var deferred = m.deferred();
	var outstanding = args.length;
	var results = new Array(outstanding);
	if (args.length > 0) {
		for (var i = 0; i < args.length; i++) {
			args[i].then(synchronizer(i, true), synchronizer(i, false))
		}
	}
	else deferred.resolve([]);

	return deferred.promise
};
function identity(value) {return value}

function ajax(options) {
	if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
		var callbackKey = "mithril_callback_" + new Date().getTime() + "_" + (Math.round(Math.random() * 1e16)).toString(36);
		var script = $.document.createElement("script");

		window[callbackKey] = function(resp) {
			script.parentNode.removeChild(script);
			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			});
			window[callbackKey] = undefined
		};

		script.onerror = function(e) {
			script.parentNode.removeChild(script);

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: JSON.stringify({error: "Error making jsonp request"})
				}
			});
			window[callbackKey] = undefined;

			return false
		};

		script.onload = function(e) {
			return false
		};

		script.src = options.url
			+ (options.url.indexOf("?") > 0 ? "&" : "?")
			+ (options.callbackKey ? options.callbackKey : "callback")
			+ "=" + callbackKey
			+ "&" + buildQueryString(options.data || {});
		$.document.body.appendChild(script)
	}
	else {
		var xhr = new window.XMLHttpRequest;
		xhr.open(options.method, options.url, true, options.user, options.password);
		xhr.onreadystatechange = function() {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
				else options.onerror({type: "error", target: xhr})
			}
		};
		if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
			xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
		}
		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*");
		}
		if (typeof options.config === FUNCTION) {
			var maybeXhr = options.config(xhr, options);
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data = options.method === "GET" || !options.data ? "" : options.data
		if (data && (type.call(data) != STRING && data.constructor != window.FormData)) {
			throw "Request data should be either be a string or FormData. Check the `serialize` option in `m.request`";
		}
		xhr.send(data);
		return xhr
	}
}
function bindData(xhrOptions, data, serialize) {
	if (xhrOptions.method === "GET" && xhrOptions.dataType != "jsonp") {
		var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
		var querystring = buildQueryString(data);
		xhrOptions.url = xhrOptions.url + (querystring ? prefix + querystring : "")
	}
	else xhrOptions.data = serialize(data);
	return xhrOptions
}
function parameterizeUrl(url, data) {
	var tokens = url.match(/:[a-z]\w+/gi);
	if (tokens && data) {
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1);
			url = url.replace(tokens[i], data[key]);
			delete data[key]
		}
	}
	return url
}

m.request = function(xhrOptions) {
	if (xhrOptions.background !== true) mDOM.startComputation();
	var deferred = new Deferred();
	var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp";
	var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
	var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
	var extract = isJSONP ? function(jsonp) {return jsonp.responseText} : xhrOptions.extract || function(xhr) {
		return xhr.responseText.length === 0 && deserialize === JSON.parse ? null : xhr.responseText
	};
	xhrOptions.method = (xhrOptions.method || 'GET').toUpperCase();
	xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
	xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
	xhrOptions.onload = xhrOptions.onerror = function(e) {
		try {
			e = e || event;
			var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
			var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
			if (e.type === "load") {
				if (type.call(response) === ARRAY && xhrOptions.type) {
					for (var i = 0; i < response.length; i++) response[i] = new xhrOptions.type(response[i])
				}
				else if (xhrOptions.type) response = new xhrOptions.type(response)
			}
			deferred[e.type === "load" ? "resolve" : "reject"](response)
		}
		catch (e) {
			m.deferred.onerror(e);
			deferred.reject(e)
		}
		if (xhrOptions.background !== true) mDOM.endComputation()
	};
	ajax(xhrOptions);
	deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
	return deferred.promise
};

module.exports = m;
