## m.deps

---

- [Usage](#usage)
- [Signature](#signature)

---

This function overwrites the reference to the `window` object that is used internally by Mithril. It is useful for injecting a mock `window` dependency for the purposes of testing and for running Mithril in non-browser environments. The mock object used by Mithril for its own test suite [can be found in the development repo](https://github.com/lhorie/mithril.js/blob/next/test-deps/mock.js).

By default, Mithril uses `window` itself as the dependency. Note that Mithril only uses the mock object for browser APIs such as the DOM API and `requestAnimationFrame`, but relies on the environment for ECMAScript features like `Object.keys`.

---

### Usage

Call it at the beginning of your test file to supply a mock `window`:

```javascript
function testMithril(mockWindow) {
	window = m.deps(mockWindow);

	// Your tests here...
}
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Window m.deps(Object window)

where:
	Window :: Object<any>
```

-	**Object Window**

	This should be either `window` or a mock of the `window` object.

	Mithril uses certain `window` methods that will need to be made available for complete test coverage, depending on your application:

	- `window.document`
	- Mithril also uses certain methods on the DOM node object
	- `window.requestAnimationFrame`/`window.cancelAnimationFrame`
	- Falls back to `window.setTimeout`/`window.clearTimeout`
	- `window.location`
	- `window.history`
	- `window.scrollTo`
	- `window.XMLHttpRequest`

-	**returns** Window

	The returned window is the same as what is passed in.

