import { isObject, isFunction } from "./types.js";
import { propify } from "./prop.js";

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

function deferred () {
    var deferred = new Deferred();
    deferred.promise = propify(deferred.promise);
    return deferred;
};

deferred.onerror = function(e) {
    if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) {
        pendingRequests = 0;
        throw e;
    }
};

export { deferred, Deferred };
