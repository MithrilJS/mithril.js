import {isArray} from "./types.js";

function forEach(list, f) {
    /*eslint no-empty:0 */
    for (var i = 0; i < list.length && !f(list[i], i++);) {}
}

function forKeys(list, f) {
    forEach(list, function(attrs, i) {
        return (attrs = attrs && attrs.attrs) && attrs.key != null && f(attrs, i);
    });
}

function flatten(list) {
    //recursively flatten array
    for (var i = 0; i < list.length; i++) {
        if (isArray(list[i])) {
            list = list.concat.apply([], list);
            //check current index again and flatten until there are no more nested arrays at that index
            i--;
        }
    }
    return list;
}

export {forEach, forKeys, flaten};
