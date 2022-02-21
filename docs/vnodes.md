<!--meta-description
Documentation on Mithril.js' virtual DOM nodes (vnodes) and how they work
-->

# Virtual DOM nodes

- [What is virtual DOM](#what-is-virtual-dom)
- [Basics](#basics)
- [Structure](#structure)
- [Vnode types](#vnode-types)
- [Monomorphic class](#monomorphic-class)
- [Avoid anti-patterns](#avoid-anti-patterns)

---

### What is virtual DOM

A virtual DOM tree is a JavaScript data structure that describes a DOM tree. It consists of nested virtual DOM nodes, also known as *vnodes*.

The first time a virtual DOM tree is rendered, it is used as a blueprint to create a DOM tree that matches its structure.

Typically, virtual DOM trees are then recreated every render cycle, which normally occurs in response to event handlers or to data changes. Mithril.js *diffs* a vnode tree against its previous version and only modifies DOM elements in spots where there are changes.

It may seem wasteful to recreate vnodes so frequently, but as it turns out, modern JavaScript engines can create hundreds of thousands of objects in less than a millisecond. On the other hand, modifying the DOM is several orders of magnitude more expensive than creating vnodes.

For that reason, Mithril.js uses a sophisticated and highly optimized virtual DOM diffing algorithm to minimize the amount of DOM updates. Mithril.js *also* generates carefully crafted vnode data structures that are compiled by JavaScript engines for near-native data structure access performance. In addition, Mithril.js aggressively optimizes the function that creates vnodes as well.

The reason Mithril.js goes to such great lengths to support a rendering model that recreates the entire virtual DOM tree on every render is to provide a declarative [immediate mode](https://en.wikipedia.org/wiki/Immediate_mode_(computer_graphics%29) API, a style of rendering that makes it drastically easier to manage UI complexity.

To illustrate why immediate mode is so important, consider the DOM API and HTML. The DOM API is an imperative [retained mode](https://en.wikipedia.org/wiki/Retained_mode) API and requires 1. writing out exact instructions to assemble a DOM tree procedurally, and 2. writing out other instructions to update that tree. The imperative nature of the DOM API means you have many opportunities to micro-optimize your code, but it also means that you have more chances of introducing bugs and more chances to make code harder to understand.

In contrast, HTML is closer to an immediate mode rendering system. With HTML, you can write a DOM tree in a far more natural and readable way, without worrying about forgetting to append a child to a parent, running into stack overflows when rendering extremely deep trees, etc.

Virtual DOM goes one step further than HTML by allowing you to write *dynamic* DOM trees without having to manually write multiple sets of DOM API calls to efficiently synchronize the UI to arbitrary data changes.

---

### Basics

Virtual DOM nodes, or *vnodes*, are JavaScript objects that represent DOM elements (or parts of the DOM). Mithril.js' virtual DOM engine consumes a tree of vnodes to produce a DOM tree.

Vnodes are created via the [`m()`](hyperscript.md) hyperscript utility:

```javascript
m("div", {id: "test"}, "hello")
```

Hyperscript can also consume [components](components.md):

```javascript
// define a component
var ExampleComponent = {
	view: function(vnode) {
		return m("div", vnode.attrs, ["Hello ", vnode.children])
	}
}

// consume it
m(ExampleComponent, {style: "color:red;"}, "world")

// equivalent HTML:
// <div style="color:red;">Hello world</div>
```

---

### Structure

Virtual DOM nodes, or *vnodes*, are JavaScript objects that represent an element (or parts of the DOM) and have the following properties:

Property   | Type                             | Description
---------- | -------------------------------- | ---
`tag`      | `String|Object`                  | The `nodeName` of a DOM element. It may also be the string `[` if a vnode is a fragment, `#` if it's a text vnode, or `<` if it's a trusted HTML vnode. Additionally, it may be a component.
`key`      | `String?`                        | The value used to map a DOM element to its respective item in a array of data.
`attrs`    | `Object?`                        | A hashmap of [DOM attributes](hyperscript.md#dom-attributes), [events](hyperscript.md#events), [properties](hyperscript.md#properties) and [lifecycle methods](hyperscript.md#lifecycle-methods).
`children` | `(Array|String|Number|Boolean)?` | In most vnode types, the `children` property is an array of vnodes. For text and trusted HTML vnodes, The `children` property is either a string, a number or a boolean.
`text`     | `(String|Number|Boolean)?`       | This is used instead of `children` if a vnode contains a text node as its only child. This is done for performance reasons. Component vnodes never use the `text` property even if they have a text node as their only child.
`dom`      | `Element?`                       | Points to the element that corresponds to the vnode. This property is `undefined` in the `oninit` lifecycle method. In fragments and trusted HTML vnodes, `dom` points to the first element in the range.
`domSize`  | `Number?`                        | This is only set in fragment and trusted HTML vnodes, and it's `undefined` in all other vnode types. It defines the number of DOM elements that the vnode represents (starting from the element referenced by the `dom` property).
`state`    | `Object?`                        | An object that is persisted between redraws. It is provided by the core engine when needed. In POJO component vnodes, the `state` inherits prototypically from the component object/class. In class component vnodes it is an instance of the class. In closure components it is the object returned by the closure.
`events`   | `Object?`                        | An object that is persisted between redraws and that stores event handlers so that they can be removed using the DOM API. The `events` property is `undefined` if there are no event handlers defined. This property is only used internally by Mithril.js, do not use or modify it.
`instance` | `Object?`                        | For components, a storage location for the value returned by the `view`. This property is only used internally by Mithril.js, do not use or modify it.


---

### Vnode types

The `tag` property of a vnode determines its type. There are five vnode types:

Vnode type   | Example                        | Description
------------ | ------------------------------ | ---
Element      | `{tag: "div"}`                 | Represents a DOM element.
Fragment     | `{tag: "[", children: []}`     | Represents a list of DOM elements whose parent DOM element may also contain other elements that are not in the fragment. When using the [`m()`](hyperscript.md) helper function, fragment vnodes can only be created by nesting arrays into the `children` parameter of `m()`. `m("[")` does not create a valid vnode.
Text         | `{tag: "#", children: ""}`     | Represents a DOM text node.
Trusted HTML | `{tag: "<", children: "<br>"}` | Represents a list of DOM elements from an HTML string.
Component    | `{tag: ExampleComponent}`      | If `tag` is a JavaScript object with a `view` method, the vnode represents the DOM generated by rendering the component.

Everything in a virtual DOM tree is a vnode, including text. The `m()` utility automatically normalizes its `children` argument and turns strings into text vnodes and nested arrays into fragment vnodes.

Only element tag names and components can be the first argument of the `m()` function. In other words, `[`, `#` and `<` are not valid `selector` arguments for `m()`. Trusted HTML vnodes can be created via [`m.trust()`](trust.md)

---

### Monomorphic class

The `mithril/render/vnode` module is used by Mithril.js to generate all vnodes. This ensures modern JavaScript engines can optimize virtual dom diffing by always compiling vnodes to the same hidden class.

When creating libraries that emit vnodes, you should use this module instead of writing naked JavaScript objects in order to ensure a high level of rendering performance.

---

### Avoid anti-patterns

#### Avoid memoizing mutable vnodes

Vnodes are supposed to represent the state of the DOM at a certain point in time. Mithril.js' rendering engine assumes a reused vnode is unchanged, so modifying a vnode that was used in a previous render will result in undefined behavior.

It is possible to reuse vnodes to prevent a diff, but it's preferable to use the `onbeforeupdate` hook to make your intent clear to other developers (or your future self).

#### Avoid passing model data directly to components via attributes

The `key` property may appear in your data model in a way that conflicts with Mithril.js' key logic, and your model might itself be a mutable instance with a method that shares a name with a lifecycle hook like `onupdate` or `onremove`. For example, a model might use a `key` property to represent a customizable color key. When this changes, it can lead to components receiving wrong data, changing positions unexpectedly, or other unexpected, unwanted behavior. Instead, pass it as an attribute so Mithril.js doesn't misinterpret it (and so you still can potentially mutate it or call prototype methods on it later on):

```javascript
// Data model
var users = [
	{id: 1, name: "John", key: 'red'},
	{id: 2, name: "Mary", key: 'blue'},
]

// Later on...
users[0].key = 'yellow'

// AVOID
users.map(function(user){
	// The component for John will be destroyed and recreated
	return m(UserComponent, user)
})

// PREFER
users.map(function(user){
	// Key is specifically extracted: data model is given its own property
	return m(UserComponent, {key: user.id, model: user})
})
```

#### Avoid statements in view methods

JavaScript statements in view methods often require changing the naturally nested structure of an HTML tree, making the code more verbose and less readable.

```javascript
// AVOID
var BadListComponent = {
	view: function(vnode) {
		var list = []
		for (var i = 0; i < vnode.attrs.items.length; i++) {
			list.push(m("li", vnode.attrs.items[i]))
		}

		return m("ul", list)
	}
}
```

Instead, prefer using JavaScript expressions such as the ternary operator for conditional rendering and Array methods for list-like structures.

```javascript
// PREFER
var BetterListComponent = {
	view: function(vnode) {
		return m("ul", vnode.attrs.items.map(function(item) {
			return m("li", item)
		}))
	}
}
```