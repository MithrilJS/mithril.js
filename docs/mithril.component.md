## m.component

---

- [Rendering components](#rendering-components)
	- [Optional controller](#optional-controller)
	- [Controller as a class constructor](#controller-as-a-class-constructor)
	- [Notes on the view function](#notes-on-the-view-function)
	- [Shorthand syntax](#shorthand-syntax)
- [Parameterized components](#parameterized-components)
- [Nesting components](#nesting-components)
- [Dealing with state](#dealing-with-state)
	- [Stateless components](#stateless-components)
	- [Stateful components](#stateful-components)
	- [Parameterized initial state](#parameterized-initial-state)
- [Data-driven component identity](#data-driven-component-identity)
- [Unloading/Unmounting components](#unloading-components)
- [Nested asynchronous components](#nested-asynchronous-components)
- [Limitations and caveats](#limitations-and-caveats)
- [Opting out of the auto redrawing system](#opting-out-of-the-auto-redrawing-system)
- [Signature](#signature)

---

Components are building blocks for Mithril applications. They allow developers to encapsulate functionality into reusable units.

---

### Rendering components

In Mithril, a component is nothing more than an object that has a `view` function and, optionally, a `controller` function.

```javascript
var MyComponent = {
	controller: function(data) {
		return {greeting: "Hello"}
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
}

m.mount(document.body, MyComponent) // renders <h1>Hello</h1> into <body>
```

The optional `controller` function creates an object that may be used in the following recommended ways:

- It can contain methods meant to be called by a `view`.
- It can call model methods directly or from methods inside the resulting object.
- It can store contextual data returned from model methods (i.e. a [promise](mithril.deferred.md) from a [request](mithril.request.md)).
- It can hold a reference to a view model.

The `view` has access to methods and properties that the controller chooses to expose in the returned object. With those methods and properties, it creates a template that can consume model data and call controller methods to affect the model. This is the recommended way for views and models to exchange data.

```javascript
//a simple MVC example

//a sample model that exposes a value
var model = {count: 0}

var MyComponent = {
	controller: function(data) {
		return {
			increment: function() {
				//This is a simplication for the sake of the example.
				//Typically, values are modified via model methods,
				//rather than modified directly
				model.count++
			}
		}
	},
	view: function(ctrl) {
		return m("a[href=javascript:;]", {
			onclick: ctrl.increment //view calls controller method on click
		}, "Count: " + model.count)
	}
}

m.mount(document.body, MyComponent)

//renders:
//<a href="javascript:;">Count: 0</a>
//
//the number increments when the link is clicked
```

Note that there is no requirement to tightly couple a controller and view while organizing code. It's perfectly valid to define controllers and views separately, and only bring them together when mounting them:

```javascript
//controller.js
var controller = function(data) {
	return {greeting: "Hello"}
}

//view.js
var view = function(ctrl) {
	return m("h1", ctrl.greeting)
}

//render
m.mount(document.body, {controller: controller, view: view}) // renders <h1>Hello</h1>
```

There are three ways to render a component:

- [`m.route`](mithril.route.md) (if you are building a single-page application that has multiple pages)
- [`m.mount`](mithril.mount.md) (if your app only has one page)
- [`m.render`](mithril.render.md) (if you are integrating Mithril's rendering engine into a larger framework and wish to manage redrawing yourself).

The `controller` function is called *once* when the component is rendered. Subsequently, the `view` function is called and will be called again anytime a redraw is required. The return value of the `controller` function is passed to the `view` as its first argument.

#### Optional controller

The `controller` function is optional and defaults to an empty function   `controller: function() {}`

```javascript
//a component without a controller
var MyComponent = {
	view: function() {
		return m("h1", "Hello")
	}
}

m.mount(document.body, MyComponent) // renders <h1>Hello</h1>
```

#### Controller as a class constructor

A controller can also be used as a class constructor (i.e. it's possible to attach properties to the `this` object within the constructor, instead of returning a value).

```javascript
var MyComponent = {
	controller: function(data) {
		this.greeting = "Hello"
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
}

m.mount(document.body, MyComponent) // renders <h1>Hello</h1>
```

#### Notes on the view function

The `view` function does not create a DOM tree when called. The return value of the view function is merely a plain Javascript data structure that represents a DOM tree. Internally, Mithril uses this data representation of the DOM to probe for data changes and update the DOM only where necessary. This rendering technique is known as *virtual DOM diffing*.

The view function is run again whenever a redraw is required (i.e. whenever event handlers are triggered by user input). Its return value is used to diff against the previous virtual DOM tree.

It may sound expensive to recompute an entire view any time there's a change to be displayed, but this operation actually turns out to be quite fast, compared to rendering strategies used by older frameworks. Mithril's diffing algorithm makes sure expensive DOM operations are performed only if absolutely necessary, and as an extra benefit, the global nature of the redraw makes it easy to reason about and troubleshoot the state of the application.

### Shorthand syntax

If the first argument to `m()` is a component, it acts as an alias of `m.component()`

```javascript
var MyComponent = {
	controller: function() {
		return {greeting: "hello"}
	},
	view: function(ctrl, args) {
		return m("h1", ctrl.greeting + " " + args.data)
	}
}

m.render(document.body, [
	//the two lines below are equivalent
	m(MyComponent, {data: "world"}),
	m.component(MyComponent, {data: "world"})
])
```

---

### Parameterized components

Components can have arguments "preloaded". In practice, this means that calling `m.component(MyComponent, {foo: "bar"})` will return a component that behaves exactly the same as `MyComponent`, but `{foo: "bar"}` will be bound as an argument to both the `controller` and `view` functions.

```javascript
//declare a component
var MyComponent = {
	controller: function(args, extras) {
		console.log(args.name, extras)
		return {greeting: "Hello"}
	},
	view: function(ctrl, args, extras) {
		return m("h1", ctrl.greeting + " " + args.name + " " + extras)
	}
}

//create a component whose controller and view functions receive some arguments
var component = m.component(MyComponent, {name: "world"}, "this is a test")

var ctrl = new component.controller() // logs "world", "this is a test"

m.render(document.body, component.view(ctrl)) // render the virtual DOM tree manually

//<body><h1>Hello world this is a test</h1></body>
```

The first parameter after the component object is meant to be used as an attribute map and should be an object (e.g. `{name: "world"}`). Subsequent parameters have no restrictions (e.g. `"this is a test"`)

---

### Nesting components

Component views can include other components:

```javascript
var App = {
	view: function() {
		return m(".app", [
			m("h1", "My App"),

			//nested component
			m.component(MyComponent, {message: "Hello"})
		])
	}
}

var MyComponent = {
	controller: function(args) {
		return {greeting: args.message}
	},
	view: function(ctrl) {
		return m("h2", ctrl.greeting)
	}
}

m.mount(document.body, App)

// <div class="app">
// 	 <h1>My App</h1>
// 	 <h2>Hello</h2>
// </div>
```

Components can be placed anywhere a regular element can. If you have components inside a sortable list, you should add `key` attributes to your components to ensure that DOM elements are not recreated from scratch, but merely moved when possible. Keys must be unique within a list of sibling DOM elements, and they must be either a string or a number:

```javascript
var App = {
	controller: function() {
		return {data: [1, 2, 3]}
	},
	view: function(ctrl) {
		return m(".app", [
			//pressing the button reverses the list
			m("button[type=button]", {onclick: function() {ctrl.data.reverse()}}, "My App"),

			ctrl.data.map(function(item) {
				//the key ensures the components aren't recreated from scratch, if they merely exchanged places
				return m.component(MyComponent, {message: "Hello " + item, key: item})
			})
		])
	}
}

var MyComponent = {
	controller: function(args) {
		return {greeting: args.message}
	},
	view: function(ctrl) {
		return m("h2", ctrl.greeting)
	}
}

m.mount(document.body, App)
```

### Dealing with state

#### Stateless components

A component is said to be stateless when it does not store data internally. Instead, it's composed of [pure functions](http://en.wikipedia.org/wiki/Pure_function). It's a good practice to make components stateless because they are more predictable, and easier to reason about, test and troubleshoot.

Instead of copying arguments to the controller object and then passing the controller object to the view (thereby creating internal state in the component), it is often desirable that views update based on the current value of arguments initially passed to a component.

The following example illustrates this pattern:

```javascript
var MyApp = {
	controller: function() {
		return {
			temp: m.prop(10) // kelvin
		}
	},
	view: function(ctrl) {
		return m("div", [
			m("input", {oninput: m.withAttr("value", ctrl.temp), value: ctrl.temp()}), "K",
			m("br"),
			m.component(TemperatureConverter, {value: ctrl.temp()})
		]);
	}
};
var TemperatureConverter = {
	controller: function() {
		//note how the controller does not handle the input arguments

		//define some helper functions to be called from the view
		return {
			kelvinToCelsius: function(value) {
				return value - 273.15
			},
			kelvinToFahrenheit: function(value) {
				return (9 / 5 * (value - 273.15)) + 32
			}
		}
	},
	view: function(ctrl, args) {
		return m('div', [
			"celsius:", ctrl.kelvinToCelsius(args.value),
			m("br"),
			"fahrenheit:", ctrl.kelvinToFahrenheit(args.value),
		]);
	}
};
m.mount(document.body, MyApp);
```

In the example above, the text input is bi-directionally bound to a `temp` getter-setter. Changing the temperature value from the input updates the temperature value, which is passed to the TemperatureConverter view directly, and transformation functions are called from there. The TemperatureConverter controller never stores the value.

Testing the various parts of the component is trivial:

```javascript
//test a transformation function in the controller
var ctrl = new TemperatureConverter.controller();
assert(ctrl.kelvinToCelsius(273.15) == 0)

//test the template
var tpl = TemperatureConverter.view(ctrl, {value: 273.15})
assert(tpl.children[1] == 0)

//test with real DOM
var testRoot = document.createElement("div")
m.render(testRoot, TemperatureConverter.view(ctrl, {value: 273.15}))
assert(testRoot.innerHTML.indexOf("celsius:0") > -1)
```

Note that the sample component above is illustrative. Ideally, temperature conversion functions (and any functions that deal strictly within the domain of the data) should go in the model layer, not in a component's controller.

---

### Stateful components

Usually it's recommended that you store application state outside of components (either in a [view-model](http://lhorie.github.io/mithril-blog/what-is-a-view-model.html) or in the top-level component in the case of nested components). Components *can* be stateful, but the purpose of component state is to prevent the pollution of the model layer with aspects that are inherently related to the component. For example, an autocompleter component may need to internally store a flag to indicate whether the dropdown is visible, but this kind of state is not relevant to an application's business logic.

You might also elect to maintain component state when it's not meaningful outside the scope of a single component. For example, you might have a `UserForm` component that lives alongside other unrelated components on a bigger page, but it probably doesn't make sense for the parent page to be aware of the unsaved user data stored within the `UserForm` component.

---

#### Parameterized initial state

The ability to handle arguments in the controller is useful for setting up the initial state for a component whose state depends on input data:

```javascript
var MyComponent = {
	controller: function(args) {
		//we only want to make this call once
		return {
			things: m.request({method: "GET", url: "/api/things/", data: args}) //slice the data in some way
		}
	},
	view: function(ctrl) {
		return m("ul", [
			ctrl.things().map(function(thing) {
				return m("li", thing.name)
			})
		]);
	}
};
```

However, it's recommended that you aggregate all of your requests in a single place instead of scattering them across multiple components. Aggregating requests in a top-level component makes it easier to replay the request chain (i.e. fetching an updated list of items after you've saved something that changes that list), and it ensures the entire data set is loaded in memory before drilling down into nested components, avoiding redundant AJAX calls for sibling components that need the same data. Be sure to read the [Application Architecture section](components.md#application-architecture-with-components) to learn more about organizing componentized code.

---

#### Data-driven component identity

A component can be re-initialized from scratch by changing the `key` associated with it. This is useful for re-running ajax calls for different model entities.

Suppose we have a component called `ProjectList` and the following data:

```javascript

var people = [
	{id: 1, name: "John"},
	{id: 2, name: "Mary"}
]

//ajax and display a list of projects for John
m.render(document.body, m(ProjectList, {key: people[0].id, value: people[0]}))

//ajax and display a list of projects for Mary
m.render(document.body, m(ProjectList, {key: people[1].id, value: people[1]}))
```

In the example above, since the key is different, the ProjectList component is recreated from scratch. As a result, the controller runs again, the DOM is re-generated, and any applicable 3rd party plugins in configs are re-initialized.

Remember that the rules for keys apply to components the same way they do to regular elements: it is not allowed to have duplicate keys on children of the same parent, and they must be either strings or numbers (or something with a `.toString()` implementation that makes the entity uniquely identifiable in the local scope when serialized). You can learn more about keys [here](mithril.md#dealing-with-focus).

---

### Unloading components

If a component's controller contains the function `onunload`, it will be called under one of these circumstances:

- when a new call to `m.mount` updates the root DOM element of the component in question
- when a route changes (if you are using [`m.route`](mithril.route.md))

To unload/unmount a component without loading another component, you can simply call `m.mount` with a `null` as the component parameter:

```javascript
m.mount(rootElement, null);
```

Often, you will want to do some work before the component is unloaded (i.e. clear timers or unsubscribe event handlers):

```javascript
var MyComponent = {
	controller: function() {
		return {
			onunload: function() {
				console.log("unloading my component");
			}
		}
	},
	view: function() {
		return m("div", "test")
	}
};

m.mount(document.body, MyComponent);

//...

var AnotherComponent = {
	view: function() {
		return m("div", "another")
	}
};

// mount on the same DOM element, replacing MyComponent
m.mount(document.body, AnotherComponent); // logs "unloading my component"
```

You can also use the `onunload` function to PREVENT a component from being unloaded in the context of a route change (i.e. to alert a user to save their changes before navigating away from a page)

```javascript
var component = {
	controller: function() {
		var unsaved = m.prop(false)
		return {
			unsaved: unsaved,

			onunload: function(e) {
				if (unsaved()) {
					e.preventDefault()
				}
			}
		}
	},
	//...
}
```

Normally, calling `m.mount` will return the controller instance for that component, but there's one corner case: if `e.preventDefault()` is called from a controller's `onunload` method, then the `m.mount` call will not instantiate the new controller, and will return `undefined`.

Mithril does not hook into the browser's `onbeforeunload` event. To prevent unloading when attempting to navigate away from a page, you can check the return value of `m.mount`

```javascript
window.onbeforeunload = function() {
	if (!m.mount(rootElement, null)) {
		//onunload's preventDefault was called
		return "Are you sure you want to leave?"
	}
}
```

Components that are nested inside other components can also call `onunload` and its `e.preventDefault()` like top-level components. The `onunload` event is called if an instantiated component is removed from a virtual element tree via a redraw.

In the example below, clicking the button triggers the component's `onunload` event and logs "unloaded!".

```javascript
var MyApp = {
	controller: function() {
		return {loaded: true}
	},
	view: function(ctrl) {
		return [
			m("button[type=button]", {onclick: function() {ctrl.loaded = false}}),
			ctrl.loaded ? MyComponent : ""
		]
	}
}

var MyComponent = {
	controller: function() {
		return {
			onunload: function() {
				console.log("unloaded!")
			}
		}
	},
	view: function() {
		return m("h1", "My component")
	}
}

m.mount(document.body, MyApp)
```

Calling `e.preventDefault()` from a component's `onunload` function aborts route changes, but it does not abort rollback or affect the current redraw in any way.

---

### Nested asynchronous components

Since controllers can call model methods, it's possible for nested components to encapsulate asynchronous behavior. When components aren't nested, Mithril waits for all asynchronous tasks to complete, but when components are nested, a component's parent view renders before the component completes its asynchronous tasks. The existence of the component only becomes known to the diff engine at the time when the template is rendered.

When a component has asynchronous payloads and they are queued by the [auto-redrawing system](auto-redrawing.md), its view is NOT rendered until all asynchronous operations complete. When the component's asynchronous operations complete, another redraw is triggered and the entire template tree is evaluated again. This means that the virtual dom tree may take two or more redraws (depending on how many nested asynchronous components there are) to be fully rendered.

There are [different ways to organize components](components.md#application-architecture-with-components) that can side-step the need for multiple redraws. Regardless, you could also force multiple redraws to happen by using the [`background`](mithril.request.md#rendering-before-web-service-requests-finish) and `initialValue` options in `m.request`, or by manually calling [`m.redraw()`](mithril.redraw.md).

If a component A contains another component B that calls asynchronous services, when component A is rendered, a `<placeholder>` tag is rendered in place of component B until B's asynchronous services resolve. Once resolved, the placeholder is replaced with component B's view.

---

### Limitations and caveats

One important limitation to be aware of when using components is that you cannot call Mithril's redrawing methods ([`m.startComputation` / `m.endComputation`](mithril.computation.md) and [`m.redraw`](mithril.redraw.md)) from templates.

In addition, you cannot call `m.request` from templates. Doing so will trigger another redraw, which will result in an infinite loop.

There are a few other technical caveats when nesting components:

1.	Nested component views must return either a virtual element or another component. Returning an array, a string, a number, boolean, falsy value, etc will result in an error.

2.	Nested components cannot change `m.redraw.strategy` from the controller constructor (but they can from event handlers). It's recommended that you use the [`ctx.retain`](mithril.md#persisting-dom-elements-across-route-changes) flag instead of changing the redraw strategy in controller constructors.

3.	The root DOM element in a component's view must not be changed during the lifecycle of the component, otherwise undefined behavior will occur. In other words, don't do this:

	```javascript
	var MyComponent = {
		view: function() {
			return someCondition ? m("a") : m("b")
		}
	}
	```

4.	If a component's root element is a subtree directive on its first rendering pass, undefined behavior will occur.

---

### Opting out of the auto redrawing system

Components can be rendered without enabling the [auto-redrawing system](auto-redrawing.md), via [`m.render`](mithril.render.md):

```javascript
var MyComponent = {
	controller: function() {
		return {greeting: "Hello"}
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
}

m.render(document.body, MyComponent)
```

However, using [`m.render`](mithril.render.md) is only recommended if you want to use Mithril as part of a larger framework that manages the rendering lifecycle on its own. The vast majority of times, it's advisable to use `m.mount` instead.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Component component(Component component [, Object attributes [, any... args]])

where:
	Component :: Object { Controller, View }
	Controller :: SimpleController | UnloadableController
	SimpleController :: void controller([Object attributes [, any... args]])
	UnloadableController :: void controller([Object attributes [, any... args]]) { prototype: void unload(UnloadEvent e) }
	UnloadEvent :: Object {void preventDefault()}
	View :: void view(Object controllerInstance [, Object attributes [, any... args]])
```

-	**Component component**

	A component is supposed to be an Object with two keys: `controller` and `view`. Each of these should point to a Javascript function. If a controller is not specified, Mithril will automatically create an empty controller function.

-	**Object attributes**

	A key/value map of attributes that gets bound as an argument to both the `controller` and `view` functions of the component.

-	**any... args**

	Other arguments to be bound as arguments to both the `controller` and `view` functions

-	**returns Component parameterizedComponent**

	A component with arguments bound
