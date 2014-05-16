## Tools

### HTML-to-Mithril Template Converter

If you already have your HTML written and want to convert it into a Mithril template, you can use the tool below for one-off manual conversion.

[Template Converter](tools/template-converter.html)

---

### Automatic HTML-to-Mithril Template Converter

There's a tool called [MSX by Jonathan Buchanan](https://github.com/insin/msx) that allows you to write templates using HTML syntax, and then automatically compile them to Javascript when files change.

It is useful for teams where styling and functionality are done by different people, and for those who prefer to maintain templates in HTML syntax.

The tool allows you to write code like this:

```javascript
todo.view = function(ctrl) {
	return <html>
		<body>
			<input onchange={m.withAttr("value", ctrl.description)} value={ctrl.description()}/>
			<button onclick={ctrl.add.bind(ctrl, ctrl.description)}>Add</button>
		</body>
	</html>
};
```

Note, however, that since the code above is not valid Javascript, this syntax can only be used with a preprocessor build tool such as the provided [Gulp.js](http://gulpjs.com) script.

This tool is also available as a [Rails gem](https://github.com/mrsweaters/mithril-rails), created by Jordan Humphreys.

---

### Mithril Template Compiler

You can pre-compile Mithril templates to make them run faster. For more information see this page:

[Compiling Templates](compiling-templates.md)

---

### Typescript Support

There's a type definition file that you can use to add Mithril support to Typescript

[mithril.d.ts](mithril.d.ts)

You can use it by adding a reference to your Typescript files. This will allow the compiler to type-check calls to the Mithril API.

```javascript
/// <reference path="mithril.d.ts" />
```

---

### Internet Explorer Compatibility

Mithril relies on some Ecmascript 5 features, namely: `Array::indexOf` and `Object::keys`, as well as the `JSON` object.

You can use polyfill libraries to support these features in IE7.

-	[ES5 Shim](https://github.com/es-shims/es5-shim) or Mozilla.org's [Array::indexOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf) and [Object::keys](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys) polyfills

-	[JSON2.js](https://github.com/douglascrockford/JSON-js/blob/master/json2.js)

Mithril also has a dependency on XMLHttpRequest. If you wish to support IE6, you'll need [a shim for it](https://gist.github.com/Contra/2709462). IE7 and lower do not support cross-domain AJAX requests.

In addition, note that most `m.route` modes rely on `history.pushState` in order to allow moving from one page to another without a browser refresh. [IE9 and lower](http://caniuse.com/#search=pushstate) do not support this feature and will gracefully degrade to page refreshes instead.