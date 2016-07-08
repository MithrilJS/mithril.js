# Components

- [Structure](#structure)
- [Lifecycle methods](#lifecycle-methods)
- [State](#state)
- [Avoid-anti-patterns](#avoid-anti-patterns)

### Structure

Components are a mechanism to encapsulate parts of a view to make code easier to organize and/or reuse.

Any Javascript object that has a view method is a Mithril component. Components can be consumed via the [`m()`](hyperscript.md) utility:

```javascript
var Example = {
	view: function() {
		return m("div", "Hello")
	}
}

m(Example)

// equivalent HTML
// <div>Hello</div>
```

---

### Lifecycle methods

Components can have the same [lifecycle methods](lifecycle-methods.md) as virtual DOM nodes: `oninit`, `oncreate`, `onupdate`, `onbeforeremove`, `onremove` and `onbeforeupdate`.

```javascript
var ComponentWithHooks = {
	oninit: function(vnode) {
		console.log("initialized")
	},
	oncreate: function(vnode) {
		console.log("DOM created")
	},
	onupdate: function(vnode) {
		console.log("DOM updated")
	},
	onbeforeremove: function(vnode, done) {
		console.log("exit animation can start")
		done()
	},
	onremove: function(vnode) {
		console.log("removing DOM element")
	},
	onbeforeupdate: function(vnode, old) {
		return true
	},
	view: function(vnode) {
		return "hello"
	}
}
```

Like other types of virtual DOM nodes, components may have additional lifecycle methods defined when consumed as vnode types.

```javascript
function initialize() {
	console.log("initialized as vnode")
}

m(ComponentWithHooks, {oninit: initialize})
```

Lifecycle methods in vnodes do not override component methods, nor vice versa. Component lifecycle methods are always run after the vnode's corresponding method.

To learn more about lifecycle methods, [see the lifecycle methods page](lifecycle-methods.md).

---

### State

Like all virtual DOM nodes, component vnodes can have state. Component state is useful for supporting object-oriented architectures, for encapsulation and for separation of concerns.

The state of a component can be accessed two ways: via `vnode.state` and via the `this` keyword in component methods.

#### Via vnode.state

State can be accessed via the `vnode.state` property, which is available to all lifecycle methods as well as the `view` method of a component.

```javascript
var ComponentWithDynamicState = {
	oninit: function(vnode) {
		vnode.state.data = vnode.attrs.text
	},
	view: function(vnode) {
		return m("div", vnode.state.data)
	}
}

m(ComponentWithDynamicState, {text: "Hello"})

// Equivalent HTML
// <div>Hello</div>
```

#### Via the this keyword

State can also be accessed via the `this` keyword, which is available to all lifecycle methods as well as the `view` method of a component.

```javascript
var ComponentUsingThis = {
	oninit: function(vnode) {
		this.data = vnode.attrs.text
	},
	view: function(vnode) {
		return m("div", this.data)
	}
}

m(ComponentUsingThis, {text: "Hello"})

// Equivalent HTML
// <div>Hello</div>
```

Be aware that when using ES5 functions, the value of `this` in nested anonymous functions is not the component instance. There are two recommended ways to get around this Javascript limitation, use ES6 arrow functions, or if ES6 is not available, use `vnode.state`.

---

### Avoid anti-patterns

Although Mithril is flexible, some code patterns are discouraged:

#### Avoid restrictive interfaces

A component has a restrictive interface when it exposes only specific properties, under the assumption that other properties will not be needed, or that they can be added at a later time.

In the example below, the `button` configuration is severely limited: it does not support any events other than `onclick`, it's not styleable and it only accepts text as children (but not elements, fragments or trusted HTML).

```javascript
// AVOID
var RestrictiveComponent = {
	view: function(vnode) {
		return m("button", {onclick: vnode.attrs.onclick}, [
			"Click to " + vnode.attrs.text
		])
	}
}
```

It's preferable to allow passing through parameters to a component's root node, if it makes sense to do so:

```javascript
// PREFER
var FlexibleComponent = {
	view: function(vnode) {
		return m("button", vnode.attrs, [
			"Click to ", vnode.children
		])
	}
}
```

#### Avoid magic indexes

Often it's desirable to define multiple sets of children, for example, if a component has a configurable title and body.

Avoid destructuring the `children` property for this purpose.

```javascript
// AVOID
var Header = {
	view: function(vnode) {
		return m(".section", [
			m(".header", vnode.children[0]),
			m(".tagline", vnode.children[1]),
		])
	}
}

m(Header, [
	m("h1", "My title"),
	m("h2", "Lorem ipsum"),
])

// awkward consumption use case
m(Header, [
	[
		m("h1", "My title"),
		m("small", "A small note"),
	],
	m("h2", "Lorem ipsum"),
])
```

The component above makes different children look different based on where they appear in the array. It's difficult to understand the component without reading its implementation. Instead, use attributes as named parameters and reserve `children` for uniform child content:

```javascript
// PREFER
var BetterHeader = {
	view: function(vnode) {
		return m(".section", [
			m(".header", vnode.attrs.title),
			m(".tagline", vnode.attrs.tagline),
		])
	}
}

m(BetterHeader, {
	title: m("h1", "My title"),
	tagline: m("h2", "Lorem ipsum"),
})

// clearer consumption use case
m(Header, {
	title: [
		m("h1", "My title"),
		m("small", "A small note"),
	],
	tagline: m("h2", "Lorem ipsum"),
})
```

#### Avoid component factories

Component diffing relies on strict equality checking, so you should avoid recreating components. Instead, consume components idiomatically.

```javascript
// AVOID
var ComponentFactory = function(greeting) {
	// creates a new component on every call
	return {
		view: function() {
			return m("div", greeting)
		}
	}
}
m.render(document.body, m(ComponentFactory("hello")))
// caling a second time recreates div from scratch rather than doing nothing
m.render(document.body, m(ComponentFactory("hello")))

// PREFER
var Component = {
	view: function(vnode) {
		return m("div", vnode.attrs.greeting)
	}
}
m.render(document.body, m(Component, {greeting: "hello"}))
// caling a second time does not modify DOM
m.render(document.body, m(Component, {greeting: "hello"}))
```