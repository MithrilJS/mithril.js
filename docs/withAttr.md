# withAttr(attrName, callback)

- [Description](#description)
- [Signature](#signature)
- [How it works](#how-it-works)
- [Predictable event target](#predictable-event-target)
- [Attributes and properties](#attributes-and-properties)

---

### Description

Returns an event handler that runs `callback` with the value of the specified DOM attribute

```javascript
var state = {
	value: "",
	setValue: function(v) {state.value = v}
}

var Component = {
	view: function() {
		return m("input", {
			oninput: m.withAttr("value", state.setValue),
			value: state.value,
		})
	}
}

m.mount(document.body, Component)
```

---

### Signature

`m.withAttr(attrName, callback, thisArg?)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`attrName`  | `String`             | Yes      | The name of the attribute or property whose value will be used
`callback`  | `any -> undefined`   | Yes      | The callback
`thisArg`   | `any`                | No       | An object to bind to the `this` keyword in the callback function
**returns** | `Event -> undefined` |          | An event handler function

[How to read signatures](signatures.md)

---

### How it works

The `m.withAttr` method creates an event handler. The event handler takes the value of a DOM element's property and calls a function with it as the argument.

This helper function is provided to help decouple the browser's event model from application code.

```javascript
// standalone usage
document.body.onclick = m.withAttr("title", function(value) {
	console.log(value) // logs the title of the <body> element when clicked
})
```

Typically, `m.withAttr()` can be used in Mithril component views to avoid polluting the data layer with DOM event model concerns:

```javascript
var state = {
	email: "",
	setEmail: function(email) {
		state.email = email.toLowerCase()
	}
}

var MyComponent = {
	view: function() {
		return m("input", {
			oninput: m.withAttr("value", state.setEmail),
			value: state.email
		})
	}
}

m.mount(document.body, MyComponent)
```

---

### Predictable event target

The `m.withAttr()` helper reads the value of the element to which the event handler is bound, which is not necessarily the same as the element where the event originated.

```javascript
var state = {
	url: "",
	setURL: function(url) {state.url = url}
}

var MyComponent = {
	view: function() {
		return m("a[href='/foo']", {onclick: m.withAttr("href", state.setURL)}, [
			m("span", state.url)
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
var state = {
	index: 0,
	setIndex: function(index) {state.index = index}
}
m("select", {onclick: m.withAttr("selectedIndex", state.setIndex)})
```

If a value can be both an attribute *and* a property, the property value is used.

```javascript
// value is a boolean, because the `input.checked` property is boolean
var state = {
	selected: false,
	setSelected: function(selected) {state.selected = selected}
}
m("input[type=checkbox]", {onclick: m.withAttr("checked", state.setSelected)})
```
