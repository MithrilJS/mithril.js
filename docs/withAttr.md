# withAttr(attrName, callback)

- [API](#api)
- [How to use](#how-to-use)
- [Predictable event target](#predictable-event-target)
- [Attributes and properties](#attributes-and-properties)

---

### API

Creates an event handler. The event handler takes the value of a DOM element's property and calls a function with it as the argument.

This helper function is typically used in conjunction with [`m.prop()`](prop.md) to implement data binding. It is provided to help decouple the browser's event model from application code.

`m.withAttr(attrName, callback, thisArg?)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`attrName`  | `String`             | Yes      | The name of the attribute or property whose value will be used
`callback`  | `any -> Boolean?`    | Yes      | The callback
`thisArg`   | `any`                | No       | An object to bind to the `this` keyword in the callback function
**returns** | `Event -> Boolean?`  |          | An event handler function

[How to read signatures](signatures.md)

---

### How to use

```javascript
// standalone usage
document.body.onclick = m.withAttr("title", function(value) {
	console.log(value) // logs the title of the <body> element when clicked
})
```

Typically, `m.withAttr()` can be used in Mithril component views to implement two-way binding:

```javascript
var title = m.prop()

var MyComponent = {
	view: function() {
		return m("input", {
			oninput: m.withAttr("value", title),
			value: title()
		})
	}
}

m.mount(document.body, MyComponent)
```

---

### Predictable event target

The `m.withAttr()` helper reads the value of the element to which the event handler is bound, which is not necessarily the same as the element where the event originated.

```javascript
var url = m.prop()

var MyComponent = {
	view: function() {
		return m("a[href='/foo']", {onclick: m.withAttr("href", url)}, [
			m("span", url())
		])
	}
}

m.mount(document.body, MyComponent)
```

In the example above, if the user clicks on the text within the link, `e.target` will point to the `<span>`, not the `<a>`.

While this behavior works as per its specs, it's not very intuitive or useful most of the time. Therefore, `m.withAttr` uses the value of `e.currentTarget` which does point to the `<a>`, as one would normally expect.

---

### Attributes and properties

The first argument of `m.withAttr()` can be either an attribute or a property.

```javascript
// reads from `select.selectedIndex` property
var index = m.prop(0)
m("select", {onclick: m.withAttr("selectedIndex", index)})
```

If a value can be both an attribute *and* a property, the property value is used.

```javascript
// value is a boolean, because the `input.checked` property is boolean
var value = m.prop(false)
m("input", {onclick: m.withAttr("checked", value)})
```

