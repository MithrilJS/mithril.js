## Getting Started

### What is Mithril?

Mithril is a client-side Javascript MVC framework, i.e. it's a tool to make application code divided into a data layer (called **M**odel), a UI layer (called **V**iew), and a glue layer (called **C**ontroller)

Mithril is around 4kb gzipped thanks to its [small, focused, API](mithril.md). It provides a templating engine with a virtual DOM diff implementation for performant rendering, utilities for high-level modelling via functional composition, as well as support for routing and componentization.

The goal of the framework is to make application code discoverable, readable and maintainable, and hopefully help you become an even better developer.

Unlike some frameworks, Mithril tries very hard to avoid locking you into a web of dependencies: you can use as *little* of the framework as you need.

However, using its entire toolset idiomatically can bring lots of benefits: learning to use functional programming in real world scenarios and solidifying good coding practices for OOP and MVC are just some of them.

---

## A Simple Application

Once you have a [copy of Mithril](installation.md), getting started is surprisingly boilerplate-free:

```markup
<!doctype html>
<script src="mithril.js"></script>
<script>
//app goes here
</script>
```

Yes, this is valid HTML 5! According to the specs, the `<html>`, `<head>` and `<body>` tags can be omitted, but their respective DOM elements will still be there implicitly when a browser renders that markup.

---

### Model

In Mithril, an application typically lives in a namespace and contains modules. Modules are merely structures that represent a viewable "page" or component.

For simplicity, our application will have only one module, and we're going to use it as the namespace for our application:

```markup
<script>
//this application only has one module: todo
var todo = {};
</script>
```

This object will namespace our two Model classes:

```javascript
var todo = {};

//for simplicity, we use this module to namespace the model classes

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
var name = m.prop("John");

//read the value
var a = name(); //a == "John"

//set the value to `Mary`
name("Mary"); //Mary

//read the value
var b = name(); //b == "Mary"
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

---

### Controller

Our next step is to write a controller that will use our model classes.

```javascript
//the controller uses three model-level entities, of which one is a custom defined class:
//`Todo` is the central class in this application
//`list` is merely a generic array, with standard array methods
//`description` is a temporary storage box that holds a string
//
//the `add` method simply adds a new todo to the list
todo.controller = function() {
	this.list = new todo.TodoList();
	this.description = m.prop("");
	
	this.add = function(description) {
		if (description()) {
			this.list.push(new todo.Todo({description: description()}));
			this.description("");
		}
	};
}
```

The code above defines a controller class. It has three members: `list`, which is simply an array, `description`, which is an `m.prop` getter-setter function with an empty string as the initial value, and `add`, which is a method that adds a new Todo instance to `list` if an input description getter-setter is not an empty string. Later in this guide, we'll pass the `description` property as the parameter to this function. I'll explain why we're passing it as an argument when we get there.

You can use the controller like this:

```javascript
var ctrl = new todo.controller();

ctrl.description(); //[empty string]

//try adding a to-do
ctrl.add(ctrl.description);
ctrl.list.length; //0

//you can't add a to-do with an empty description

//add it properly
ctrl.description("Write code");
ctrl.add(ctrl.description);
ctrl.list.length; //1
```

---

### View

The next step is to write a view so users can interact with the application

```javascript
todo.view = function(ctrl) {
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

The view can be rendered using the `m.render` method:

```javascript
//assuming the `ctrl` variable from earlier
m.render(document, todo.view(ctrl));
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

---

#### Data Bindings

Let's implement a **data binding** on the text input. Data bindings connect a DOM element to a Javascript variable so that updating one updates the other.

```javascript
m("input")

//becomes
m("input", {value: ctrl.description()})
```

This binds the `description` getter-setter to the text input. Updating the value of the description updates the input when Mithril redraws.

```javascript
var ctrl = new todo.controller();
ctrl.description(); // empty string
m.render(document, todo.view(ctrl)); // input is empty
ctrl.description("Write code"); //set the description in the controller
m.render(document, todo.view(ctrl)); // input now says "Write code"
```

Note that calling the `todo.view` method multiple times does not re-render the entire template.

Internally, Mithril keeps a virtual representation of the DOM in cache, scans for changes, and then only modifies the minimum required to apply the change.

In this case, Mithril only touches the `value` attribute of the input.

---

Bindings can also be **bi-directional**: that is, they can be made such that, in addition to what we saw just now, a user typing on the input updates the description getter-setter.

Here's the idiomatic way of implementing the view-to-controller part of the binding:

```javascript
m("input", {onchange: m.withAttr("value", ctrl.description), value: ctrl.description()})
```

The code bound to the `onchange` can be read like this: "with the attribute value, set ctrl.description".

Note that Mithril does not prescribe how the binding updates: you can bind it to `onchange`, `onkeypress`, `oninput`, `onblur` or any other event that you prefer.

You can also specify what attribute to bind. This means that just as you are able to bind the `value` attribute in an `<select>`, you are also able to bind the `selectedIndex` property, if needed for whatever reason.

The `m.withAttr` utility is a functional programming tool provided by Mithril to minimize the need for ugly anonymous functions in the view.

The `m.withAttr("value", ctrl.description)` call above returns a function that is the rough equivalent of this code:

```javascript
onchange: function(e) {
	ctrl.description(e.target["value"]);
}
```

The difference, aside from the cosmetic avoidance of anonymous functions, is that the `m.withAttr` idiom also takes care of catching the correct event target and selecting the appropriate source of the data - i.e. whether it should come from a Javascript property or from `DOMElement::getAttribute()`

---

In addition to bi-directional data binding, we can also bind parameterized functions to events:

```javascript
m("button", {onclick: ctrl.add.bind(ctrl, ctrl.description)}, "Add")
```

In the code above, we are simply using the native Javascript `Function::bind` method. This creates a new function with the parameter already set. In functional programming, this is called [*partial application*](http://en.wikipedia.org/wiki/Partial_application).

The `ctrl.add.bind(ctrl, ctrl.description)` expression above returns a function that is equivalent to this code:

```javascript
onclick: function(e) {
	ctrl.add(ctrl.description)
}
```

Note that when we construct the parameterized binding, we are passing the `description` getter-setter *by reference*, and not its value. We only evaluate the getter-setter to get its value in the controller method. This is a form of *lazy evaluation*: it allows us to say "use this value later, when the event handler gets called".

Hopefully by now, you're starting to see why Mithril encourages the usage of `m.prop`: Because Mithril getter-setters are functions, they naturally compose well with functional programming tools, and allow for some very powerful idioms. In this case, we're using them in a way that resembles C pointers.

Mithril uses them in other interesting ways elsewhere.

As a side note, some readers have pointed out that we can refactor the `add` method like this:

```javascript
this.add = function() {
	if (this.description()) {
		this.list.push(new todo.Todo({description: this.description()}));
		this.description("");
	}
}.bind(this);
```

The difference is that `add` no longer takes an argument, and we call `.bind(this)` at the end to lock the scoping of `this` inside of the `add` method

Then we can make the `onclick` binding on the template much simpler:

```
m("button", {onclick: ctrl.add}, "Add")
```

The only reason I talked about partial application here was to make you aware of that technique, since it becomes useful when dealing with parameterized event handlers. In real life, given a choice, you should always pick the simplest idiom for your use case, as we just did here.

---

To implement flow control in Mithril views, we simply use Javascript:

```javascript
//here's the view
m("table", [
	ctrl.list.map(function(task, index) {
		return m("tr", [
			m("td", [
				m("input[type=checkbox]")
			]),
			m("td", task.description()),
		])
	})
])
```

In the code above, `ctrl.list` is an Array, and `map` is one of its native functional methods. It allows us to iterate over the list and merge transformed versions of the list items into an output array.

As you can see, we return a partial template with two `<td>`'s. The second one has a data binding to the `description` getter-setter of the Todo class instance.

You're probably starting to notice that Javascript has strong support for functional programming and that it allows us to naturally do things that can be clunky in other frameworks (e.g. looping inside a `<dl>/<dt>/<dd>` construct).

---

The rest of the code can be implemented using idioms we already covered. The complete view looks like this:

```javascript
todo.view = function(ctrl) {
	return m("html", [
		m("body", [
			m("input", {onchange: m.withAttr("value", ctrl.description), value: ctrl.description()}),
			m("button", {onclick: ctrl.add}, "Add"),
			m("table", [
				ctrl.list.map(function(task, index) {
					return m("tr", [
						m("td", [
							m("input[type=checkbox]", {onclick: m.withAttr("checked", task.done), checked: task.done()})
						]),
						m("td", {style: {textDecoration: task.done() ? "line-through" : "none"}}, task.description()),
					])
				})
			])
		])
	]);
};
```

Here are the highlights of the template above:

-	The template is rendered as a child of the implicit `<html>` element of the document.
-	The text input saves its value to the `ctrl.description` getter-setter we defined earlier.
-	The button calls the `ctrl.add` method when clicked.
-	The table lists all the existing to-dos, if any.
-	The checkboxes save their value to the `task.done` getter setter.
-	The description gets crossed out via CSS if the task is marked as done.
-	When updates happen, the template is not wholly re-rendered - only the changes are applied.

---

When running the classes in this application separately, you have full control and full responsibility for determining when to redraw the view.

However, Mithril does provide another utility to make this task automatic: [the Auto-Redrawing System](http://lhorie.github.io/mithril/auto-redrawing.html).

In order to enable Mithril's auto-redrawing system, we run the code as a Mithril module:

```javascript
m.module(document, todo);
```

Mithril's auto-redrawing system keeps track of controller stability, and only redraws the view once it detects that the controller has finished running all of its code, including asynchronous AJAX payloads.

Also note that this mechanism itself is not asynchronous if it doesn't need to be: Mithril does not need to wait for the next browser repaint frame to redraw - it doesn't even need to wait for the document ready event on the first redraw - it will redraw immediately upon script completion, if able to.

---

### Summary

Here's the application code in its entirety:

```markup
<!doctype html>
<script src="mithril.js"></script>
<script>
//this application only has one module: todo
var todo = {};

//for simplicity, we use this module to namespace the model classes

//the Todo class has two properties
todo.Todo = function(data) {
	this.description = m.prop(data.description);
	this.done = m.prop(false);
};

//the TodoList class is a list of Todo's
todo.TodoList = Array;

//the controller uses three model-level entities, of which one is a custom defined class:
//`Todo` is the central class in this application
//`list` is merely a generic array, with standard array methods
//`description` is a temporary storage box that holds a string
//
//the `add` method simply adds a new todo to the list
todo.controller = function() {
	this.list = new todo.TodoList();
	this.description = m.prop("");
	
	this.add = function() {
		if (this.description()) {
			this.list.push(new todo.Todo({description: this.description()}));
			this.description("");
		}
	}.bind(this);
};

//here's the view
todo.view = function(ctrl) {
	return m("html", [
		m("body", [
			m("input", {onchange: m.withAttr("value", ctrl.description), value: ctrl.description()}),
			m("button", {onclick: ctrl.add}, "Add"),
			m("table", [
				ctrl.list.map(function(task, index) {
					return m("tr", [
						m("td", [
							m("input[type=checkbox]", {onclick: m.withAttr("checked", task.done), checked: task.done()})
						]),
						m("td", {style: {textDecoration: task.done() ? "line-through" : "none"}}, task.description()),
					])
				})
			])
		])
	]);
};

//initialize the application
m.module(document, todo);
</script>
```

---

## Notes on Architecture

Let's look at each MVC layer in detail to illustrate some of Mithril's design principles and philosophies:

### Model

Idiomatic Mithril code is meant to apply good programming conventions and be easy to refactor.

In the application above, notice how the Todo class can easily be moved to a different module if code re-organization is required.

Todos are self-contained and their data aren't tied to the DOM like in typical jQuery based code. The Todo class API is reusable and unit-test friendly, and in addition, it's a plain-vanilla Javascript class, and so has almost no framework-specific learning curve.

[`m.prop`](mithril.prop.md) is a simple but surprisingly versatile tool: it's composable, it enables [uniform data access](http://en.wikipedia.org/wiki/Uniform_data_access) and allows a higher degree of decoupling when major refactoring is required.

When refactoring is unavoidable, the developer can simply replace the `m.prop` call with an appropriate getter-setter implementation, instead of having to grep for API usage across the entire application.

For example, if todo descriptions needed to always be uppercased, one could simply change the `description` getter-setter:

```javascript
this.description = m.prop(data.description)
```

becomes:

```javascript
//private store
var description = data.description;

//public getter-setter
this.description = function(value) {
	if (arguments.length > 0) description = value.toUpperCase();
	return description;
}
```

According to Mithril's philosophy, `list` and `description` are also considered model-level entities. This is a subtle but important point: model entities don't need to be full-blown custom classes.

Native Javascript classes are quite appropriate for storing primitive and structured data. Since in this case they are indeed being used to store data - even if temporarily - they are model entities!

Be aware that by using the native Array class for a list, we're making an implicit statement that we are going to support all of the standard Array methods as part of our API.

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

### Controller

Mithril follows a data binding paradigm that is familiar to developers that use server-side MVC frameworks like Rails and Django.

The difference, as mentioned earlier, is that Mithril philosophy considers any form of data storage as being a model entity - even data from a text input waiting to be saved!

In Mithril, controllers are not meant to progressively operate on model entities. Instead, model entities should expose methods that atomically act on themselves.

What this rule means is that controllers can have conditional logic, as is the case in the `add` method in the application above, but **each action that touches a model entity should not leave it in an unstable state.**

This is in contrast to the ActiveRecord pattern of other frameworks, which allows entities to be in potentially invalid states (for example, a to-do with no description), so long as they are not "saved".

The idea of disallowing unstable states hinges largely on the developer deciding what constitutes validity:

-	An empty description in the context of the text input in the UI is a perfectly valid state, and a string is an appropriate type to express that.

-	A to-do with no description is not valid, therefore we avoid writing code that ever leaves the Todo class instance in a unstable state.

Mithril doesn't programmatically define the scope of each model entity or in what states an entity is considered valid - validity is something the developer is responsible for defining.

Mithril's philosophical framework simply encourages that the developer map validity to static types. This is a key step in ensuring programs are robust and refactorable.

---

### View

The first and most obvious thing you may have noticed in the view layer is that the view is not written in HTML.

While superficially this may seem like an odd design, this actually has a lot of benefits:

-	No flash-of-unbehaviored-content (FOUC). In fact, Mithril is able to render a fully functional application - with working event handlers - before the "DOM ready" event fires!

-	There's no need for a parse-and-compile pre-processing step to turn strings containing HTML + templating syntax into working DOM elements.

-	Mithril views can provide accurate and informative error reporting, with line numbers and meaningful stack traces.

-	You get the ability to automate linting, unit testing and minifying of the entire view layer - and you are even able to use Closure Compiler's Advanced Mode without needing extensive annotations.

-	It provides full Turing completeness: full control over evaluation eagerness/laziness and caching in templates. You can even build components that take other components as first-class-citizen parameters!

-	[Turtles all the way down](https://en.wikipedia.org/wiki/Turtles_all_the_way_down): you don't need write custom data binding code in jQuery for every possible user interaction, and you don't need to support a complicated "directive" layer to be able to fit some types of components into the system.

Views in Mithril use a virtual DOM diff implementation, which sidesteps performance problems related to opaque dirty-checking and excessive browser repaint that are present in some frameworks.

Another feature - the optional `m()` utility - allows writing terse templates in a declarative style using CSS shorthands, similar to popular HTML preprocessors from server-side MVC frameworks.

And because Mithril views are Javascript, the developer has full freedom to abstract common patterns - from bidirectional binding helpers to full blown components - using standard Javascript refactoring techniques.

Mithril templates are also more collision-proof than other component systems since there's no way to pollute the HTML tag namespace by defining ad-hoc tag names.

A more intellectually interesting aspect of the framework is that event handling is encouraged to be done via functional composition (i.e. by using tools like [`m.withAttr`](mithril.withAttr.md), [`m.prop`](mithril.prop.md) and the native `.bind()` method for partial application).

If you've been interested in learning or using Functional Programming in the real world, Mithril provides very pragmatic opportunities to get into it.

---

## Learn More

Mithril provides a few more facilities that are not demonstrated in this page. The following topics are good places to start a deeper dive.

-	[Routing](routing)
-	[Web Services](web-services)
-	[Components](components)

## Advanced Topics

-	[Compiling templates](compiling-templates)
-	[Integrating with the Auto-Redrawing System](auto-redrawing)
-	[Integrating with Other Libraries](integration)

## Misc

-	[Differences from Other MVC Frameworks](comparison)
-	[Benchmarks](benchmarks)
-	[Good Practices](practices)
-	[Useful Tools](tools)
