## Getting Started

### What is Mithril?

Mithril is a client-side Javascript MVC framework, i.e. it's a tool to make application code divided into a data layer (called **M**odel), a UI layer (called **V**iew), and a glue layer (called **C**ontroller)

Mithril is around 7.8 kB gzipped thanks to its [small, focused, API](mithril.md). It provides a templating engine with a virtual DOM diff implementation for performant rendering, utilities for high-level modelling via functional composition, as well as support for routing and componentization.

The goal of the framework is to make application code discoverable, readable and maintainable, and hopefully help you become an even better developer.

Unlike some frameworks, Mithril tries very hard to avoid locking you into a web of dependencies: you can use as *little* of the framework as you need.

However, using its entire toolset idiomatically can bring lots of benefits: learning to use functional programming in real world scenarios and solidifying good coding practices for OOP and MVC are just some of them.

---

## A Simple Application

Once you have a [copy of Mithril](installation.md), getting started is surprisingly boilerplate-free:

```markup
<!doctype html>
<title>Todo app</title>
<script src="mithril.min.js"></script>
<body>
<script>
//app goes here
</script>
</body>
```

Yes, this is valid HTML 5! According to the specs, the `<html>` and `<head>` tags can be omitted, but their respective DOM elements will still be there implicitly when a browser renders that markup.

---

### Model

In Mithril, an application typically lives in a namespace and contains components. Components are merely structures that represent a viewable "page" or a part of a page. In addition, an application can be organizationally divided into three major layers: Model, Controller and View.

For simplicity, our application will have only one component, and we're going to use it as the namespace for our application.

In Mithril, a *component* is an object that contains a `view` function and optionally a `controller` function.

```
//an empty Mithril component
var myComponent = {
	controller: function() {},
	view: function() {}
}
```

In addition to holding a controller and a view, a component can also be used to store data that pertains to it.

Let's create a component.

```markup
<script>
//this application only has one component: todo
var todo = {};
</script>
```

Typically, model entities are reusable and live outside of components (e.g. `var User = ...`). In our example, since the whole application lives in one component, we're going to use the component as a namespace for our model entities.

```javascript
var todo = {};

//for simplicity, we use this component to namespace the model classes

//the Todo class has two properties
todo.Todo = function(data) {
	this.description = m.prop(data.description);
	this.done = m.prop(false);
};

//the TodoList class is a list of Todo's
todo.TodoList = Array;
```

[`m.prop`](mithril.prop.md) is simply a factory for a getter-setter function. Getter-setters work like this:

```javascript
//define a getter-setter with initial value `John`
var a_name = m.prop("John");

//read the value
var a = a_name(); //a == "John"

//set the value to `Mary`
a_name("Mary"); //Mary

//read the value
var b = a_name(); //b == "Mary"
```

Note that the `Todo` and `TodoList` classes we defined above are plain vanilla Javascript constructors. They can be initialized and used like this:

```javascript
var myTask = new todo.Todo({description: "Write code"});

//read the description
myTask.description(); //Write code

//is it done?
var isDone = myTask.done(); //isDone == false

//mark as done
myTask.done(true); //true

//now it's done
isDone = myTask.done(); //isDone == true
```

The `TodoList` class is simply an alias of the native `Array` class.

```javascript
var list = new todo.TodoList();
list.length; //0
```

According to the classic definition of the MVC pattern, the model layer is responsible for data storage, state management and business logic.

You can see that our classes above fit the criteria: they have all the methods and properties that they need to be assembled into a meaningful state. A `Todo` can be instantiated, and have its properties changed. The list can have todo items added to it via the `push` method. And so on.

#### View-Model

Our next step is to write a view-model that will use our model classes. A view-model is a model level entity that stores UI state. In many frameworks UI state is typically stored in a controller, but doing so makes the code harder to scale since controllers aren't designed to be data providers. In Mithril, UI state is understood to be model data, even though it doesn't necessarily map to a database ORM entity.

View-models are also responsible for handling business logic that revolves around UI-specific restrictions. For example a form might have an input and a cancel button. In such a case, it's the view-model's responsibility to track the current state of the input vs the original state and to apply a cancellation, if required. In the event the form was saved, then view-model would delegate saving to a more appropriate ORM model entity.

In the case of our todo application, the view-model needs a few things: it needs to track a running list of todos and a field for adding new todos, and it needs to handle the logic of adding to the todo and the implications of this action of the UI.

```javascript
//define the view-model
todo.vm = {
	init: function() {
		//a running list of todos
		todo.vm.list = new todo.TodoList();
		
		//a slot to store the name of a new todo before it is created
		todo.vm.description = m.prop('');
		
		//adds a todo to the list, and clears the description field for user convenience
		todo.vm.add = function(description) {
			if (description()) {
				todo.vm.list.push(new todo.Todo({description: description()}));
				todo.vm.description("");
			}
		};
	}
};
```

The code above defines a view-model object called `vm`. It is simply a javascript object that has an `init` function. This function initializes the `vm` object with three members: `list`, which is simply an array, `description`, which is an `m.prop` getter-setter function with an empty string as the initial value, and `add`, which is a method that adds a new Todo instance to `list` if an input description getter-setter is not an empty string.

Later in this guide, we'll pass the `description` property as the parameter to this function. When we get there, I'll explain why we're passing description as an argument instead of simply using OOP-style member association.

You can use the view-model like this:

```javascript
//initialize our view-model
todo.vm.init();

todo.vm.description(); //[empty string]

//try adding a to-do
todo.vm.add(todo.vm.description);
todo.vm.list.length; //0, because you can't add a to-do with an empty description

//add it properly
todo.vm.description("Write code");
todo.vm.add(todo.vm.description);
todo.vm.list.length; //1
```

---

### Controller

In classic MVC, the role of the controller is to dispatch actions from the view to the model layer. In traditional server-side frameworks, the controller layer is of large significance because the nature of HTTP requests, responses and the framework abstractions that are exposed to developers require that the controller act as an adapter layer to transform the serialized data from HTTP requests to something that can be passed to ORM model methods.

In client-side MVC, however, this dissonance doesn't exist, and controllers can be extremely simple. Mithril controllers can be stripped down to a bare minimum, so that they only perform a single essential role: to expose a scoped set of model-level functionality. As you may recall, models are responsible for encapsulating business logic, and view-models encapsulate logic that pertains specifically to UI state, so there's really nothing else for a controller to abstract away, and all it needs to do is expose a slice of the model layer that pertains to the UI that is currently in view.

In other words, all our controller needs to do is this:

```javascript
todo.controller = function() {
	todo.vm.init()
}
```

---

### View

The next step is to write a view so users can interact with the application. In Mithril, views are plain Javascript. This comes with several benefits (proper error reporting, proper lexical scoping, etc.), while still allowing [HTML syntax to be used via a preprocessor tool](https://github.com/insin/msx)

```javascript
todo.view = function() {
	return m("html", [
		m("body", [
			m("input"),
			m("button", "Add"),
			m("table", [
				m("tr", [
					m("td", [
						m("input[type=checkbox]")
					]),
					m("td", "task description"),
				])
			])
		])
	]);
};
```

The utility method `m()` creates virtual DOM elements. As you can see, you can use CSS selectors to specify attributes. You can also use the `.` syntax to add CSS classes and the `#` to add an id.

In fact, when not using the [MSX](https://github.com/insin/msx) HTML syntax preprocessor, it's recommended that you embrace using CSS selectors (e.g. `m(".modal-body")`) to really benefit from their inherent semantic expressiveness.

For the purposes of testing out our code so far, the view can be rendered using the `m.render` method:

```javascript
m.render(document, todo.view());
```

Notice that we pass a root DOM element to attach our template to, as well as the template itself.

This renders the following markup:

```markup
<html>
	<body>
		<input />
		<button>Add</button>
		<table>
			<tr>
				<td><input type="checkbox" /></td>
				<td>task description</td>
			</tr>
		</table>
	</body>
</html>
```

Note that `m.render` is a very low level method in Mithril that draws only once and doesn't attempt to run the auto-redrawing system. In order to enable auto-redrawing, the `todo` component must be initialized by either calling `m.mount` or by creating a route definition with `m.route`. Also note that, unlike observable-based frameworks like Knockout.js, setting a value in a `m.prop` getter-setter does NOT trigger redrawing side-effects in Mithril.

---

#### Data Bindings

Let's implement a **data binding** on the text input. Data bindings connect a DOM element to a Javascript variable so that updating one updates the other.

```javascript
//binding a model value to an input in a template
m("input", {value: todo.vm.description()})
```

This binds the `description` getter-setter to the text input. Updating the value of the description in the model updates the DOM input when Mithril redraws.

```javascript
todo.vm.init();

todo.vm.description(); // empty string
m.render(document, todo.view()); // input is blank

todo.vm.description("Write code"); //set the description in the controller
m.render(document, todo.view()); // input now says "Write code"
```

At a glance it may seem like we're doing something very expensive by redrawing, but as it turns out, calling the `todo.view` method multiple times does not actually re-render the entire template. Internally, Mithril keeps a virtual representation of the DOM in cache, scans for changes, and then only modifies the absolute minimum required to apply the change to the DOM. In practice, this results in surprisingly fast re-rendering.

In the case above, Mithril only touches the `value` attribute of the input.

Note that the example above only *sets* the value of the input element in the DOM, but it never *reads* it. This means that typing something on the input and then re-rendering will clobber the text on screen.

---

Fortunately, bindings can also be **bi-directional**: that is, they can be coded in such a way that, in addition to setting the DOM value, it's also possible to read it as a user types, and then update the `description` getter-setter in the view-model.

Here's the most basic way of implementing the view-to-model part of the binding:

```javascript
m("input", {onchange: m.withAttr("value", todo.vm.description), value: todo.vm.description()})
```

The code bound to the `onchange` can be read like this: "with the attribute value, set todo.vm.description".

Note that Mithril does not prescribe how the binding updates: you can bind it to `onchange`, `onkeypress`, `oninput`, `onblur` or any other event that you prefer.

You can also specify what attribute to bind. This means that just as you are able to bind the `value` attribute in an `<select>`, you are also able to bind the `selectedIndex` property, if needed for whatever reason.

The `m.withAttr` utility is a functional programming tool provided by Mithril to minimize the need for anonymous functions in the view.

The `m.withAttr("value", todo.vm.description)` call above returns a function that is the rough equivalent of this code:

```javascript
onchange: function(e) {
	todo.vm.description(e.target["value"]);
}
```

The difference, aside from avoiding an anonymous function, is that the `m.withAttr` idiom also takes care of catching the correct event target and selecting the appropriate source of the data - i.e. whether it should come from a Javascript property or from `DOMElement::getAttribute()`

---

In addition to bi-directional data binding, we can also bind parameterized functions to events:

```javascript
var vm = todo.vm

m("button", {onclick: vm.add.bind(vm, vm.description)}, "Add")
```

In the code above, we are simply using the native Javascript `Function::bind` method. This creates a new function with the parameter already set. In functional programming, this is called [*partial application*](http://en.wikipedia.org/wiki/Partial_application).

The `vm.add.bind(vm, vm.description)` expression above returns a function that is equivalent to this code:

```javascript
onclick: function(e) {
	todo.vm.add(todo.vm.description)
}
```

Note that when we construct the parameterized binding, we are passing the `description` getter-setter *by reference*, and not its value. We only evaluate the getter-setter to get its value in the controller method. This is a form of *lazy evaluation*: it allows us to say "use this value later, when the event handler gets called".

Hopefully by now, you're starting to see why Mithril encourages the usage of `m.prop`: Because Mithril getter-setters are functions, they naturally compose well with functional programming tools, and allow for some very powerful idioms. In this case, we're using them in a way that resembles C pointers.

Mithril uses them in other interesting ways elsewhere.

Clever readers will probably notice that we can refactor the `add` method to make it much simpler:

```javascript
vm.add = function() {
	if (vm.description()) {
		vm.list.push(new todo.Todo({description: vm.description()}));
		vm.description("");
	}
};
```

The difference with the modified version is that `add` no longer takes an argument.

With this, we can make the `onclick` binding on the template *much* simpler:

```
m("button", {onclick: todo.vm.add}, "Add")
```

The only reason I talked about partial application here was to make you aware of that technique, since it becomes useful when dealing with parameterized event handlers. In real life, given a choice, you should always pick the simplest idiom for your use case.

---

To implement flow control in Mithril views, we simply use Javascript Array methods:

```javascript
//here's the view
m("table", [
	todo.vm.list.map(function(task, index) {
		return m("tr", [
			m("td", [
				m("input[type=checkbox]")
			]),
			m("td", task.description()),
		])
	})
])
```

In the code above, `todo.vm.list` is an Array, and `map` is one of its native functional methods. It allows us to iterate over the list and merge transformed versions of the list items into an output array.

As you can see, we return a partial template with two `<td>`'s. The second one has a data binding to the `description` getter-setter of the Todo class instance.

You're probably starting to notice that Javascript has strong support for functional programming and that it allows us to naturally do things that can be clunky in other frameworks (e.g. looping inside a `<dl>/<dt>/<dd>` construct).

---

The rest of the code can be implemented using idioms we already covered. The complete view looks like this:

```javascript
todo.view = function() {
	return [
		m("input", {onchange: m.withAttr("value", todo.vm.description), value: todo.vm.description()}),
		m("button", {onclick: todo.vm.add}, "Add"),
		m("table", [
			todo.vm.list.map(function(task, index) {
				return m("tr", [
					m("td", [
						m("input[type=checkbox]", {onclick: m.withAttr("checked", task.done), checked: task.done()})
					]),
					m("td", {style: {textDecoration: task.done() ? "line-through" : "none"}}, task.description()),
				])
			})
		])
	];
};
```

Here are the highlights of the template above:

-	The template is rendered as a child of the document's `<body>`.
-	The text input saves its value to the `todo.vm.description` getter-setter we defined earlier.
-	The button calls the `todo.vm.add` method when clicked.
-	The table lists all the existing to-dos, if any.
-	The checkboxes save their value to the `task.done` getter setter.
-	The description gets crossed out via CSS if the task is marked as done.
-	When updates happen, the template is not wholly re-rendered - only the changes are applied.

---

So far, we've been using `m.render` to manually redraw after we made a change to the data. However, as I mentioned before, you can enable an [auto-redrawing system](auto-redrawing.md), by initializing the `todo` component via `m.mount`.

```javascript
//render the todo component inside the body DOM node
m.mount(document.body, {controller: todo.controller, view: todo.view});
```

Mithril's auto-redrawing system keeps track of controller stability, and only redraws the view once it detects that the controller has finished running all of its code, including asynchronous AJAX payloads. Likewise, it intelligently waits for asynchronous services inside event handlers to complete before redrawing.

You can learn more about how redrawing heuristics work [here](auto-redrawing.md).

---

### Summary

Here's the application code in its entirety:

```markup
<!doctype html>
<script src="mithril.min.js"></script>
<body>
<script>
//this application only has one component: todo
var todo = {};

//for simplicity, we use this component to namespace the model classes

//the Todo class has two properties
todo.Todo = function(data) {
	this.description = m.prop(data.description);
	this.done = m.prop(false);
};

//the TodoList class is a list of Todo's
todo.TodoList = Array;

//the view-model tracks a running list of todos,
//stores a description for new todos before they are created
//and takes care of the logic surrounding when adding is permitted
//and clearing the input after adding a todo to the list
todo.vm = (function() {
	var vm = {}
	vm.init = function() {
		//a running list of todos
		vm.list = new todo.TodoList();
		
		//a slot to store the name of a new todo before it is created
		vm.description = m.prop("");
		
		//adds a todo to the list, and clears the description field for user convenience
		vm.add = function() {
			if (vm.description()) {
				vm.list.push(new todo.Todo({description: vm.description()}));
				vm.description("");
			}
		};
	}
	return vm
}())

//the controller defines what part of the model is relevant for the current page
//in our case, there's only one view-model that handles everything
todo.controller = function() {
	todo.vm.init()
}

//here's the view
todo.view = function() {
	return [
		m("input", {onchange: m.withAttr("value", todo.vm.description), value: todo.vm.description()}),
		m("button", {onclick: todo.vm.add}, "Add"),
		m("table", [
			todo.vm.list.map(function(task, index) {
				return m("tr", [
					m("td", [
						m("input[type=checkbox]", {onclick: m.withAttr("checked", task.done), checked: task.done()})
					]),
					m("td", {style: {textDecoration: task.done() ? "line-through" : "none"}}, task.description()),
				])
			})
		])
	]
};

//initialize the application
m.mount(document.body, {controller: todo.controller, view: todo.view});
</script>
</body>
```

This example is also available as a [jsFiddle](http://jsfiddle.net/fbgypzbr/16/).
There is also [Extended example](http://jsfiddle.net/glebcha/q7tvLxsa/) available on jsfiddle.

---

## Notes on Architecture

Idiomatic Mithril code is meant to apply good programming conventions and be easy to refactor.

In the application above, notice how the Todo class can easily be moved to a different component if code re-organization is required.

Todos are self-contained and their data aren't tied to the DOM like in typical jQuery based code. The Todo class API is reusable and unit-test friendly, and in addition, it's a plain-vanilla Javascript class, and so has almost no framework-specific learning curve.

[`m.prop`](mithril.prop.md) is a simple but surprisingly versatile tool: it's functionally composable, it enables [uniform data access](http://en.wikipedia.org/wiki/Uniform_data_access) and allows a higher degree of decoupling when major refactoring is required.

When refactoring is unavoidable, the developer can simply replace the `m.prop` call with an appropriate getter-setter implementation, instead of having to grep for API usage across the entire application.

For example, if todo descriptions needed to always be uppercased, one could simply change the `description` getter-setter:

```javascript
this.description = m.prop(data.description)
```

becomes:

```javascript
//private store
var description;

//public getter-setter
this.description = function(value) {
	if (arguments.length > 0) description = value.toUpperCase();
	return description;
}

//make it serializable
this.description.toJSON = function() {return description}

//set the value
this.description(data.description)
```

In the view-model, we aliased the native Array class for `TodoList`. Be aware that by using the native Array class, we're making an implicit statement that we are going to support all of the standard Array methods as part of our API.

While this decision allows better API discoverability, the trade-off is that we're largely giving up on custom constraints and behavior. For example, if we wanted to change the application to make the list be persisted, a native Array would most certainly not be a suitable class to use.

In order to deal with that type of refactoring, one can explicitly decide to support only a subset of the Array API, and implement another class with the same interface as this subset API.

Given the code above, the replacement class would only need to implement the `.push()` and `.map()` methods. By freezing APIs and swapping implementations, the developer can completely avoid touching other layers in the application while refactoring.

```javascript
todo.TodoList = Array;
```

becomes:

```javascript
todo.TodoList = function () {
	this.push = function() { /*...*/ },
	this.map = function() { /*...*/ }
};
```

Hopefully these examples give you an idea of ways requirements can change over time and how Mithril's philosophy allows developers to use standard OOP techniques to refactor their codebases, rather than needing to modify large portions of the application.

---

The first and most obvious thing you may have noticed in the view layer is that the view is not written in HTML.

While superficially this may seem like an odd design, this actually has a lot of benefits:

-	No flash-of-unbehaviored-content (FOUC). In fact, Mithril is able to render a fully functional application - with working event handlers - before the "DOM ready" event fires!

-	There's no need for a parse-and-compile pre-processing step to turn strings containing HTML + templating syntax into working DOM elements.

-	Mithril views can provide accurate and informative error reporting, with line numbers and meaningful stack traces.

-	You get the ability to automate linting, unit testing and minifying of the entire view layer.

-	It provides full Turing completeness: full control over evaluation eagerness/laziness and caching in templates. You can even build components that take other components as first-class-citizen parameters!

And if you really do want to use HTML syntax after all, [you can use a package called MSX](https://github.com/insin/msx).

Views in Mithril use a virtual DOM diff implementation, which sidesteps performance problems related to opaque dirty-checking and excessive browser repaint that are present in some frameworks.

Another feature - the optional `m()` utility - allows writing terse templates in a declarative style using CSS shorthands, similar to popular HTML preprocessors from server-side MVC frameworks.

And because Mithril views are Javascript, the developer has full freedom to abstract common patterns - from bidirectional binding helpers to full blown components - using standard Javascript refactoring techniques.

Mithril templates are also more collision-proof than other component systems since there's no way to pollute the HTML tag namespace by defining ad-hoc tag names.

A more intellectually interesting aspect of the framework is that event handling is encouraged to be done via functional composition (i.e. by using tools like [`m.withAttr`](mithril.withAttr.md), [`m.prop`](mithril.prop.md) and the native `.bind()` method for partial application).

If you've been interested in learning or using Functional Programming in the real world, Mithril provides very pragmatic opportunities to get into it.

---

## Learn More

Mithril provides a few more facilities that are not demonstrated in this page. The following topics are good places to start a deeper dive.

-	[Routing](routing.md)
-	[Web Services](web-services.md)
-	[Components](components.md)

## Advanced Topics

-	[Optimizing performance](optimizing-performance.md)
-	[Integrating with the Auto-Redrawing System](auto-redrawing.md)
-	[Integrating with Other Libraries](integration.md)

## Misc

-	[Differences from Other MVC Frameworks](comparison.md)
-	[Benchmarks](benchmarks.md)
-	[Good Practices](practices.md)
-	[Useful Tools](tools.md)
