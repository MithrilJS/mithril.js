var FS = require('fs');
var m = require('./mithril');
var mock = requireFromStr(FS.readFileSync(__dirname+'/tests/mock.js'), 'mock');
var URL = require('url');

function requireFromStr(src, toExport) {
    var m = new module.constructor();
    src += '\nmodule.exports = ' + toExport + ';\n';
    m.paths = module.paths;
    m._compile(src, toExport);
    return m.exports;
};

function objectReplace(a, b, src) {
    var k, v, dst = {};
    for (k in src) {
        dst[k] = (src[k] === a) ? b : src[k];
    }
    return dst;
}

m.isoRender = function(cell) {
    m.deps(mock.window);

    var root = mock.window.document.createElement("div");
    m.render(root, cell, true);
    mock.window.requestAnimationFrame.$resolve();
    return root.innerHTML;
};

m.isoModule = function(module) {
    m.deps(mock.window);

    var root = mock.window.document.createElement("div");
    m.module(root, module);
    mock.window.requestAnimationFrame.$resolve();
    return root.innerHTML;
};

m.isoRoute = function(router, url) {
    // optional routing mode
    if (arguments.length > 2) {
        m.route.mode = arguments[2];
    }
    // have to set location every time, as mithril does not store reference
    // to window, but to document and location separately
    // URL.parse can produce nulls, mithril appends search to path so
    // replace nulls with strings
    mock.window.location = objectReplace(null, '', URL.parse(url));
    m.deps(mock.window);

    var root = mock.window.document.createElement("div");
    m.route(root, '/', router, true);
    mock.window.requestAnimationFrame.$resolve();
    return root.innerHTML;
};

if (typeof module != "undefined" && module !== null && module.exports) module.exports = m;
else if (typeof define === "function" && define.amd) define(function() {return m});
