import {type, isObject, isFunction} from "./types.js";
import {propify} from "./prop.js";

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
}

function deferred() {
    var local = new Deferred();
    local.promise = propify(local.promise);
    
    return local;
}

deferred.onerror = function (e) {
    if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) {
        // TODO: expose from... somewhere
        pendingRequests = 0;
        
        throw e;
    }
};

export {deferred, Deferred };
