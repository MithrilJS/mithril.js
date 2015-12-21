(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.mithril = factory();
}(this, function () { 'use strict';

    var $document;
    var $location;
    var $cancelAnimationFrame;
    var $requestAnimationFrame;

    var encode = encodeURIComponent;
    var decode = decodeURIComponent;
    function noop() {}

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

    var isArray = Array.isArray || function(object) {
        return type.call(object) === "[object Array]";
    }

    var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g;
    var attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/;
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

    function component(component) {
        for (var args = [], i = 1; i < arguments.length; i++) args.push(arguments[i]);
        return parameterize(component, args);
    }

    function forEach(list, f) {
        /*eslint no-empty:0 */
        for (var i = 0; i < list.length && !f(list[i], i++);) {}
    }

    function forKeys(list, f) {
        forEach(list, function(attrs, i) {
            return (attrs = attrs && attrs.attrs) && attrs.key != null && f(attrs, i);
        });
    }

    function gettersetter(store) {
        var val = function() {
            if (arguments.length) store = arguments[0];
            return store;
        };

        val.toJSON = function() {
            return store;
        };

        return val;
    }

    function prop(store) {
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

    var redrawing = false;
    var forcing = false;
    var lastRedrawId = null;
    var lastRedrawCallTime = 0;
    var FRAME_BUDGET = 16;
    var computePreRedrawHook = null;
    var computePostRedrawHook = null;
    function preredraw(value) {
        computePreRedrawHook = value;
    }

    function postredraw(value) {
        computePostRedrawHook = value;
    }

    function redraw(force) {
        if (redrawing) return;
        redrawing = true;
        if (force) forcing = true;
        try {
            //lastRedrawId is a positive number if a second redraw is requested before the next animation frame
            //lastRedrawID is null if it's the first redraw and not an event handler
            if (lastRedrawId && !force) {
                //when rAF: always reschedule redraw
                //when setTimeout: only reschedule redraw if time between now and previous redraw is bigger than a frame,
                //otherwise keep currently scheduled timeout
                if ($requestAnimationFrame === window.requestAnimationFrame
                    || Date.now() - lastRedrawCallTime > FRAME_BUDGET) {
                    if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId);
                    lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET);
                }
            }
            else {
                redraw();
                lastRedrawId = $requestAnimationFrame(function() { lastRedrawId = null; }, FRAME_BUDGET);
            }
        }
        finally {
            redrawing = forcing = false;
        }
    }

    redraw.strategy = prop();

    var pendingRequests = 0;

    function start() {
        pendingRequests++;
    }

    function end() {
        if (pendingRequests > 1) {
            pendingRequests--;
        }
        else {
            pendingRequests = 0;
            redraw();
        }
    }

    function endFirst() {
        if (redraw.strategy() === "none") {
            pendingRequests--;
            redraw.strategy("diff");
        }
        else {
            end();
        }
    }

    function clear() {
        pendingRequests = 0;
    }

    var roots = [];
    var components = [];
    var controllers = [];
    var unloaders = [];
    var nodeCache = [];
    var cellCache = {};
    var html;
    var documentNode;
    documentNode = {
        appendChild: function(node) {
            if (html === undefined) html = $document.createElement("html");
            if ($document.documentElement && $document.documentElement !== node) {
                $document.replaceChild(node, $document.documentElement);
            }
            else $document.appendChild(node);
            this.childNodes = $document.childNodes;
        },
        insertBefore: function(node) {
            this.appendChild(node);
        },
        childNodes: []
    };

    function insertNode(parentElement, node, index) {
        parentElement.insertBefore(node, parentElement.childNodes[index] || null);
    }

    function injectHTML(parentElement, index, data) {
        var nextSibling = parentElement.childNodes[index];
        if (nextSibling) {
            var isElement = nextSibling.nodeType !== 1;
            var placeholder = $document.createElement("span");
            if (isElement) {
                parentElement.insertBefore(placeholder, nextSibling || null);
                placeholder.insertAdjacentHTML("beforebegin", data);
                parentElement.removeChild(placeholder);
            }
            else nextSibling.insertAdjacentHTML("beforebegin", data);
        }
        else {
            if (window.Range && window.Range.prototype.createContextualFragment) {
                parentElement.appendChild($document.createRange().createContextualFragment(data));
            }
            else {
                parentElement.insertAdjacentHTML("beforeend", data);
            }
        }
        var nodes = [];
        while (parentElement.childNodes[index] !== nextSibling) {
            nodes.push(parentElement.childNodes[index]);
            index++;
        }
        return nodes;
    }

    function injectTextNode(parentElement, first, index, data) {
        try {
            insertNode(parentElement, first, index);
            first.nodeValue = data;
        }
        catch (e) {
            //IE erroneously throws error when appending an empty text node after a null
            //eslint-disable-line
        }
    }

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

    function clear$1(nodes, cached) {
        for (var i = nodes.length - 1; i > -1; i--) {
            if (nodes[i] && nodes[i].parentNode) {
                try { nodes[i].parentNode.removeChild(nodes[i]); }
                catch (e) {
                    //ignore if this fails due to order of events
                    //(see http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
                    //eslint-disable-line
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
        clear$1(root.childNodes, cellCache[cacheKey]);
        cellCache[cacheKey] = undefined;
    }

    function removeRootElement(root, index) {
        roots.splice(index, 1);
        controllers.splice(index, 1);
        components.splice(index, 1);
        reset(root);
        nodeCache.splice(getCellCacheKey(root), 1);
    }

    function clearUnloaders() {
        unloaders = [];
    }

    function autoredraw(callback, object) {
        return function(e) {
            e = e || event;
            redraw.strategy("diff");
            start();
            try { return callback.call(object, e); }
            finally {
                end();
            }
        };
    }

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
            start();
            roots[index] = root;
            var currentComponent = component ? (topComponent = component) : (topComponent = component = {controller: noop});
            var controller = new (component.controller || noop)();
            //controllers may call m.mount recursively (via m.route redirects, for example)
            //this conditional ensures only the last recursive m.mount call is applied
            if (currentComponent === topComponent) {
                controllers[index] = controller;
                components[index] = component;
            }
            endFirst();
            if (isNullComponent) {
                removeRootElement(root, index);
            }
            return controllers[index];
        }
        if (isNullComponent) {
            removeRootElement(root, index);
        }
    }

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
            if (cached.nodes.length) clear$1(cached.nodes);
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

    var DELETION = 1;
    var INSERTION = 2;
    var MOVE = 3;
    var voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;
    function sortChanges(a, b) { return a.action - b.action || a.index - b.index; }

    function handleKeysDiffer(data, existing, cached, parentElement) {
        forKeys(data, function(key, i) {
            existing[key = key.key] = existing[key] ? {
                action: MOVE,
                index: i,
                from: existing[key].index,
                element: cached.nodes[existing[key].index] || $document.createElement("div")
            } : {action: INSERTION, index: i};
        });
        var actions = [];
        for (var prop in existing) actions.push(existing[prop]);
        var changes = actions.sort(sortChanges), newCached = new Array(cached.length);
        newCached.nodes = cached.nodes.slice();

        forEach(changes, function(change) {
            var index = change.index;
            if (change.action === DELETION) {
                clear$1(cached[index].nodes, cached[index]);
                newCached.splice(index, 1);
            }
            if (change.action === INSERTION) {
                var dummy = $document.createElement("div");
                dummy.key = data[index].attrs.key;
                insertNode(parentElement, dummy, index);
                newCached.splice(index, 0, {
                    attrs: {key: data[index].attrs.key},
                    nodes: [dummy]
                });
                newCached.nodes[index] = dummy;
            }

            if (change.action === MOVE) {
                var changeElement = change.element;
                var maybeChanged = parentElement.childNodes[index];
                if (maybeChanged !== changeElement && changeElement !== null) {
                    parentElement.insertBefore(changeElement, maybeChanged || null);
                }
                newCached[index] = cached[change.from];
                newCached.nodes[index] = changeElement;
            }
        });

        return newCached;
    }

    //diff the array itself
    function diffArray(data, cached, nodes) {
        //update the list of DOM nodes by collecting the nodes from each item
        forEach(data, function(_, i) {
            if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes);
        })
        //remove items from the end of the array if the new array is shorter than the old one.
        //if errors ever happen here, the issue is most likely
        //a bug in the construction of the `cached` data structure somewhere earlier in the program
        forEach(cached.nodes, function(node, i) {
            if (node.parentNode != null && nodes.indexOf(node) < 0) clear$1([node], [cached[i]]);
        })
        if (data.length < cached.length) cached.length = data.length;
        cached.nodes = nodes;
    }

    function diffKeys(data, cached, existing, parentElement) {
        var keysDiffer = data.length !== cached.length;
        if (!keysDiffer) {
            forKeys(data, function(attrs, i) {
                var cachedCell = cached[i];
                return keysDiffer = cachedCell && cachedCell.attrs && cachedCell.attrs.key !== attrs.key;
            });
        }

        return keysDiffer ? handleKeysDiffer(data, existing, cached, parentElement) : cached;
    }

    function flatten$1(list) {
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

    function buildArrayKeys(data) {
        var guid = 0;
        forKeys(data, function() {
            forEach(data, function(attrs) {
                if ((attrs = attrs && attrs.attrs) && attrs.key == null) attrs.key = "__mithril__" + guid++;
            })
            return 1;
        });
    }

    function getSubArrayCount(item) {
        if (item.$trusted) {
            //fix offset of next element if item was a trusted string w/ more than one html element
            //the first clause in the regexp matches elements
            //the second clause (after the pipe) matches text nodes
            var match = item.match(/<[^\/]|\>\s*[^<]/g);
            if (match != null) return match.length;
        }
        else if (isArray(item)) {
            return item.length;
        }
        return 1;
    }

    function buildArray(data, cached, parentElement, index, parentTag, shouldReattach, editable, namespace, configs) {
        data = flatten$1(data);
        var nodes = [], intact = cached.length === data.length, subArrayCount = 0;

        //keys algorithm: sort elements without recreating them if keys are present
        //1) create a map of all existing keys, and mark all for deletion
        //2) add new keys to map and mark them for addition
        //3) if key exists in new list, change action from deletion to a move
        //4) for each key, handle its corresponding action as marked in previous steps
        var existing = {}, shouldMaintainIdentities = false;
        forKeys(cached, function(attrs, i) {
            shouldMaintainIdentities = true;
            existing[cached[i].attrs.key] = {action: DELETION, index: i};
        });

        buildArrayKeys(data);
        if (shouldMaintainIdentities) cached = diffKeys(data, cached, existing, parentElement);
        //end key algorithm

        var cacheCount = 0;
        //faster explicitly written
        for (var i = 0, len = data.length; i < len; i++) {
            //diff each item in the array
            var item = build(
                parentElement,
                parentTag,
                cached,
                index,
                data[i],
                cached[cacheCount],
                shouldReattach,
                index + subArrayCount || subArrayCount,
                editable,
                namespace,
                configs
            );

            if (item !== undefined) {
                intact = intact && item.nodes.intact;
                subArrayCount += getSubArrayCount(item);
                cached[cacheCount++] = item;
            }
        }

        if (!intact) diffArray(data, cached, nodes);
        return cached
    }

    // Broken out because it was causing deopts in v8.
    function dataToString(data) {
        //data.toString() might throw or return null if data is
        //the return value of Console.log in Firefox (behavior depends on version)
        try {
            if (data == null || data.toString() == null) return "";
        }
        catch (e) {
            return "";
        }
        return data;
    }

    function makeCache(data, cached, index, parentIndex, parentCache) {
        if (cached != null) {
            if (type.call(cached) === type.call(data)) return cached;

            if (parentCache && parentCache.nodes) {
                var offset = index - parentIndex, end = offset + (isArray(data) ? data : cached.nodes).length;
                clear$1(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end));
            }
            else if (cached.nodes) {
                clear$1(cached.nodes, cached);
            }
        }

        cached = new data.constructor();
        //if constructor creates a virtual dom element, use a blank object
        //as the base cached node instead of copying the virtual el (#277)
        if (cached.tag) cached = {};
        cached.nodes = [];
        return cached;
    }

    function handleNonexistentNodes(data, parentElement, index) {
        var nodes, cached;
        if (data.$trusted) {
            nodes = injectHTML(parentElement, index, data);
        }
        else {
            nodes = [$document.createTextNode(data)];
            if (!parentElement.nodeName.match(voidElements)) insertNode(parentElement, nodes[0], index);
        }

        if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
            cached = new data.constructor(data);
        }
        else {
            cached = data;
        }
        cached.nodes = nodes;
        return cached;
    }

    function reattachNodes(data, cached, parentElement, editable, index, parentTag) {
        var nodes = cached.nodes;
        if (!editable || editable !== $document.activeElement) {
            if (data.$trusted) {
                clear$1(nodes, cached)
                nodes = injectHTML(parentElement, index, data)
            }
            else if (parentTag === "textarea") {
                // <textarea> uses `value` instead of `nodeValue`.
                parentElement.value = data
            }
            else if (editable) {
                // contenteditable nodes use `innerHTML` instead of `nodeValue`.
                editable.innerHTML = data
            }
            else {
                // was a trusted string
                if (nodes[0].nodeType === 1 ||
                    nodes.length > 1 ||
                    (nodes[0].nodeValue.trim && !nodes[0].nodeValue.trim())) {
                    clear$1(cached.nodes, cached)
                    nodes = [$document.createTextNode(data)]
                }
                injectTextNode(parentElement, nodes[0], index, data);
            }
        }
        cached = new data.constructor(data);
        cached.nodes = nodes;
        return cached;
    }

    function handleText(cached, data, index, parentElement, shouldReattach, editable, parentTag) {
        //handle text nodes
        return cached.nodes.length === 0 ? handleNonexistentNodes(data, parentElement, index) :
            cached.valueOf() !== data.valueOf() || shouldReattach === true ?
                reattachNodes(data, cached, parentElement, editable, index, parentTag) :
            (cached.nodes.intact = true, cached);
    }

    function build(
        parentElement,
        parentTag,
        parentCache,
        parentIndex,
        data,
        cached,
        shouldReattach,
        index,
        editable,
        namespace,
        configs
    ) {
        /*eslint spaced-comment:0 */
        //`build` is a recursive function that manages creation/diffing/removal
        //of DOM elements based on comparison between `data` and `cached`
        //the diff algorithm can be summarized as this:
        //1 - compare `data` and `cached`
        //2 - if they are different, copy `data` to `cached` and update the DOM
        //    based on what the difference is
        //3 - recursively apply this algorithm for every array and for the
        //    children of every virtual element

        //the `cached` data structure is essentially the same as the previous
        //redraw's `data` data structure, with a few additions:
        //- `cached` always has a property called `nodes`, which is a list of
        //   DOM elements that correspond to the data represented by the
        //   respective virtual element
        //- in order to support attaching `nodes` as a property of `cached`,
        //   `cached` is *always* a non-primitive object, i.e. if the data was
        //   a string, then cached is a String instance. If data was `null` or
        //   `undefined`, cached is `new String("")`
        //- `cached also has a `configContext` property, which is the state
        //   storage object exposed by config(element, isInitialized, context)
        //- when `cached` is an Object, it represents a virtual element; when
        //   it's an Array, it represents a list of elements; when it's a
        //   String, Number or Boolean, it represents a text node

        //`parentElement` is a DOM element used for W3C DOM API calls
        //`parentTag` is only used for handling a corner case for textarea
        //values
        //`parentCache` is used to remove nodes in some multi-node cases
        //`parentIndex` and `index` are used to figure out the offset of nodes.
        //They're artifacts from before arrays started being flattened and are
        //likely refactorable
        //`data` and `cached` are, respectively, the new and old nodes being
        //diffed
        //`shouldReattach` is a flag indicating whether a parent node was
        //recreated (if so, and if this node is reused, then this node must
        //reattach itself to the new parent)
        //`editable` is a flag that indicates whether an ancestor is
        //contenteditable
        //`namespace` indicates the closest HTML namespace as it cascades down
        //from an ancestor
        //`configs` is a list of config functions to run after the topmost
        //`build` call finishes running

        //there's logic that relies on the assumption that null and undefined
        //data are equivalent to empty strings
        //- this prevents lifecycle surprises from procedural helpers that mix
        //  implicit and explicit return statements (e.g.
        //  function foo() {if (cond) return m("div")}
        //- it simplifies diffing code
        data = dataToString(data);
        if (data.subtree === "retain") return cached;
        cached = makeCache(data, cached, index, parentIndex, parentCache);

        if (isArray(data)) {
            return buildArray(data, cached, parentElement, index, parentTag, shouldReattach, editable, namespace, configs);
        }

        if (data != null && isObject(data)) {
            return buildObject(data, cached, editable, parentElement, index, shouldReattach, namespace, configs);
        }

        if (!isFunction(data)) {
            return handleText(cached, data, index, parentElement, shouldReattach, editable, parentTag);
        }

        return cached;
    }

    function render(root, cell, forceRecreation) {
        var configs = [];
        if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
        var id = getCellCacheKey(root);
        var isDocumentRoot = root === $document;
        var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
        if (isDocumentRoot && cell.tag !== "html") cell = {tag: "html", attrs: {}, children: cell};
        if (cellCache[id] === undefined) clear$1(node.childNodes);
        if (forceRecreation === true) reset(root);
        cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
        forEach(configs, function(config) { config(); });
    }

    // Promiz.mithril.js | Zolmeister | MIT
    // a modified version of Promiz.js, which does not conform to Promises/A+ for two reasons:
    // 1) `then` callbacks are called synchronously (because setTimeout is too slow, and the setImmediate polyfill is too big
    // 2) throwing subclasses of Error cause the error to be bubbled up instead of triggering rejection (because the spec does not account for the important use case of default browser error handling, i.e. message w/ line number)
    function Deferred(successCallback, failureCallback) {
        /*eslint-disable*/
        var RESOLVING = 1;
        var REJECTING = 2;
        var RESOLVED = 3;
        var REJECTED = 4;
        var self = this;
        var state = 0;
        var promiseValue = 0;
        var next = [];

        self.promise = {};

        self.resolve = function (value) {
            if (!state) {
                promiseValue = value;
                state = RESOLVING;

                fire();
            }
            return this;
        };

        self.reject = function (value) {
            if (!state) {
                promiseValue = value;
                state = REJECTING;

                fire();
            }
            return this;
        };

        self.promise.then = function (successCallback, failureCallback) {
            var local = new Deferred(successCallback, failureCallback)
            
            if (state === RESOLVED) {
                local.resolve(promiseValue);
            } else if (state === REJECTED) {
                local.reject(promiseValue);
            } else {
                next.push(local);
            }
            
            return local.promise;
        };

        function finish(type) {
            state = type || REJECTED;

            next.map(function (local) {
                local[state === RESOLVED ? "resolve" : "reject"](promiseValue);
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
                } catch (e) {
                    deferred.onerror(e);
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
            } catch (e) {
                deferred.onerror(e);
                promiseValue = e;
                state = REJECTING;
                return fire();
            }

            if (state === REJECTING) {
                deferred.onerror(promiseValue)
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
                    } else if (state === REJECTING && isFunction(failureCallback)) {
                        promiseValue = failureCallback(promiseValue);
                        state = RESOLVING;
                    }
                } catch (e) {
                    deferred.onerror(e);
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
        /*eslint-enable*/
    }

    function deferred() {
        var local = new Deferred();
        local.promise = propify(local.promise);

        return local;
    }

    deferred.onerror = function(e) {
        if (type.call(e) === "[object Error]" && !e.constructor.toString().match(/ Error/)) {
            clear();

            throw e;
        }
    };

    function build$1(object, prefix) {
        var duplicates = {};
        var str = [];
        for (var prop in object) {
            var key = prefix ? prefix + "[" + prop + "]" : prop;
            var value = object[prop];

            if (value === null) {
                str.push(encode(key));
            }
            else if (isObject(value)) {
                str.push(build$1(value, key));
            }
            else if (isArray(value)) {
                var keys = [];
                duplicates[key] = duplicates[key] || {};
                forEach(value, function(item) {
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

    function parse$1(str) {
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

    function identity(value) { return value; }

    function ajax(options) {
        /*eslint max-statements:[2, 23] */
        if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
            var callbackKey = "mithril_callback_"
                + new Date().getTime()
                + "_" + (Math.round(Math.random() * 1e16)).toString(36);
            var script = $document.createElement("script");

            window[callbackKey] = function(resp) {
                script.parentNode.removeChild(script);
                options.onload({
                    type: "load",
                    target: {
                        responseText: resp
                    }
                });
                window[callbackKey] = undefined;
            };

            script.onerror = function() {
                script.parentNode.removeChild(script);

                options.onerror({
                    type: "error",
                    target: {
                        status: 500,
                        responseText: JSON.stringify({
                            error: "Error making jsonp request"
                        })
                    }
                });
                window[callbackKey] = undefined;

                return false;
            }

            script.onload = function() {
                return false;
            };

            script.src = options.url
                + (options.url.indexOf("?") > 0 ? "&" : "?")
                + (options.callbackKey ? options.callbackKey : "callback")
                + "=" + callbackKey
                + "&" + build$1(options.data || {});
            $document.body.appendChild(script);
        }
        else {
            var xhr = new window.XMLHttpRequest();
            xhr.open(options.method, options.url, true, options.user, options.password);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) options.onload({type: "load", target: xhr});
                    else options.onerror({type: "error", target: xhr});
                }
            };

            if (options.serialize === JSON.stringify && options.data && options.method !== "GET") {
                xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            }

            if (options.deserialize === JSON.parse) {
                xhr.setRequestHeader("Accept", "application/json, text/*");
            }

            if (isFunction(options.config)) {
                var maybeXhr = options.config(xhr, options);
                if (maybeXhr != null) xhr = maybeXhr;
            }

            var data = options.method === "GET" || !options.data ? "" : options.data;
            if (data && (!isString(data) && data.constructor !== window.FormData)) {
                throw new Error(
                    "Request data should be either be a string or FormData. " +
                    "Check the `serialize` option in `m.request`"
                );
            }
            xhr.send(data);
            return xhr;
        }
    }

    function bindData(xhrOptions, data, serialize) {
        if (xhrOptions.method === "GET" && xhrOptions.dataType !== "jsonp") {
            var prefix = xhrOptions.url.indexOf("?") < 0 ? "?" : "&";
            var querystring = build$1(data);

            xhrOptions.url += (querystring ? prefix + querystring : "");
        }
        else xhrOptions.data = serialize(data);

        return xhrOptions;
    }

    function parameterizeUrl(url, data) {
        var tokens = url.match(/:[a-z]\w+/gi);
        if (tokens && data) {
            forEach(tokens, function(token) {
                var key = token.slice(1);
                url = url.replace(token, data[key]);
                delete data[key];
            });
        }
        return url;
    }

    function request(xhrOptions) {
        if (xhrOptions.background !== true) start();
        var deferred = new Deferred();
        var isJSONP = xhrOptions.dataType && xhrOptions.dataType.toLowerCase() === "jsonp"
        var serialize = xhrOptions.serialize = isJSONP ? identity : xhrOptions.serialize || JSON.stringify;
        var deserialize = xhrOptions.deserialize = isJSONP ? identity : xhrOptions.deserialize || JSON.parse;
        var extract = isJSONP ? function(jsonp) { return jsonp.responseText } : xhrOptions.extract || function(xhr) {
            if (xhr.responseText.length === 0 && deserialize === JSON.parse) {
                return null
            }
            else {
                return xhr.responseText
            }
        };
        xhrOptions.method = (xhrOptions.method || "GET").toUpperCase();
        xhrOptions.url = parameterizeUrl(xhrOptions.url, xhrOptions.data);
        xhrOptions = bindData(xhrOptions, xhrOptions.data, serialize);
        xhrOptions.onload = xhrOptions.onerror = function(e) {
            try {
                e = e || event;
                var unwrap = (e.type === "load" ? xhrOptions.unwrapSuccess : xhrOptions.unwrapError) || identity;
                var response = unwrap(deserialize(extract(e.target, xhrOptions)), e.target);
                if (e.type === "load") {
                    if (isArray(response) && xhrOptions.type) {
                        forEach(response, function(res, i) {
                            response[i] = new xhrOptions.type(res);
                        });
                    }
                    else if (xhrOptions.type) {
                        response = new xhrOptions.type(response);
                    }

                    deferred.resolve(response)
                }
                else {
                    deferred.reject(response)
                }

                deferred[e.type === "load" ? "resolve" : "reject"](response);
            }
            catch (error) {
                deferred.reject(error);
            }
            finally {
                if (xhrOptions.background !== true) end()
            }
        }

        ajax(xhrOptions);
        deferred.promise = propify(deferred.promise, xhrOptions.initialValue);
        return deferred.promise;
    }

    var modes = {pathname: "", hash: "#", search: "?"};
    var redirect = noop;
    var routeParams;
    var currentRoute;
    var isDefaultRoute = false;
    function normalizeRoute(route) {
        return route.slice(modes[route.mode].length);
    }

    function routeByValue(root, router, path) {
        routeParams = {};

        var queryStart = path.indexOf("?");
        if (queryStart !== -1) {
            routeParams = parse$1(path.substr(queryStart + 1, path.length));
            path = path.substr(0, queryStart);
        }

        //Get all routes and check if there's
        //an exact match for the current path
        var keys = Object.keys(router);
        var index = keys.indexOf(path);
        if (index !== -1){
            mount(root, router[keys [index]]);
            return true;
        }

        for (var route in router) {
            if (route === path) {
                mount(root, router[route]);
                return true;
            }

            var matcher = new RegExp(
                "^"
                + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)")
                + "\/?$"
            );

            if (matcher.test(path)) {
                path.replace(matcher, function() {
                    var keys = route.match(/:[^\/]+/g) || [];
                    var values = [].slice.call(arguments, 1, -2);
                    forEach(keys, function(key, i) {
                        routeParams[key.replace(/:|\./g, "")] = decode(values[i]);
                    })
                    mount(root, router[route]);
                });
                return true;
            }
        }
    }

    function routeUnobtrusive(e) {
        e = e || event;
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return;

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

        var currentTarget = e.currentTarget || e.srcElement,
            args = route.mode === "pathname" && currentTarget.search ? parse$1(currentTarget.search.slice(1)) : {};
        while (currentTarget && currentTarget.nodeName.toUpperCase() !== "A") currentTarget = currentTarget.parentNode;
        //clear pendingRequests because we want an immediate route change
        clear();
        route(currentTarget[route.mode].slice(modes[route.mode].length), args);
    }

    function setScroll() {
        if (route.mode !== "hash" && $location.hash) $location.hash = $location.hash;
        else window.scrollTo(0, 0);
    }

    function route(root, arg1, arg2, vdom) {
        /*eslint max-statements:[2, 28] */
        //route()
        if (arguments.length === 0) return currentRoute;
        //route(el, defaultRoute, routes)
        else if (arguments.length === 3 && isString(arg1)) {
            redirect = function(source) {
                var path = currentRoute = normalizeRoute(source);
                if (!routeByValue(root, arg2, path)) {
                    if (isDefaultRoute) {
                        throw new Error("Ensure the default route matches one of the routes defined in route");
                    }

                    isDefaultRoute = true;
                    route(arg1, true);
                    isDefaultRoute = false;
                }
            };
            var listener = route.mode === "hash" ? "onhashchange" : "onpopstate";
            window[listener] = function() {
                var path = $location[route.mode];
                if (route.mode === "pathname") path += $location.search;
                if (currentRoute !== normalizeRoute(path)) redirect(path);
            };

            preredraw(setScroll);
            window[listener]();
        }
        //config: route
        else if (root.addEventListener || root.attachEvent) {
            root.href = (route.mode !== "pathname" ? $location.pathname : "") + modes[route.mode] + vdom.attrs.href;
            if (root.addEventListener) {
                root.removeEventListener("click", routeUnobtrusive);
                root.addEventListener("click", routeUnobtrusive);
            }
            else {
                root.detachEvent("onclick", routeUnobtrusive);
                root.attachEvent("onclick", routeUnobtrusive);
            }
        }
        //route(route, params, shouldReplaceHistoryEntry)
        else if (isString(root)) {
            var oldRoute = currentRoute;
            currentRoute = root;
            var args = arg1 || {};
            var queryIndex = currentRoute.indexOf("?");
            var params = queryIndex > -1 ? parse$1(currentRoute.slice(queryIndex + 1)) : {};
            for (var i in args) params[i] = args[i];
            var querystring = build$1(params);
            var currentPath = queryIndex > -1 ? currentRoute.slice(0, queryIndex) : currentRoute;
            if (querystring) currentRoute = currentPath + (currentPath.indexOf("?") === -1 ? "?" : "&") + querystring;

            var shouldReplaceHistoryEntry = (arguments.length === 3 ? arg2 : arg1) === true || oldRoute === root;

            if (window.history.pushState) {
                preredraw(setScroll);
                postredraw(function() {
                    window.history[shouldReplaceHistoryEntry ? "replaceState" : "pushState"](
                        null,
                        $document.title,
                        modes[route.mode] + currentRoute
                    );
                });
                redirect(modes[route.mode] + currentRoute);
            }
            else {
                $location[route.mode] = currentRoute;
                redirect(modes[route.mode] + currentRoute);
            }
        }
    }

    route.param = function(key) {
        if (!routeParams) {
            throw new Error("You must call route(element, defaultRoute, routes) before calling route.param()");
        }

        if (!key) {
            return routeParams;
        }

        return routeParams[key];
    };

    route.mode = "search";

    route.buildQueryString = build$1;
    route.parseQueryString = parse$1;

    function trust(value) {
        /*eslint no-new-wrapper:0 */
        value = new String(value);
        value.$trusted = true;
        return value;
    }

    var m = parse;

    m.version = function() {
        return "v0.2.3";
    };

    m.component = component;
    m.mount = mount;
    m.prop = prop;
    m.redraw = redraw;
    m.render = render;
    m.request = request;
    m.route = route;
    m.trust = trust;

    return m;

}));