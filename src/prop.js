import { isObject, isFunction } from "./types.js";

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

export { prop, propify }
