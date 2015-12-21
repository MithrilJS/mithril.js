import {noop} from "./util.js";
import {isFunction, isArray} from "./types.js";
import {forEach} from "./iterate.js";
import {redraw} from "./redraw.js";
import {start as startComputation, endFirst as endFirstComputation} from "./computation.js";
import {preredraw, postredraw} from "./redraw.js";

var roots = [],
    components = [],
    controllers = [],
    unloaders = [],
    topComponent;

//TODO: probably belongs in ./render.js
var nodeCache = [], cellCache = {};

function unload(cached) {
    if (cached.configContext && isFunction(cached.configContext.onunload)) {
        cached.configContext.onunload();
        cached.configContext.onunload = null;
    }
    if (cached.controllers) {
        forEach(cached.controllers, function(controller) {
            if (isFunction(controller.onunload)) controller.onunload({preventDefault: noop});
        });
    }
    if (cached.children) {
        if (isArray(cached.children)) forEach(cached.children, unload);
        else if (cached.children.tag) unload(cached.children);
    }
}

function clear(nodes, cached) {
    for (var i = nodes.length - 1; i > -1; i--) {
        if (nodes[i] && nodes[i].parentNode) {
            try { nodes[i].parentNode.removeChild(nodes[i]); }
            catch (e) {
                //ignore if this fails due to order of events
                //(see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
            }
            cached = [].concat(cached);
            if (cached[i]) unload(cached[i]);
        }
    }
    //release memory if nodes is an array. This check should fail if nodes is a NodeList (see loop above)
    if (nodes.length) nodes.length = 0;
}

function getCellCacheKey(element) {
    var index = nodeCache.indexOf(element);
    return index < 0 ? nodeCache.push(element) - 1 : index;
}

function reset(root) {
    var cacheKey = getCellCacheKey(root);
    clear(root.childNodes, cellCache[cacheKey]);
    cellCache[cacheKey] = undefined;
}

function removeRootElement(root, index) {
    roots.splice(index, 1);
    controllers.splice(index, 1);
    components.splice(index, 1);
    reset(root);
    nodeCache.splice(getCellCacheKey(root), 1);
}

function mount(root, component) {
    /*eslint max-statements:[2, 26] */
    if (!root) throw new Error("Please ensure the DOM element exists before rendering a template into it.");
    var index = roots.indexOf(root);
    if (index < 0) index = roots.length;

    var isPrevented = false;
    var event = {
        preventDefault: function() {
            isPrevented = true;
            preredraw(null);
            postredraw(null);
        }
    };

    forEach(unloaders, function(unloader) {
        unloader.handler.call(unloader.controller, event);
        unloader.controller.onunload = null;
    });

    if (isPrevented) {
        forEach(unloaders, function(unloader) {
            unloader.controller.onunload = unloader.handler;
        });
    }
    else unloaders = [];

    if (controllers[index] && isFunction(controllers[index].onunload)) {
        controllers[index].onunload(event);
    }

    var isNullComponent = component === null;

    if (!isPrevented) {
        redraw.strategy("all");
        startComputation();
        roots[index] = root;
        var currentComponent = component ? (topComponent = component) : (topComponent = component = {controller: noop});
        var controller = new (component.controller || noop)();
        //controllers may call m.mount recursively (via m.route redirects, for example)
        //this conditional ensures only the last recursive m.mount call is applied
        if (currentComponent === topComponent) {
            controllers[index] = controller;
            components[index] = component;
        }
        endFirstComputation();
        if (isNullComponent) {
            removeRootElement(root, index);
        }
        return controllers[index];
    }
    if (isNullComponent) {
        removeRootElement(root, index);
    }
}

export {
    mount
};
