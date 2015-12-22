import {parameterize} from "./parse.js";

function component(component) {
    for (var args = [], i = 1; i < arguments.length; i++) args.push(arguments[i]);
    return parameterize(component, args);
}

export {component};
