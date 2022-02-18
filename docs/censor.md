<!--meta-description
Documentation on m.censor(), which helps cloning vnodes
-->

# censor(object, extra)

- [Description](#description)
- [Signature](#signature)
- [How it works](#signature)

---

### Description

Returns a shallow-cloned object with lifecycle attributes and any given custom attributes omitted.

```javascript
var attrs = {one: "two", enabled: false, oninit: function() {}}
var censored = m.censor(attrs, ["enabled"])
// {one: "two"}
```

---

### Signature

`censored = m.censor(object, extra)`

Argument     | Type                                       | Required | Description
------------ | ------------------------------------------ | -------- | ---
`object`     | `Object`                                   | Yes      | A key-value map to be converted into a string
`extra`      | `Array<String>`                            | No       | Additional properties to omit.
**returns**  | `Object`                                   |          | The original object if no properties to omit existed on it, a shallow-cloned object with the removed properties otherwise.

[How to read signatures](signatures.md)

---

### How it works

Ordinarily, you don't need this method, and you'll just want to specify the attributes you want. But sometimes, it's more convenient to send all attributes you don't know to another element. This is often perfectly reasonable, but it can lead you into a major trap with lifecycle methods getting called twice.

```javascript
function SomePage() {
	return {
		view: function() {
			return m(SomeFancyView, {
				oncreate: function() {
					sendViewHit(m.route.get(), "some fancy view")
				},
			})
		},
	}
}

function SomeFancyView() {
	return {
		view: function(vnode) {
			return m("div", vnode.attrs, [ // !!!
				// ...
			])
		},
	}
}
```

This looks benign, but this creates a problem: you're sending two hits each time this view is navigated. This is where `m.censor` come in: it lets you strip that `oncreate` from the attributes so it only gets called once and so the caller can remain sane and rest assured they aren't dealing with super weird bugs because of it.

```javascript
// Fixed
function SomeFancyView() {
	return {
		view: function(vnode) {
			return m("div", m.censor(vnode.attrs), [
				// ...
			])
		},
	}
}
```

You can also run into similar issues with keys:

```javascript
function SomePage() {
	return {
		view: function() {
			return m(Layout, {
				pageTitle: "Some Page",
				key: someKey,
			}, [
				// ...
			])
		},
	}
}

function Layout() {
	return {
		view: function(vnode) {
			return [
				m("header", [
					m("h1", "My beautiful web app"),
					m("nav"),
				]),
				m(".body", vnode.attrs, [ // !!!
					m("h2", vnode.attrs.pageTitle),
					vnode.children,
				])
			]
		},
	}
}
```

This would end up [throwing an error](keys.md#key-restrictions) because here's what Mithril.js sees when creating the `Layout` vnode:

```javascript
return [
	m("header", [
		m("h1", "My beautiful web app"),
		m("nav"),
	]),
	m(".body", {pageTitle: "Some Page", key: someKey}, [
		m("h2", "Some Page"),
		[/* ... */],
	])
]
```

You wouldn't likely catch that at first glance, especially in much more real-world scenarios where there might be indirection and/or other issues. To correct this, you similarly have to censor out the `key:` attribute. You can also censor out the custom `pageTitle` attribute, too, since it doesn't provide any real value being in the DOM.

```javascript
// Fixed
function Layout() {
	return {
		view: function(vnode) {
			return [
				m("header", [
					m("h1", "My beautiful web app"),
					m("nav"),
				]),
				m(".body", m.censor(vnode.attrs, ["pageTitle"]), [
					m("h2", vnode.attrs.pageTitle),
					vnode.children,
				])
			]
		},
	}
}
```
