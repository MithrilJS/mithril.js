## Tools

### HTML to Mithril Template Converter

If you already have your HTML written and want to convert it into a Mithril template, use the tool below.

[Template Converter](tools/template-converter.html)

---

### Mithril Template Compiler

You can pre-compile Mithril templates to make them run faster. For more information see this page:

[Compiling Templates](compiling-templates.md)

---

### Internet Explorer Compatibility

Mithril relies on some Ecmascript 5 features, namely: `Array::indexOf` and `Object::keys`, as well as the `JSON` object.

You can use polyfill libraries to support these features in IE7.

-	[ES5 Shim](https://github.com/es-shims/es5-shim) or Mozilla.org's [Array::indexOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf) and [Object::keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys) polyfills

-	[JSON2.js](https://github.com/douglascrockford/JSON-js/blob/master/json2.js)

Mithril also has a dependency on XMLHttpRequest. If you wish to support IE6, you'll need [a shim for it](https://gist.github.com/Contra/2709462). IE7 and lower do not support cross-domain AJAX requests.

In addition, note that most `m.route` modes rely on `history.pushState` in order to allow moving from one page to another without a browser refresh. [IE9 and lower](http://caniuse.com/#search=pushstate) do not support this feature and will gracefully degrade to page refreshes instead.