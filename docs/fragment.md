# fragment(html)

- [API](#api)
- [How it works](#how-it-works)

---

### API

Generates a trusted HTML [vnode](vnodes.md)

`vnode = m.fragment(attrs, children)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`attrs`     | `Object`             | Yes      | A map of attributes
`children`  | `Array<Vnode>`       | Yes      | A list of vnodes
**returns** | `Vnode`              |          | A fragment [vnode](vnodes.md)

[How to read signatures](signatures.md)

---

### How it works

`m.fragment()` creates a [fragment vnode](vnodes.md) with attributes. It is meant for advanced use cases involving keys or lifecyle methods.

Normally you can use simple arrays instead to denote a list of child nodes or a range of nodes within a node list:

```javascript
var groupVisible = true

m("ul", [
	m("li", "child 1"),
	m("li", "child 2"),
	groupVisible ? [
		m("li", "child 3"),
		m("li", "child 4"),
	] : null
])
```

There are a few benefits that come from using `m.fragment` instead of handwriting a vnode object structure: m.fragment creates [monomorphic objects](vnodes.md#monomorphic-objects), which have better performance characteristics than creating objects dynamically. In addition, using `m.fragment` makes your intentions clear, and it makes it less likely that you'll mistakenly set attributes on the vnode object rather than on the attrs object.