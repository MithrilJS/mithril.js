## m.module

---

- [Rendering modules](#rendering-modules)
- [Using controllers as factories](#using-controllers-as-factories)
- [Parameterized modules](#parameterized modules)
- [Unloading modules](#unloading-modules)
- [Using modules as components](#using-modules-as-components)
- [Unloading components](#unloading-components)
- [Component limitations](#component limitations)

---

A module is an Object with two keys: `controller` and `view`. Each of those should point to a Javascript function. Note that the name of both properties should be lower-cased and both keys are optional.

```javascript
//a valid module
{controller: function() {}, view: function() {}}
```

---

## Rendering Modules

### Usage

Calling `m.module` with a DOM element as the first argument and a module as the second argument will instantiate the module's controller, and call the module's view function with the controller instance as the first argument.

```javascript
var MyModule = {}
MyModule.controller = function() {
	this.greeting = "Hello"
}
MyModule.view = function(ctrl) {
	return m("h1", ctrl.greeting)
}

m.module(document.body, MyModule)

//<body><h1>Hello</h1></body>
```

---

### Using controllers as factories

When using `m.module`, Mithril instantiates controllers as if they were class constructors. However, if a controller returns an object, the returned object will be used as the controller instance (this is a feature in Javascript, which can be used to use a controller as a factory).

```javascript
var MyModule = {}
MyModule.controller = function() {
	return {greeting: "Hello"}
}
MyModule.view = function(ctrl) {
	return m("h1", ctrl.greeting)
}

m.module(document.body, MyModule)

//<body><h1>Hello</h1></body>
```

---

### Parameterized modules

Any extra parameters passed to `m.module` (after the DOM element and the module to be rendered) are appended to the list of arguments of both the controller and the view functions.

```javascript
var MyModule = {}
MyModule.controller = function(options, extras) {
	this.greeting = "Hello"
	console.log(options.name, extras) // logs "world", "this is a test"
}
MyModule.view = function(ctrl, options, extras) {
	return m("h1", ctrl.greeting + " " + options.name + " " + extras)
}

m.module(document.body, MyModule, {name: "world"}, "this is a test")

//<body><h1>Hello world this is a test</h1></body>
```

---

### Unloading modules

If a module's controller implements an instance method called `onunload`, this method will be called when a new `m.module` call updates the root DOM element tied to the module in question.

```javascript
var module1 = {};
module1.controller = function() {
	this.onunload = function() {
		console.log("unloading module 1");
	};
};
module1.view = function() {};

m.module(document, module1);



var module2 = {};
module2.controller = function() {};
module1.view = function() {};

m.module(document, module2); // logs "unloading module 1"
```

This mechanism is useful to clear timers and unsubscribe event handlers. If you have a hierarchy of components, you can recursively call `onunload` on all the components in the tree or use a [pubsub](http://microjs.com/#pubsub) library to unload specific components on demand.

You can also use this event to prevent a module from being unloaded in the context of a route change (e.g. to alert a user to save their changes before navigating away from a page)

```javascript
var module1 = {}
module1.controller = function() {
	this.unsaved = false
	
	this.onunload = function(e) {
		if (this.unsaved) {
			e.preventDefault()
		}
	}
}
```

Normally, calling `m.module` will return the controller instance for that module, but there's one corner case: if `preventDefault` is called from a controller's `onunload` method as a result of calling `m.module`, then the `m.module` call will not instantiate the new controller, and will return `undefined`.

To unload a module without loading another module, you can simply call `m.module` without a module parameter:

```javascript
m.module(rootElement, null);
```

Mithril does not hook into the browser's `onbeforeunload` event. To prevent unloading when attempting to navigate away from a page, you can check the return value of `m.module`

```javascript
window.onbeforeunload = function() {
	if (!m.module(rootElement, null)) {
		//onunload's preventDefault was called
		return "Are you sure you want to leave?"
	}
}
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Object module(DOMElement rootElement, Module module [, Object options [, any... args]])

where:
	Module :: Object { Controller, void view(Object controllerInstance) }
	Controller :: void controller() | void controller() { prototype: void unload(UnloadEvent e) }
	UnloadEvent :: Object {void preventDefault()}
```

-	**DOMElement rootElement**

	A DOM element which will contain the view's template.

-	**Module module**

	A module is supposed to be an Object with two keys: `controller` and `view`. Each of those should point to a Javascript class constructor function

	The controller class is instantiated immediately and a reference is returned upon calling `m.module`.

	Once the controller code finishes executing (and this may include waiting for AJAX requests to complete), the view class is instantiated, and the instance of the controller is passed as an argument to the view's constructor.

	Note that controllers can manually instantiate child controllers (since they are simply Javascript constructors), and likewise, views can call child views and manually pass the child controller instances down the the child view constructors. You should avoid instantiating controllers from views, since views can be rendered many times across the lifecycle of a page, and a redraw might wipe out sub-controller data, if it houses any.

	However, if hierarchical nesting of modules is desirable, it's preferable to put the module itself in the template. Mithril's rendering system can detect these modules and manage their lifecycles automatically.

-	**Object options**

	A key-value map of optional arguments to be passed to the controller and view functions of `module`
	
-	**any... args**

	Extra arguments are passed to both controller and view functions in the same fashion as the `options` argument
	
-	**returns Object controllerInstance**

	An instance of the controller constructor
	
---

## Using modules as components

Modules can have arguments "preloaded" into them. This is useful when using modules as [components](components.md)

Calling `m.module` without a DOM element as an argument will create copy of the module with parameters already bound as arguments to the controller and view functions

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

Modules can be part of a template's virtual element tree, so the "preloading" mechanism can be used to create parameterized components:

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

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Object module(Module module [, Object options [, any... args]])

where:
	Module :: Object { Controller, void view(Object controllerInstance) }
	Controller :: void controller() | void controller() { prototype: void unload(UnloadEvent e) }
	UnloadEvent :: Object {void preventDefault()}
```

-	**Module module**

	A module is supposed to be an Object with two keys: `controller` and `view`. Each of those should point to a Javascript class constructor function

	The controller class is instantiated immediately and a reference is returned upon calling `m.module`.

	Once the controller code finishes executing (and this may include waiting for AJAX requests to complete), the view class is instantiated, and the instance of the controller is passed as an argument to the view's constructor.

	Note that controllers can manually instantiate child controllers (since they are simply Javascript constructors), and likewise, views can call child views and manually pass the child controller instances down the the child view constructors. You should avoid instantiating controllers from views, since views can be rendered many times across the lifecycle of a page, and a redraw might wipe out sub-controller data, if it houses any.

	However, if hierarchical nesting of modules is desirable, it's preferable to put the module itself in the template. Mithril's rendering system can detect these modules and manage their lifecycles automatically.

-	**Object options**

	A key-value map of optional arguments to be passed to the controller and view functions of `module`
	
-	**any... args**

	Extra arguments are passed to both controller and view functions in the same fashion as the `options` argument
	
-	**returns Object controllerInstance**

	An instance of the controller constructor
	