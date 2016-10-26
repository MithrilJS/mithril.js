# Testing

Mithril comes with a testing framework called [ospec](../ospec/README.md). What makes it different from most test frameworks is that it avoids all configurability for the sake of avoiding [yak shaving](http://catb.org/jargon/html/Y/yak-shaving.html) and [analysis paralysis](https://en.wikipedia.org/wiki/Analysis_paralysis).

The easist way to setup the test runner is to create an NPM script for it. Open your project's `package.json` file and add a `test` entry under the `scripts` section:

```
{
	"name": "my-project",
	"scripts": {
		"build": "bundle index.js --output app.js --watch",
		"test": "ospec"
	},
	"dependencies": {
		"mithril": "github:lhorie/mithril.js#rewrite"
	}
}
```

Remember this is a JSON file, so object key names such as `"test"` must be inside of double quotes.

To setup a test suite, create a `tests` folder and inside of it, create a test file:

```javascript
// file: tests/math-test.js
var o = require("mithril/ospec/ospec")

o("math", function() {
	o("addition works", function() {
		o(1 + 2).equals(3)
	})
})
```

To run the test, use the command `npm test`. Ospec considers any Javascript file inside of a `tests` folder (anywhere in the project) to be a test.

```
npm test
```

### Good testing practices

Generally speaking, there are two ways to write tests: upfront and after the fact.

Writing tests upfront requires specifications to be frozen. Upfront tests are a great way of codifying the rules that a yet-to-be-implemented API must obey. However, writing tests upfront is not a suitable strategy if you don't know exactly what your code will look like, if the scope of the API is not well known or if it's likely to change (e.g. based on previous history at the company).

Writing tests after the fact is a way to document the behavior of a system and avoid regressions. They are useful to ensure that obscure corner cases are not inadvertedly broken and that previously fixed bugs do not get re-introduced by unrelated changes.

