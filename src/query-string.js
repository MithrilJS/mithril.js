import {forEach} from "./iterate.js";
import {isObject, isArray} from "./types.js";
import {encode, decode} from "./util.js";

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
            forEach(value, function (item) {
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

function parse(str) {
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

export {build, parse};
