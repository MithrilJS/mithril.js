import {noop} from "./_util.js";
import {isObject, isString, isArray} from "./_types.js";

var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g,
    attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;

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

export {parse, parameterize};
