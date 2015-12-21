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

var isArray = Array.isArray || function (object) {
    return type.call(object) === "[object Array]";
}

export {type, isFunction, isObject, isString, isArray};
