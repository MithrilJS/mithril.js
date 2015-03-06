## m.module

---

- [Usage](#usage)
- [Unloading modules](#unloading-modules)
- [Signature](#signature)

---

A module is an Object with two keys: `controller` and `view`. Each of those should point to a Javascript function. Note that the name of both properties should be lower-cased.

```javascript
//a valid module
{controller: function() {}, view: function() {}}
```

When using `m.module`, Mithril instantiates controllers as if they were class constructors. However, controllers may return objects if you want to use that Javascript feature to have more fine-grained control over a controller's lifecycle.

Conceptually, the easiest way to think of a module is as a logical namespace with which to organize applications. For example, an app might have a dashboard module, a userEditForm module, an autocompleter module, a date formatting module, etc

In the context of single page applications (SPA), a module can often be thought of as the code for a single "page", i.e. a visual state that is bookmarkable. Module can, however, also represent *parts* of pages.

Note that a module might have external dependencies and that the dependencies aren't considered part of the module.

In more complex applications, modules can be nested in a [hierarchical MVC](http://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller) pattern. Nested reusable modules that have views are called **Components**.

Modules and namespaces are often used interchangeably, but namespaces that do not implement the module interface (that is, objects that do not have a property called `controller` and a property called `view`) cannot be activated with `m.module`. For example, a namespace for date formatting utilities could be labeled a "module" (in the generic sense of the word) but it would not contain a view class, and therefore attempting to initialize it via `m.module` would result in undefined behavior.

---

### Usage

You can make anonymous modules out of existing classes

```javascript
//model object
var dashboardViewModel = {};
dashboardViewModel.init = function() {
	this.greeting = "Hello";
};

//controller class
var dashboardController = function() {
	dashboardViewModel.init();
};

//view class
var dashboardView = function() {
	return m("h1", dashboardViewModel.greeting);
};

//initialize an anonymous module
m.module(document.body, {controller: dashboardController, view: dashboardView});
```

Typically, however, modules and namespaces are used interchangeably.

```javascript
//`dashboard` is both a namespace and a module
var dashboard = {}

//view-model
dashboard.vm = {}

//controller
dashboard.controller = function() {
	dashboard.vm.greeting = "Hello";
};

//view
dashboard.view = function(vm) {
	return m("h1", dashboard.vm.greeting);
};

//initialize it
m.module(document.body, dashboard);
```

Modules can also be used as components in order to assemble bigger systems. You can [read more about componentization here](components.md)

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

You can also use this event to prevent a module from being unloaded (e.g. to alert a user to save their changes before navigating away from a page)

```javascript
var module1 = {}
module1.controller = function() {
	this.onunload = function(e) {
		if (!confirm("are you sure you want to leave this page?")) e.preventDefault()
	}
}
```

Normally, calling `m.module` will return the controller instance for that module, but there's one corner case: if `preventDefault` is called from a controller's `onunload` method as a result of calling `m.module`, then the `m.module` call will not instantiate the new controller, and will return `undefined`.

To unload a module without loading another module, you can simply call `m.module` without a module parameter:

```javascript
m.module(rootElement, null);
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Object module(DOMElement rootElement, Module module)

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

	This "[turtles all the way down](https://en.wikipedia.org/wiki/Turtles_all_the_way_down)" approach is the heart of Mithril's component system.

	Components are nothing more than decoupled classes that can be dynamically brought together as required. This permits the swapping of implementations at a routing level (for example, if implementing widgetized versions of existing components), and class dependency hierarchies can be structurally organized to provide uniform interfaces (for unit tests, for example).

-	**returns Object controllerInstance**

	An instance of the controller constructor