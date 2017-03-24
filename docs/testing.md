# Testing

Mithril comes with a testing framework called [ospec](https://github.com/lhorie/mithril.js/tree/rewrite/ospec). What makes it different from most test frameworks is that it avoids all configurability for the sake of avoiding [yak shaving](http://catb.org/jargon/html/Y/yak-shaving.html) and [analysis paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis).

The easist way to setup the test runner is to create an NPM script for it. Open your project's `package.json` file and edit the `test` line under the `scripts` section:

```
{
	"name": "my-project",
	"scripts": {
		"test": "ospec"
	}
}
```

Remember this is a JSON file, so object key names such as `"test"` must be inside of double quotes.

To setup a test suite, create a `tests` folder and inside of it, create a test file:

```javascript
// file: tests/math-test.js
var o = require("mithril/ospec/ospec")

o.spec("math", function() {
	o("addition works", function() {
		o(1 + 2).equals(3)
	})
})
```

To run the test, use the command `npm test`. Ospec considers any Javascript file inside of a `tests` folder (anywhere in the project) to be a test.

```
npm test
```

---

### Running mithril in a non-browser environment

Mithril has a few dependencies on globals that exist in all its supported browser environments but are missing in all non-browser environments. To work around this you can use the browser mocks that ship with the mithril npm package.

The simplest way to do this is ensure the following snippet of code runs **before** you include mithril itself in your project.

```js
// Polyfill DOM env for mithril
global.window = require("mithril/test-utils/browserMock.js")();
global.document = window.document;
```

Once that snippet has been run you can `require("mithril")` and it should be quite happy.

---

### Good testing practices

Generally speaking, there are two ways to write tests: upfront and after the fact.

Writing tests upfront requires specifications to be frozen. Upfront tests are a great way of codifying the rules that a yet-to-be-implemented API must obey. However, writing tests upfront may not be a suitable strategy if you don't have a reasonable idea of what your project will look like, if the scope of the API is not well known or if it's likely to change (e.g. based on previous history at the company).

Writing tests after the fact is a way to document the behavior of a system and avoid regressions. They are useful to ensure that obscure corner cases are not inadvertedly broken and that previously fixed bugs do not get re-introduced by unrelated changes.

---

### Unit testing

Unit testing is the practice of isolating a part of an application (typically a single module), and asserting that, given some inputs, it produces the expected outputs.

Testing a Mithril component is easy. Let's assume we have a simple component like this:

```javascript
// MyComponent.js
var m = require("mithril")

module.exports = {
	view: function() {
		return m("div", "Hello world")
	}
}
```

We can then create a `tests/MyComponent.js` file and create a test for this component like this:

```javascript
var MyComponent = require("MyComponent")

o.spec("MyComponent", function() {
	o("returns a div", function() {
		var vnode = MyComponent.view()
		
		o(vnode.tag).equals("div")
		o(vnode.children.length).equals(1)
		o(vnode.children[0].tag).equals("#")
		o(vnode.children[0].children).equals("Hello world")
	})
})
```

Typically, you wouldn't test the structure of the vnode tree so granularly, and you would instead only test non-trivial, dynamic aspects of the view. A tool that can help making testing easier with deep vnode trees is [Mithril Query](https://github.com/StephanHoyer/mithril-query).

Sometimes, you need to mock the dependencies of a module in order to test the module in isolation. [Mockery](https://github.com/mfncooper/mockery) is one tool that allows you to do that.
