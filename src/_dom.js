import {noop} from "./_util.js";
import {isFunction, isArray} from "./_types.js";
import {$document} from "./_env.js";
import {forEach} from "./_iterate.js";
import {redraw} from "./redraw";
import {start, end} from "./computation.js";

var roots = [],
    components = [],
    controllers = [],
    unloaders = [],
    nodeCache = [],
    cellCache = {},
    html,
    documentNode;

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

function clear(nodes, cached) {
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

export {
    roots,
    controllers,
    components,
    unloaders,
    unload,
    clear,
    getCellCacheKey,
    reset,
    removeRootElement,
    clearUnloaders,
    nodeCache,
    cellCache,
    documentNode,
    insertNode,
    injectHTML,
    injectTextNode,
    autoredraw
};
