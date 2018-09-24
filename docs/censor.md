# censor(keys)

- [Description](#description)
- [Signature](#signature)
- [How it works](#how-it-works)

---

### Description

Takes an attributes object, removes all the special attribute keys like `key` and `oninit` from it, and then removes any extra properties specified in an optional list.

```javascript
var Component = {
	view: function(vnode) {
		return m("button", m.censor(vnode.attrs), [
			"Click to ", vnode.children
		])
	}
}
```

---

### Signature

`m.censor(attrs, extras?)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`attrs`     | `Object`             | Yes      | The attributes to censor properties from
`extras`    | `Array<String>`      | No       | Any extra attributes to censor
**returns** | `Event -> undefined` |          | A censored attributes object, or the original attributes if thre was nothing to censor

[How to read signatures](signatures.md)

---

### How it works

The `m.censor` method exists to strip lifecycle methods and other special keys, defined internally and/or used by your component, from an attributes object you intend to proxy through a component. It's useful for [avoiding restrictive interfaces](components.md#avoid-restrictive-interfaces) when defining components, to get around the common gotcha of [double-called lifecycle methods](https://github.com/MithrilJS/mithril.js/issues/1775) when you do it naïvely.

```javascript
// This does not do what you want, especially if you choose to add lifecycle
// attributes to it when you use it.
var BadComponent = {
	view: function(vnode) {
		return m("button", vnode.attrs, [
			"Click to ", vnode.children
		])
	}
}

// This is 100% safe, and you've handled everything correctly. Do this instead.
var GoodComponent = {
	view: function(vnode) {
		return m("button", m.censor(vnode.attrs), [
			"Click to ", vnode.children
		])
	}
}
```
