[![Join the chat at https://gitter.im/lhorie/mithril.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/lhorie/mithril.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/lhorie/mithril.js.svg?branch=master)](https://travis-ci.org/lhorie/mithril.js)

# Mithril

A Javascript Framework for Building Brilliant Applications

See the [website](http://lhorie.github.io/mithril) for documentation

There's also a [blog](http://lhorie.github.io/mithril-blog) and a [mailing list](https://groups.google.com/forum/#!forum/mithriljs)

---

## Fork information:

This fork aims for adaptating Mithril to native ES6 promises. All test cases which rely on the sync behavior need to be adapted to be asyncronous. Also this fork aims to remove the code from "Unchecked Error Handling" as actual browsers are now doing this, athough shims aren't.

---

## What is Mithril?

Mithril is a client-side MVC framework - a tool to organize code in a way that is easy to think about and to maintain.

### Light-weight

- Only 5kb gzipped, no dependencies
- Small API, small learning curve

### Robust

- Safe-by-default templates
- Hierarchical MVC via components

### Fast

- Virtual DOM diffing and compilable templates
- Intelligent auto-redrawing system

---

## Sample code

```javascript
//namespace
var app = {};

//model
app.PageList = function() {
	return m.request({method: "GET", url: "pages.json"});
};

//controller
app.controller = function() {
	var pages = app.PageList();
	return {
		pages: pages,
		rotate: function() {
			pages().push(pages().shift());
		}
	}
};

//view
app.view = function(ctrl) {
	return [
		ctrl.pages().map(function(page) {
			return m("a", {href: page.url}, page.title);
		}),
		m("button", {onclick: ctrl.rotate}, "Rotate links")
	];
};


//initialize
m.module(document.getElementById("example"), app);
```

---

### Learn more

- [Tutorial](http://lhorie.github.io/mithril/getting-started.html)
- [Differences from Other Frameworks](http://lhorie.github.io/mithril/comparison.html)
- [Benchmarks](http://lhorie.github.io/mithril/benchmarks.html)
