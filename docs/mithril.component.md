## m.component

---

Components are the building blocks of Mithril applications: they allow developers to encapsulate functionality into reusable units.

---

### Rendering components

Components are nothing more than objects that have a `controller` and a `view` functions.

There are three ways to render a component: via [`m.route`](mithril.route.md) (if you are building a single-page application that has multiple pages), [`m.mount`](mithril.mount.md) (if your app only has one page), and [`m.render`](mithril.render.md) (if you are integrating Mithril's rendering engine into a larger framework and wish to manage redrawing yourself).

In addition, you can pass a controller/view pair to `m.component` to create a factory function. This factory allows you to create parameterized components.

At first glance, the technical description of these APIs may seem daunting, but in practice, rendering a typical component is simple:

```javascript
var MyComponent = m.component({
	controller: function() {
		return {greeting: "Hello"}
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
})

m.mount(document.body, MyComponent()) // renders <h1>Hello</h1>
```

When a component runs, the corresponding controller function is called. When the controller finishes running, the view function is called, and the return value of the controller is passed as the first argument to it.

Note that controllers are optional. If a controller function is not defined, an empty object is passed to the view function as its first argument.

The return value of the view function is NOT a DOM element. Rather, it's a Javascript data structure that represents a DOM tree. Internally, Mithril uses this data representation of the DOM to probe for data changes and update the DOM only where necessary. This rendering technique is known as *virtual DOM diffing*.

Later, any time event handlers are triggered by user input (or any time a redraw is required), the view function is run again and its return value is used to diff against the previous virtual DOM tree.

It may sound expensive to recompute an entire view any time there's a change to be displayed, but this operation actually turns out to be quite fast, compared to rendering strategies used by older frameworks. Mithril's diffing algorithm makes sure expensive DOM operations are only performed if absolutely necessary, and as an extra benefit, the global nature of the redraw makes it easy to reason about and troubleshoot the state of the application.

Within components, controllers are meant to be used to call model layer methods. Views consume model data (via the function's argument list), and call controller methods in response to user events.

---

### Parameterized components

Components can receive parameters when run

```javascript
//declare a component
var MyComponent = m.component({
	controller: function(args, extras) {
		console.log(args.name, extras)
		return {greeting: "Hello"}
	},
	view: function(ctrl, args, extras) {
		return m("h1", ctrl.greeting + " " + args.name + " " + extras)
	}
})


var component = MyComponent({name: "world"}, "this is a test")

var ctrl = new component.controller() // logs "world", "this is a test"

m.render(document.body, component.view(ctrl)) // render the virtual DOM tree manually

//<body><h1>Hello world this is a test</h1></body>
```

When designing components, the first parameter should be an object (e.g. `{name: "world"}`, above). Subsequent parameters have no restrictions (e.g. `"this is a test"`)

---

### Nesting components

Component views can include other components:

```javascript
var App = m.component({
	view: function() {
		return m(".app", [
			m("h1", "My App"),
			
			//nested component
			MyComponent({message: "Hello"})
		])
	}
})

var MyComponent = m.component({
	controller: function(args) {
		return {greeting: args.message}
	},
	view: function(ctrl) {
		return m("h2", ctrl.greeting)
	}
})

m.mount(document.body, App())

// <div class="app">
// 	 <h1>My App</h1>
// 	 <h2>Hello</h2>
// </div>
```

Components can be placed anywhere a regular element would. If you have components inside of a sortable list, you can - and should - add `key` attributes to your components to ensure that DOM elements are merely moved, if possible, instead of being recreated from scratch:

```javascript
var App = m.component({
	ctrl: function() {
		return {data: [1, 2, 3]}
	}
	view: function(ctrl) {
		return m(".app", [
			//pressing the button reverses the list
			m("button[type=button]", {onclick: function() {ctrl.data.reverse()}}, "My App"),
			
			ctrl.data.map(function(item) {
				//the key ensures the components aren't recreated from scratch, if they merely exchanged places
				return MyComponent({message: "Hello " + item, key: item})
			})
		])
	}
})

var MyComponent = m.component({
	controller: function(args) {
		return {greeting: args.message}
	},
	view: function(ctrl) {
		return m("h2", ctrl.greeting)
	}
})

m.mount(document.body, App())
```

Keys must be unique within a list of sibling DOM elements, and they must be either a string or a number.

---

### Dealing with state

#### Stateless components

A component is said to be stateless when it does not store data internally. Instead, it's composed of [pure functions](http://en.wikipedia.org/wiki/Pure_function). It's a good practice to make components stateless because they are more predictable, and easier to reason about, test and troubleshoot.

Instead of copying arguments to the controller object (thereby creating internal state in the component), and then passing the controller object to the view, it is often desirable that views always update based on the most current list of arguments being passed to a component.

The following example illustrates this pattern:

```javascript
var MyApp = m.component({
	controller: function() {
		return {
			temp: m.prop(10) // kelvin
		}
	},
	view: function(ctrl) {
		return m("div", [
			m("input", {oninput: m.withAttr("value", ctrl.temp), value: ctrl.temp()}), "K",
			m("br"),
			TemperatureConverter({value: ctrl.temp()})
		]);
	}
});
var TemperatureConverter = m.component({
	controller: function() {
		//note how the controller does not handle the input arguments

		//define some helper functions to be called from the view
		return {
			kelvinToCelsius: function(value) {
				return value - 273.15
			},
			kelvinToFahrenheit: function(value) {
				return (value 9 / 5 * (v - 273.15)) + 32
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
});
m.mount(document.body, MyApp());
```

In the example above, the text input is bi-directionally bound to a `temp` getter-setter. Changing the temperature value from the input updates the temperature value, which is passed to the TemperatureConverter view directly, and transformation functions are called from there. The TemperatureConverter controller never stores the value.

Testing the various parts of the component is trivial:

```javascript
//test a transformation function in the controller
var ctrl = new TemperatureConverter();
assert(ctrl.kelvinToCelsius(273.15) == 0)

//test the template
var tpl = TemperatureConverter.view(null, {value: 273.15})
assert(tpl.children[1] == 0)

//test with real DOM
var testRoot = document.createElement("div")
m.render(testRoot, TemperatureConverter.view(null, {value: 273.15}))
assert(testRoot.innerHTML.indexOf("celsius:0") > -1)
```

Note that the sample component above is illustrative. Ideally, temperature conversion functions (and any functions that deal strictly within the domain of the data) should go in the model layer, not in a component's controller.

---

### Stateful components

Usually it's recommended that you store application state outside of components (either in a view-model or at the top-level component). Components *can* be stateful, but the purpose of component state is to prevent the pollution of the model layer with aspects that are inherently about the component. For example, an autocompleter component may need to internally store a flag to indicate whether the dropdown is visible, but this kind of state is not relevant to an application's business logic.

You may also elect to use component state for application state that is not meaningful outside the scope of a single component. For example, you might have a `UserForm` component that lives alongside other unrelated components on a bigger page, but it probably doesn't make sense for the parent page to be aware of the unsaved user entity stored within the `UserForm` component.

---

#### Parameterized initial state

The ability to handle arguments in the controller is useful for setting up the initial state for a component whose state depends on input data:

```javascript
var MyComponent = {
	controller: function(args) {
		//we only want to make this call once
		return {
			things: m.request({method: "GET", url: "/api/things/", {data: args}}) //slice the data in some way
		}
	},
	view: function(ctrl) {
		return m("ul", [
			ctrl.things().map(function(name) {
				return m("li", thing.name)
			})
		]);
	}
};
```

However, it's recommended that you aggregate all of your requests in a single place instead of scattering them across multiple components. Aggregating requests in a top-level component makes it easier to replay the request chain (for example, you may need to fetch an updated list of items after you've saved something related to it) and it ensures the entire data set is loaded in memory before drilling down into the components (thus preventing the need for redundant AJAX calls for sibling components that need the same data). Be sure to read the [Application Architecture section](components.md#application-architecture-with-components) to learn more about organizing componentized code.

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
m.render(document.body, ProjectList({key: people[0].id, value: people[0]})

//ajax and display a list of projects for Mary
m.render(document.body, ProjectList({key: people[1].id, value: people[1]})
```

In the example above, since the key is different, the ProjectList component is recreated from scratch. As a result, the controller runs again, the DOM is re-generated, and any applicable 3rd party plugins in configs are re-initialized.

Remember that the rules for keys apply for components the same way they do for regular elements: it is not allowed to have duplicate keys as children of the same parent, and they must be either strings or numbers (or something with a `.toString()` implementation that makes the entity locally uniquely identifiable when serialized). You can learn more about keys [here](mithril.md#dealing-with-focus)

---

### Unloading components

If a component's controller contains an function called `onunload`, it will be called when a new `m.mount` call updates the root DOM element tied to the component in question, or  when a route changes (if you are using [`m.route`](mithril.route.md)).

```javascript
var MyComponent = m.component({
	controller: function() {
		return {
			onunload = function() {
				console.log("unloading my component");
			}
		}
	},
	view: function() {
		return m("div", "test")
	};
});

m.mount(document, MyComponent());



var AnotherComponent = m.component({
	view: function() {
		return m("div", "another")
	}
});

m.mount(document, AnotherComponent()); // logs "unloading my component"
```

This mechanism is useful to clear timers and unsubscribe event handlers.

You can also use this event to prevent a component from being unloaded in the context of a route change (e.g. to alert a user to save their changes before navigating away from a page)

```javascript
var component = m.component({
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
})
```

Normally, calling `m.mount` will return the controller instance for that component, but there's one corner case: if `e.preventDefault()` is called from a controller's `onunload` method, then the `m.mount` call will not instantiate the new controller, and will return `undefined`.

To unload a component without loading another component, you can simply call `m.mount` with a `null` as the component parameter:

```javascript
m.mount(rootElement, null);
```

Mithril does not hook into the browser's `onbeforeunload` event. To prevent unloading when attempting to navigate away from a page, you can check the return value of `m.mount`

```javascript
window.onbeforeunload = function() {
	if (!m.mount(rootElement, null)) {
		//onunload's preventDefault was called
		return "Are you sure you want to leave?"
	}
}
```

Components that are nested in other components can also call `onunload` and its `e.preventDefault()` like top-level components. The `onunload` event is called if an instantiated component is removed from a virtual element tree via a redraw.

In the example below, clicking the button triggers the component's `onunload` event and logs "unloaded!".

```javascript
var MyApp = m.component({
	controller: function() {
		return {loaded: true}
	},
	view: function(ctrl) {
		return [
			m("button[type=button]", {onclick: function() {ctrl.loaded = false}}),
			ctrl.loaded ? MyComponent() : ""
		]
	}
})

var MyComponent = m.component({
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
})

m.mount(document.body, MyApp())
```

Calling `e.preventDefault()` from a component's `onunload` aborts route changes, but it does not abort, rollback or affect the current redraw in any way.

---

### Nested asynchronous components

Since controllers can call model methods, it's possible for nested components to encapsulate asynchronous behavior. When components aren't nested, Mithril waits for all asynchronous tasks to complete, but when nesting components, a component's parent view renders before the component completes its asynchronous tasks (because the existence of the component only becomes known to the diff engine at the time when the template is rendered).

When a component has asynchronous payloads and they are queued by the [auto-redrawing system](auto-redrawing.md), its view is NOT rendered until all asynchronous operations complete. When the component's asynchronous operations complete, another redraw is triggered and the entire template tree is evaluated again. This means that the virtual dom tree may take two or more redraws (depending on how many nested asynchronous components there are) to be fully rendered.

There are [different ways to organize components](#application-architecture-with-components) that can side-step the need for multiple redraws (although you could still force multiple redraws to happen by using the [`background`](mithril.request.md#rendering-before-web-service-requests-finish) and `initialValue` options in `m.request`.)

---

### Nested component limitations and caveats

There are a few caveats when nesting components:

1.	Nested component views must return either a virtual element or another component. Returning an array, a string, a number, boolean, falsy value, etc will result in an error.

2.	Nested components cannot change `m.redraw.strategy` from the controller constructor (but they can from event handlers). It's recommended that you use the [`ctx.retain`](mithril.md#persising-dom-elements-across-route-changes) flag instead of changing the redraw strategy in controller constructors.

---

### Constructors as controllers

If a component controller does not return an object to be passed to the view, it uses `this` as the controller return value:

```javascript
var MyComponent = m.component({
	controller: function() {
		return {greeting: "Hello"}
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
})

m.mount(document.body, MyComponent()) // <h1>Hello</h1>
```

---

### Opting out of the auto redrawing system

Components can be rendered without enabling the [auto-redrawing system](auto-redrawing.md), via [`m.render`](mithril.render.md):

```javascript
var MyComponent = m.component({
	controller: function() {
		return {greeting: "Hello"}
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
})

m.render(document.body, MyComponent())
```

However, using [`m.render`](mithril.render.md) is only recommended if you want to use Mithril as part of a larger framework that manages the rendering lifecycle on its own. The vast majority of times, it's advisable to use `m.mount` instead.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
ComponentFactory component(Component component)

where:
	Component :: Object { Controller, View }
	Controller :: SimpleController | UnloadableController
	SimpleController :: void controller([Object attributes [, any... args]])
	UnloadableController :: void controller([Object attributes [, any... args]]) { prototype: void unload(UnloadEvent e) }
	UnloadEvent :: Object {void preventDefault()}
	View :: void view(Object controllerInstance [, Object attributes [, any... args]])
	ComponentFactory :: Component factory([Object attributes [, any... args]])
```

-	**Component component**

	A component is supposed to be an Object with two keys: `controller` and `view`. Each of those should point to a Javascript function

-	**returns ComponentFactory factory**

	A function that returns a component. Arguments passed into this function are applied to the argument list of the controller and view functions of the component.

