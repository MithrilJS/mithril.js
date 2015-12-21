import {$document} from "./_env.js";
import {forEach} from "./_iterate.js";
import {getCellCacheKey, cellCache, clear, reset, documentNode} from "./_dom.js";
import {build} from "./_build.js";

function render(root, cell, forceRecreation) {
    var configs = [];
    if (!root) throw new Error("Ensure the DOM element being passed to m.route/m.mount/m.render is not undefined.");
    var id = getCellCacheKey(root);
    var isDocumentRoot = root === $document;
    var node = isDocumentRoot || root === $document.documentElement ? documentNode : root;
    if (isDocumentRoot && cell.tag !== "html") cell = {tag: "html", attrs: {}, children: cell};
    if (cellCache[id] === undefined) clear(node.childNodes);
    if (forceRecreation === true) reset(root);
    cellCache[id] = build(node, null, undefined, undefined, cell, cellCache[id], false, 0, null, undefined, configs);
    forEach(configs, function(config) { config(); });
}

export {render};
