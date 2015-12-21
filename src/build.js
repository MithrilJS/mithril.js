import {$document} from "./env.js";
import {forKeys, forEach} from "./iterate.js";
import {type, isArray, isObject, isFunction} from "./types.js";
import {clear, insertNode, injectHTML, injectTextNode} from "./dom.js";
import {buildObject} from "./build-object.js";

var DELETION = 1,
    INSERTION = 2,
    MOVE = 3,
    voidElements = /^(AREA|BASE|BR|COL|COMMAND|EMBED|HR|IMG|INPUT|KEYGEN|LINK|META|PARAM|SOURCE|TRACK|WBR)$/;

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
            clear(cached[index].nodes, cached[index]);
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
        if (node.parentNode != null && nodes.indexOf(node) < 0) clear([node], [cached[i]]);
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
    data = flatten(data);
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
            clear(parentCache.nodes.slice(offset, end), parentCache.slice(offset, end));
        }
        else if (cached.nodes) {
            clear(cached.nodes, cached);
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
            clear(nodes, cached)
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
                clear(cached.nodes, cached)
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

export {build};
