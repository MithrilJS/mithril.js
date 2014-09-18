## m.deps

---

[Usage](#usage)
[Signature](#signature)

---

This is a testing method to set the `window` object in an environment that does not have it (such as the server).
It will normally _not_ be used in an application, as `window` is already available to Mithril.
For normal (client-side) use of mithril, this method will not be used.

It is used in Mithril's testing suite, and can be used to supply a mock `window` for browserless testing.

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

	This should be a mock of the `window` object.

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

	The returned window is the same as that passed in.

