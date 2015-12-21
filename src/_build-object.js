import {noop} from "./_util.js";
import {forEach} from "./_iterate.js";
import {isFunction, isString, isObject} from "./_types.js";
import {$document} from "./_env.js";
import {redraw, forcing} from "./redraw.js";
import {pendingRequests} from "./computation.js";
import {clear, unloaders, insertNode, autoredraw} from "./_dom.js";
import {build} from "./_build.js";

function getController(views, view, cachedControllers, controller) {
    var controllerIndex = redraw.strategy() === "diff" && views ? views.indexOf(view) : -1;

    if (controllerIndex > -1) {
        return cachedControllers[controllerIndex];
    }

    return typeof controller === "function" ? new controller() : {};
}

function updateLists(views, controllers, view, controller) {
    if (controller.onunload != null) unloaders.push({controller: controller, handler: controller.onunload});
    views.push(view);
    controllers.push(controller);
}

function checkView(data, view, cached, cachedControllers, controllers, views) {
    var controller = getController(cached.views, view, cachedControllers, data.controller);
    //Faster to coerce to number and check for NaN
    var key = +(data && data.attrs && data.attrs.key);

    if (pendingRequests === 0 || forcing || cachedControllers && cachedControllers.indexOf(controller) > -1) {
        data = data.view(controller);
    }
    else data = {tag: "placeholder"};

    if (data.subtree === "retain") return data;
    if (key === key) (data.attrs = data.attrs || {}).key = key;
    updateLists(views, controllers, view, controller);
    return data;
}

function markViews(data, cached, views, controllers) {
    var cachedControllers = cached && cached.controllers;
    while (data.view != null) {
        data = checkView(data, data.view.$original || data.view, cached, cachedControllers, controllers, views);
    }
    return data;
}

function maybeRecreateObject(data, cached, dataAttrKeys) {
    //if an element is different enough from the one in cache, recreate it
    if (data.tag !== cached.tag ||
            dataAttrKeys.sort().join() !== Object.keys(cached.attrs).sort().join() ||
            data.attrs.id !== cached.attrs.id ||
            data.attrs.key !== cached.attrs.key ||
            (redraw.strategy() === "all" && (!cached.configContext || cached.configContext.retain !== true)) ||
            (redraw.strategy() === "diff" && cached.configContext && cached.configContext.retain === false)) {
        if (cached.nodes.length) clear(cached.nodes);
        if (cached.configContext && isFunction(cached.configContext.onunload)) cached.configContext.onunload();
        if (cached.controllers) {
            forEach(cached.controllers, function(controller) {
                if (controller.unload) controller.onunload({preventDefault: noop});
            });
        }
    }
}

function getObjectNamespace(data, namespace) {
    return data.attrs.xmlns ? data.attrs.xmlns :
        data.tag === "svg" ? "http://www.w3.org/2000/svg" :
        data.tag === "math" ? "http://www.w3.org/1998/Math/MathML" :
        namespace;
}

function constructNode(data, namespace) {
    if (namespace === undefined) {
        return data.attrs.is ?
            $document.createElement(data.tag, data.attrs.is) :
            $document.createElement(data.tag);
    }

    return data.attrs.is ?
        $document.createElementNS(namespace, data.tag, data.attrs.is) :
        $document.createElementNS(namespace, data.tag);
}

function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
    /*eslint max-depth:0 */
    var rule;

    for (var attrName in dataAttrs) {
        var dataAttr = dataAttrs[attrName];
        var cachedAttr = cachedAttrs[attrName];
        if (!(attrName in cachedAttrs) || (cachedAttr !== dataAttr)) {
            cachedAttrs[attrName] = dataAttr;
            try {
                //`config` isn't a real attributes, so ignore it
                if (attrName === "config" || attrName === "key") continue;
                //hook event handlers to the auto-redrawing system
                else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
                    node[attrName] = autoredraw(dataAttr, node);
                }
                //handle `style: {...}`
                else if (attrName === "style" && dataAttr != null && isObject(dataAttr)) {
                    for (rule in dataAttr) {
                        if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
                            node.style[rule] = dataAttr[rule];
                        }
                    }
                    for (rule in cachedAttr) {
                        if (!(rule in dataAttr)) {
                            node.style[rule] = "";
                        }
                    }
                }
                //handle SVG
                else if (namespace != null) {
                    if (attrName === "href") node.setAttributeNS("http://www.w3.org/1999/xlink", "href", dataAttr);
                    else node.setAttribute(attrName === "className" ? "class" : attrName, dataAttr);
                }
                //handle cases that are properties (but ignore cases where we should use setAttribute instead)
                //- list and form are typically used as strings, but are DOM element references in js
                //- when using CSS selectors (e.g. `m("[style='']")`), style is used as a string, but it's an object in js
                else if (attrName in node &&
                         attrName !== "list" &&
                         attrName !== "style" &&
                         attrName !== "form" &&
                         attrName !== "type" &&
                         attrName !== "width" &&
                         attrName !== "height") {
                    //#348 don't set the value if not needed otherwise cursor placement breaks in Chrome
                    if (tag !== "input" || node[attrName] !== dataAttr) node[attrName] = dataAttr;
                }
                else node.setAttribute(attrName, dataAttr);
            }
            catch (e) {
                //swallow IE's invalid argument errors to mimic HTML's
                //fallback-to-doing-nothing-on-invalid-attributes behavior
                if (e.message.indexOf("Invalid argument") < 0) throw e;
            }
        }
        //#348 dataAttr may not be a string, so use loose comparison (double equal) instead of strict (triple equal)
        else if (attrName === "value" && tag === "input" && node.value != dataAttr) { //eslint-disable-line eqeqeq
            node.value = dataAttr;
        }
    }
    return cachedAttrs;
}

function constructAttrs(data, node, namespace, hasKeys) {
    return hasKeys ? setAttributes(node, data.tag, data.attrs, {}, namespace) : data.attrs;
}

function constructChildren(data, node, cached, editable, namespace, configs) {
    return data.children != null && data.children.length > 0 ?
        build(
            node,
            data.tag,
            undefined,
            undefined,
            data.children,
            cached.children,
            true,
            0,
            data.attrs.contenteditable ? node : editable,
            namespace,
            configs
        ) :
        data.children;
}

function unloadCachedControllers(cached, views, controllers) {
    if (controllers.length) {
        cached.views = views;
        cached.controllers = controllers;
        forEach(controllers, function(controller) {
            if (controller.onunload && controller.onunload.$old) controller.onunload = controller.onunload.$old;
            if (pendingRequests && controller.onunload) {
                var onunload = controller.onunload;
                controller.onunload = noop;
                controller.onunload.$old = onunload;
            }
        });
    }
}

function reconstructCached(data, attrs, children, node, namespace, views, controllers) {
    var cached = {tag: data.tag, attrs: attrs, children: children, nodes: [node]};
    unloadCachedControllers(cached, views, controllers);
    if (cached.children && !cached.children.nodes) cached.children.nodes = [];
    //edge case: setting value on <select> doesn't work before children exist,
    //so set it again after children have been created
    if (data.tag === "select" && "value" in data.attrs) {
        setAttributes(node, data.tag, {value: data.attrs.value}, {}, namespace);
    }
    return cached
}

function buildUpdatedNode(cached, data, editable, hasKeys, namespace, views, configs, controllers) {
    var node = cached.nodes[0];
    if (hasKeys) setAttributes(node, data.tag, data.attrs, cached.attrs, namespace);
    cached.children = build(
        node,
        data.tag,
        undefined,
        undefined,
        data.children,
        cached.children,
        false,
        0,
        data.attrs.contenteditable ? node : editable,
        namespace,
        configs
    );
    cached.nodes.intact = true;

    if (controllers.length) {
        cached.views = views;
        cached.controllers = controllers;
    }

    return node;
}

function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
    //schedule configs to be called. They are called after `build`
    //finishes running
    if (isFunction(data.attrs.config)) {
        var context = cached.configContext = cached.configContext || {};

        //bind
        configs.push(function() {
            return data.attrs.config.call(data, node, !isNew, context, cached);
        });
    }
}

function buildObject(data, cached, editable, parentElement, index, shouldReattach, namespace, configs) {
    /*eslint max-statements:[2, 23] */
    var views = [], controllers = [];
    data = markViews(data, cached, views, controllers);
    if (data.subtree === "retain") return cached;
    if (!data.tag && controllers.length) {
        throw new Error("Component template must return a virtual element, not an array, string, etc.");
    }
    data.attrs = data.attrs || {};
    cached.attrs = cached.attrs || {};
    var dataAttrKeys = Object.keys(data.attrs);
    var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0);
    maybeRecreateObject(data, cached, dataAttrKeys);
    if (!isString(data.tag)) return;
    var isNew = cached.nodes.length === 0;
    namespace = getObjectNamespace(data, namespace);
    var node;
    if (isNew) {
        node = constructNode(data, namespace);
        //set attributes first, then create children
        var attrs = constructAttrs(data, node, namespace, hasKeys)
        var children = constructChildren(data, node, cached, editable, namespace, configs);
        cached = reconstructCached(data, attrs, children, node, namespace, views, controllers);
    }
    else {
        node = buildUpdatedNode(cached, data, editable, hasKeys, namespace, views, configs, controllers);
    }
    if (isNew || shouldReattach === true && node != null) insertNode(parentElement, node, index);
    //schedule configs to be called. They are called after `build`
    //finishes running
    scheduleConfigsToBeCalled(configs, data, node, isNew, cached);
    return cached
}

export {buildObject};
