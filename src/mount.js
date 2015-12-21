import {noop} from "./util.js";
import {isFunction} from "./types.js";
import {forEach} from "./iterate.js";
import {redraw} from "./redraw.js";
import {start as startComputation, endFirst as endFirstComputation} from "./computation.js";
import {preredraw, postredraw} from "./redraw.js";
import {roots, unloaders, controllers, components, removeRootElement, clearUnloaders} from "./dom.js";

var topComponent;

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
    else clearUnloaders();

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
