# Components

- [Structure](#structure)
- [Lifecycle methods](#lifecycle-methods)
- [State](#state)
- [ES6 classes](#es6-classes)
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

### Passing data to components

Data can be passed to component instances by passing an `attrs` object as the second parameter in the hyperscript function:

```javascript
m(Example, {name: "Floyd"})
```

This data can be accessed in the component's view or lifecycle methods via the `vnode.attrs`:

```javascript
var Example = {
	view: function (vnode) {
		return m("div", "Hello, " + vnode.attrs.name)
	}
}
```

NOTE: Lifecycle methods can also be provided via the `attrs` object, so you should avoid using the lifecycle method names for your own callbacks as they would also be invoked by Mithril. Use lifecycle methods in `attrs` only when you specifically wish to create lifecycle hooks.

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
	onbeforeremove: function(vnode) {
		console.log("exit animation can start")
		return new Promise(function(resolve) {
			// call after animation completes
			resolve()
		})
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

Take care not to use lifecycle method names for your own callback function names in vnodes.

To learn more about lifecycle methods, [see the lifecycle methods page](lifecycle-methods.md).

---

### Alternate component syntaxes

#### ES6 classes

Components can also be written using ES6 class syntax:

```javascript
class ES6ClassComponent {
	constructor(vnode) {
		// vnode.state is undefined at this point
		this.kind = "ES6 class"
	}
	view() {
		return m("div", `Hello from an ${this.kind}`)
	}
	oncreate() {
		console.log(`A ${this.kind} component was created`)
	}
}
```

Component classes must define a `view()` method, detected via `.prototype.view`, to get the tree to render.

They can be consumed in the same way regular components can.

```javascript
// EXAMPLE: via m.render
m.render(document.body, m(ES6ClassComponent))

// EXAMPLE: via m.mount
m.mount(document.body, ES6ClassComponent)

// EXAMPLE: via m.route
m.route(document.body, "/", {
	"/": ES6ClassComponent
})

// EXAMPLE: component composition
class AnotherES6ClassComponent {
	view() {
		return m("main", [
			m(ES6ClassComponent)
		])
	}
}
```

#### Closure components

Functionally minded developers may prefer using the "closure component" syntax:

```javascript
function closureComponent(vnode) {
	// vnode.state is undefined at this point
	var kind = "closure component"

	return {
		view: function() {
			return m("div", "Hello from a " + kind)
		},
		oncreate: function() {
			console.log("We've created a " + kind)
		}
	}
}
```

The returned object must hold a `view` function, used to get the tree to render.

They can be consumed in the same way regular components can.

```javascript
// EXAMPLE: via m.render
m.render(document.body, m(closureComponent))

// EXAMPLE: via m.mount
m.mount(document.body, closuresComponent)

// EXAMPLE: via m.route
m.route(document.body, "/", {
	"/": closureComponent
})

// EXAMPLE: component composition
function anotherClosureComponent() {
	return {
		view: function() {
			return m("main", [
				m(closureComponent)
			])
		}
	}
}
```

#### Mixing component kinds

Components can be freely mixed. A Class component can have closure or POJO components as children, etc...

---

### State

Like all virtual DOM nodes, component vnodes can have state. Component state is useful for supporting object-oriented architectures, for encapsulation and for separation of concerns.

The state of a component can be accessed three ways: as a blueprint at initialization, via `vnode.state` and via the `this` keyword in component methods.

#### At initialization

For POJO components, the component object is the prototype of each component instance, so any property defined on the component object will be accessible as a property of `vnode.state`. This allows simple state initialization.

In the example below, `data` is a property of the `ComponentWithInitialState` component's state object.

```javascript
var ComponentWithInitialState = {
	data: "Initial content",
	view: function(vnode) {
		return m("div", vnode.state.data)
	}
}

m(ComponentWithInitialState)

// Equivalent HTML
// <div>Initial content</div>
```

For class components, the state is an instance of the class, set right after the constructor is called.

For closure components, the state is the object returned by the closure, set right after the closure returns. The state object is mostly redundant for closure components (since variables defined in the closure scope can be used instead).

#### Via vnode.state

State can also be accessed via the `vnode.state` property, which is available to all lifecycle methods as well as the `view` method of a component.

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

### ES6 classes

Components can also be written using ES6 class syntax:

```javascript
class ES6ClassComponent {
	view() {
		return m("div", "Hello from an ES6 class")
	}
}
```

They can be consumed in the same way regular components can.

```javascript
// EXAMPLE: via m.render
m.render(document.body, m(ES6ClassComponent))

// EXAMPLE: via m.mount
m.mount(document.body, ES6ClassComponent)

// EXAMPLE: via m.route
m.route(document.body, "/", {
	"/": ES6ClassComponent
})

// EXAMPLE: component composition
class AnotherES6ClassComponent {
	view() {
		return m("main", [
			m(ES6ClassComponent)
		])
	}
}
```

---

### Avoid anti-patterns

Although Mithril is flexible, some code patterns are discouraged:

#### Avoid fat components

Generally speaking, a "fat" component is a component that has custom instance methods. In other words, you should avoid attaching functions to `vnode.state` or `this`. It's exceedingly rare to have logic that logically fits in a component instance method and that can't be reused by other components. It's relatively common that said logic might be needed by a different component down the road.

It's easier to refactor code if that logic is placed in the data layer than if it's tied to a component state.

Consider this fat component:

```javascript
// views/Login.js
// AVOID
var Login = {
	username: "",
	password: "",
	setUsername: function(value) {
		this.username = value
	},
	setPassword: function(value) {
		this.password = value
	},
	canSubmit: function() {
		return this.username !== "" && this.password !== ""
	},
	login: function() {/*...*/},
	view: function() {
		return m(".login", [
			m("input[type=text]", {oninput: m.withAttr("value", this.setUsername.bind(this)), value: this.username}),
			m("input[type=password]", {oninput: m.withAttr("value", this.setPassword.bind(this)), value: this.password}),
			m("button", {disabled: !this.canSubmit(), onclick: this.login}, "Login"),
		])
	}
}
```

Normally, in the context of a larger application, a login component like the one above exists alongside components for user registration and password recovery. Imagine that we want to be able to prepopulate the email field when navigating from the login screen to the registration or password recovery screens (or vice versa), so that the user doesn't need to re-type their email if they happened to fill the wrong page (or maybe you want to bump the user to the registration form if a username is not found).

Right away, we see that sharing the `username` and `password` fields from this component to another is difficult. This is because the fat component encapsulates its our state, which by definition makes this state difficult to access from outside.

It makes more sense to refactor this component and pull the state code out of the component and into the application's data layer. This can be as simple as creating a new module:

```javascript
// models/Auth.js
// PREFER
var Auth = {
	username: "",
	password: "",
	setUsername: function(value) {
		Auth.username = value
	},
	setPassword: function(value) {
		Auth.password = value
	},
	canSubmit: function() {
		return Auth.username !== "" && Auth.password !== ""
	},
	login: function() {/*...*/},
}

module.exports = Auth
```

Then, we can clean up the component:

```javascript
// views/Login.js
// PREFER
var Auth = require("../models/Auth")

var Login = {
	view: function() {
		return m(".login", [
			m("input[type=text]", {oninput: m.withAttr("value", Auth.setUsername), value: Auth.username}),
			m("input[type=password]", {oninput: m.withAttr("value", Auth.setPassword), value: Auth.password}),
			m("button", {disabled: !Auth.canSubmit(), onclick: Auth.login}, "Login"),
		])
	}
}
```

This way, the `Auth` module is now the source of truth for auth-related state, and a `Register` component can easily access this data, and even reuse methods like `canSubmit`, if needed. In addition, if validation code is required (for example, for the email field), you only need to modify `setEmail`, and that change will do email validation for any component that modifies an email field.

As a bonus, notice that we no longer need to use `.bind` to keep a reference to the state for the component's event handlers.

#### Avoid restrictive interfaces

Try to keep component interfaces generic - using `attrs` and `children` directly - unless the component requires special logic to operate on input.

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

If the required attributes are equivalent to generic DOM attributes, it's preferable to allow passing through parameters to a component's root node.

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

#### Don't manipulate `children`

If a component is opinionated in how it applies attributes or children, you should switch to using custom attributes.

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

The component above breaks the assumption that children will be output in the same contiguous format as they are received. It's difficult to understand the component without reading its implementation. Instead, use attributes as named parameters and reserve `children` for uniform child content:

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
m(BetterHeader, {
	title: [
		m("h1", "My title"),
		m("small", "A small note"),
	],
	tagline: m("h2", "Lorem ipsum"),
})
```

#### Define components statically, call them dynamically

##### Avoid creating component definitions inside views

If you create a component from within a `view` method (either directly inline or by calling a function that does so), each redraw will have a different clone of the component. When diffing component vnodes, if the component referenced by the new vnode is not strictly equal to the one referenced by the old component, the two are assumed to be different components even if they ultimately run equivalent code. This means components created dynamically via a factory will always be re-created from scratch.

For that reason you should avoid recreating components. Instead, consume components idiomatically.

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
// calling a second time recreates div from scratch rather than doing nothing
m.render(document.body, m(ComponentFactory("hello")))

// PREFER
var Component = {
	view: function(vnode) {
		return m("div", vnode.attrs.greeting)
	}
}
m.render(document.body, m(Component, {greeting: "hello"}))
// calling a second time does not modify DOM
m.render(document.body, m(Component, {greeting: "hello"}))
```

##### Avoid creating component instances outside views

Conversely, for similar reasons, if a component instance is created outside of a view, future redraws will perform an equality check on the node and skip it. Therefore component instances should always be created inside views:

```javascript
// AVOID
var Counter = {
	count: 0,
	view: function(vnode) {
		return m("div",
			m("p", "Count: " + vnode.state.count ),

			m("button", {
				onclick: function() {
					vnode.state.count++
				}
			}, "Increase count")
		)
	}
}

var counter = m(Counter)

m.mount(document.body, {
	view: function(vnode) {
		return [
			m("h1", "My app"),
			counter
		]
	}
})
```

In the example above, clicking the counter component button will increase its state count, but its view will not be triggered because the vnode representing the component shares the same reference, and therefore the render process doesn't diff them. You should always call components in the view to ensure a new vnode is created:

```javascript
// PREFER
var Counter = {
	count: 0,
	view: function(vnode) {
		return m("div",
			m("p", "Count: " + vnode.state.count ),

			m("button", {
				onclick: function() {
					vnode.state.count++
				}
			}, "Increase count")
		)
	}
}

m.mount(document.body, {
	view: function(vnode) {
		return [
			m("h1", "My app"),
			m(Counter)
		]
	}
})
```
