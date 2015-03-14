## Components

Components are self-contained units of functionality that may hold state and communicate with a larger application via input parameters and events.

In Mithril, components are simply [modules](mithril.module.md). In order to use a module as a component, simply put it in a template:

```javascript
//first declare a component (it's just a module)
var MyComponent = {
	controller: function() {
		this.greeting = "Hello"
	},
	view: function(ctrl) {
		return m("p", ctrl.greeting)
	}
}

//now use it in an app
var MyApp = {
	controller: function() {},
	view: function() {
		return m("div", [
			m("h1", "My app"),
			MyComponent
		])
	}
}

m.module(document.body, MyApp)

/*
<body>
	<h1>My app</h1>
	<p>Hello</p>
</body>
*/
```

Modules can have arguments "preloaded" into them. Calling `m.module` without a DOM element as an argument will create copy of the module with parameters already bound as arguments to the controller and view functions

```javascript
//declare a component
var MyModule = {}
MyModule.controller = function(options, extras) {
	this.greeting = "Hello"
	console.log(options.name, extras)
}
MyModule.view = function(ctrl, options, extras) {
	return m("h1", ctrl.greeting + " " + options.name + " " + extras)
}


//note the lack of a DOM element in the list of parameters
var LoadedModule = m.module(MyModule, {name: "world"}, "this is a test")

var ctrl = new LoadedModule.controller() // logs "world", "this is a test"

m.render(document.body, LoadedModule.view(ctrl))

//<body><h1>Hello world this is a test</h1></body>
```

This way, we can create parameterized modules that look similar to regular virtual elements:

```javascript
var MyApp = {
	controller: function() {},
	view: function() {
		return m("div", [
			m("h1", "My app"),
			
			//a parameterized module
			m.module(MyModule, {name: "users"}, "from component"),
		])
	}
}

m.module(document.body, MyApp)

/*
<body>
	<h1>My app</h1>
	<h1>Hello users from component</h1>
</body>
*/
```

Since m.module can take any number of arguments, components also support more complex signatures if needed.

Note that adding a `key` property in the list of attributes (`{name: "users"}` above) will propagate this key to the root element of the component's template even if you don't manually do so. This allows all components to be identifiable without intervention from component authors.

---

### Dealing with state

#### Stateless components

Controllers receive arguments passed to the `m.module` call, but this does not mean controllers are a necessary middle man in a component.

Instead of copying arguments to the controller object, and then passing the controller object to the view, it is often desirable that views always update based on the most current list of arguments being passed to a component.

The following example illustrates this pattern:

```javascript
var MyApp = {
	controller: function() {
		this.temp = m.prop(10) //kelvin
	},
	view: function(ctrl) {
		return m("div", [
			m("input", {oninput: m.withAttr("value", ctrl.temp), value: ctrl.temp()}), "K",
			m("br"),
			m.module(TemperatureConverter, {value: ctrl.temp()})
		]);
	}
};
var TemperatureConverter = {
	controller: function() {
		//note how the controller does not handle the input arguments
		
		//define some helper functions to be called from the view
		this.kelvinToCelsius = function(value) {
			return value - 273.15
		}
		this.kelvinToFahrenheit = function() {
			return (value 9 / 5 * (v - 273.15)) + 32
		}
	},
	view: function(ctrl, options) {
		return m('div', [
			"celsius:", ctrl.kelvinToCelsius(options.value),
			m("br"),
			"fahrenheit:", ctrl.kelvinToFahrenheit(options.value),
		]);
	}
};
m.module(document.body, MyApp);
```

Here, the temperature value from the input is passed to the TemperatureConverter view directly, and transformation functions are called from there. This should be the preferred pattern for components that display data that is always derived from the most current input.

#### Parameterized initial state

The ability to handle arguments in the controller is useful for setting up the initial state for a component whose state depends on input data:

```javascript
var MyComponent = {
	controller: function(args) {
		//we only want to make this call once
		this.things = m.request({method: "GET", url: "/api/things/", {data: args}}) //slice the data in some way
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

#### Data-driven component identity

A component can be re-initialized from scratch by changing the `key` associated with it. This is useful for re-running ajax calls for different model entities.

```javascript
var people = [
	{id: 1, name: "John"},
	{id: 2, name: "Mary"}
]

//ajax and display a list of projects for John
m.render(document.body, m.module(ProjectList, {key: people[0].id, value: people[0]})

//ajax and display a list of projects for Mary
//here, since the key is different, the ProjectList component is recreated from scratch, which runs the controller, re-generates the DOM, and re-initializes any applicable 3rd party plugins in configs
m.render(document.body, m.module(ProjectList, {key: people[1].id, value: people[1]})
```

Note that the rules for keys apply for components the same way they do for regular elements: it is not allowed to have duplicate keys as children of the same parent, and they must be either strings or numbers (or something with a `.toString()` implementation that makes the entity locally uniquely identifiable when serialized).

---

### Unloading components

Modules declared in templates can also call `onunload` and its `e.preventDefault()` like regular modules. The `onunload` event is called if an instantiated module is removed from a virtual element tree via a redraw.

In the example below, clicking the button triggers the component's `onunload` event and logs "unloaded!".

```javascript
var MyApp = {
	controller: function() {
		this.loaded = true
	},
	view: function(ctrl) {
		return [
			m("button[type=button]", {onclick: function() {ctrl.loaded = false}}),
			ctrl.loaded ? m.module(MyComponent) : ""
		])
	}
}

var MyComponent = {
	controller: function() {
		this.onunload = function() {
			console.log("unloaded!")
		}
	},
	view: function() {
		return m("h1", "My component")
	}
}

m.module(document.body, MyApp)
```

---

### Asynchronous components

Since components are Mithril modules, it's possible to encapsulate asynchronous behavior. Under regular circumstances, Mithril waits for all asynchronous tasks to complete, but when using components, a component's parent view renders before the component completes its asynchronous tasks (because the existence of the component only becomes known to the diff engine at the time when the template is rendered).

When a component has asynchronous payloads and they are queued by the [auto-redrawing system](auto-redrawing.md), its view is NOT rendered until all asynchronous operations complete. When the component's asynchronous operations complete, another redraw is triggered and the entire template tree is evaluated again. This means that the virtual dom tree may take two or more redraws (depending on how many nested asynchronous components there are) to be fully rendered.

For this reason, it's recommended to refactor code in such a way that asynchronous operations happen in the root module and avoid making AJAX calls within components.

---

### Component limitations and caveats

There are a few caveats to using modules as components:

1 - component views must return a virtual element. Returning an array, a string, a number, boolean, falsy value, etc will result in an error. This limitation exists in order to support the correctness of unloading semantics component identity.

2 - components cannot change `m.redraw.strategy` from the controller constructor (but they can from event handlers).


