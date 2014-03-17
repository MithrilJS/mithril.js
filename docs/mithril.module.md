## m.module

A module is an Object with two keys: `controller` and `view`. Each of those should point to a Javascript class constructor function.

'm.module' activates a module by instantiating its controller, then instantiating its view and rendering it into a root DOM element.

Conceptually, the easiest way to think of a module is as a logical namespace with which to organize applications. For example, an app might have a dashboard module, a userEditForm module, an autocompleter module, a date formatting module, etc

In the context of single page applications (SPA), a module can often be thought of as the code for a single "page", i.e. a visual state that is bookmarkable. Module can, however, also represent *parts* of pages.

Note that a module might have external dependencies and that the dependencies aren't considered part of the module.

In more complex applications, modules can be nested in a [hierarchical MVC](http://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller) pattern. Nested reusable modules that have views are called **Components**.

Modules and namespaces are often used interchangeably, but namespaces that do not implement the module interface (that is, objects that do not have a property called `controller` and a property called `view`) cannot be activated with `m.module`. For example, a namespace for date formatting utilities could be labeled a "module" (in the generic sense of the word) but it would not contain a view class, and therefore attempting to initialize it via `m.module` would result in undefined behavior.

---

### Usage

You can make anonymous modules out of existing classes

```javascript
//controller class
var dashboardController = function() {
		this.greeting = "Hello";
};

//view class
var dashboardView = function() {
	return m("h1", ctrl.greeting);
};

//initialize an anonymous module
m.module(document.body, {controller: dashboardController, view: dashboardView});
```

Typically, however, modules and namespaces are used interchangeably.

```javascript
//`dashboard` is both a namespace and a module
var dashboard = {}

//controller class
dashboard.controller = function() {
		this.greeting = "Hello";
};

//view class
dashboard.view = function() {
	return m("h1", ctrl.greeting);
};

//initialize it
m.module(document.body, dashboard);
```

The example below shows a component module called `user` being included in a parent module `dashboard`.

```javascript
//this is a sample module
var dashboard = {
	controller: function() {
		this.greeting = "Hello";
		
		this.user = new user.controller();
	},
	view: function(controller) {
		return [
			m("h1", controller.greeting),
			
			new user.view(controller.user)
		];
	}
};

//this module is being included as a component
var user = {
	//model
	User: function(name) {
		this.name = name;
	},
	//controller
	controller: function() {
		this.user = new user.User("John Doe");
	},
	//view
	view: function(controller) {
		return m("div", controller.user.name);
	}
};

//activate the dashboard module
m.module(document.body, dashboard);
```

yields:

```markup
<body>
	<h1>Hello</h1>
	<div>John Doe</div>
</body>
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void module(DOMElement rootElement, Module module)

where:
	Module :: Object { void controller(), void view(Object controllerInstance) }
```

-	**DOMElement rootElement**

	A DOM element which will contain the view's template.
	
-	**Module module**

	A module is supposed to be an Object with two keys: `controller` and `view`. Each of those should point to a Javascript class constructor function
	
	The controller class is instantiated immediately upon calling `m.module`.
	
	Once the controller code finishes executing (and this may include waiting for AJAX requests to complete), the view class is instantiated, and the instance of the controller is passed as an argument to the view's constructor.
	
	Note that controllers can manually instantiate child controllers (since they are simply Javascript constructors), and likewise, views can instantiate child views and manually pass the child controller instances down the the child view constructors.
	
	This "turtles all the way down" approach is the heart of Mithril's component system.
	
	Components are nothing more than decoupled classes that can be dynamically brought together as required. This permits the swapping of implementations at a routing level (for example, if implementing widgetized versions of existing components) and class dependency hierarchies can be structurally organized to provide uniform interfaces (for unit tests, for example).



