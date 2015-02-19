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

### Component limitations

There are a few caveats to using modules as components:

1 - component views must return a virtual element. Returning an array, a string, a number, boolean, falsy value, etc will result in an error. This limitation exists in order to support the correctness of unloading semantics component identity.

2 - components cannot change `m.redraw.strategy` from the controller constructor (but they can from event handlers).


