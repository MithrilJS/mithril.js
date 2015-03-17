## Components

---

- [Stateless components](#stateless-components)
- [Stateful components](#stateful-components)
- [Parameterized initial state](#parameterized-initial-state)
- [Data-driven component identity](#data-driven-component-identity)
- [Unloading components](#unloading-components)
- [Asynchronous components](#asynchronous-components)
- [Component limitations and caveats](#component-limitations-and-caveats)
- [Application architecture with components](#application-architecture-with-components)

---

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

A component is said to be stateless when it does not store data internally. Instead, it's composed of [pure functions](http://en.wikipedia.org/wiki/Pure_function). It's a good practice to make components stateless because they are more predictable, and easier to reason about, test and troubleshoot.

The previous section explained that components controllers can receive arguments passed to the `m.module` call, but this does not mean controllers are a necessary middle man in a component.

Instead of copying arguments to the controller object (thereby creating internal state in the component), and then passing the controller object to the view, it is often desirable that views always update based on the most current list of arguments being passed to a component.

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
		this.kelvinToFahrenheit = function(value) {
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

Usually it's recommended that you store application state outside of components (either in a view-model or at the top-level module). Components can be stateful, but the purpose of component state is to prevent the pollution of the model layer with aspects that are inherently about the component. For example, an autocompleter component may need to internally store a flag to indicate whether the dropdown is visible, but this kind of state is not relevant to an application's business logic.

You may also elect to use component state for application state that is not meaningful outside the scope of a single component. For example, you might have a `UserForm` component that lives alongside other unrelated components on a bigger page, but it probably doesn't make sense for the parent page to be aware of the unsaved user entity stored within the `UserForm` component.

---

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

However, it's recommended that you aggregate all of your requests in a single place instead of scattering them across multiple components. Aggregating requests in a top-level module makes it easier to replay the request chain (for example, you may need to fetch an updated list of items after you've saved something related to it) and it ensures the entire data set is loaded in memory before drilling down into the components (thus preventing the need for redundant AJAX calls for sibling components that need the same data). Be sure to read the [Application Architecture section](#application-architecture-with-components) to learn more about organizing componentized code.

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

Note that the rules for keys apply for components the same way they do for regular elements: it is not allowed to have duplicate keys as children of the same parent, and they must be either strings or numbers (or something with a `.toString()` implementation that makes the entity locally uniquely identifiable when serialized). You can learn more about keys [here](mithril.md#dealing-with-focus)

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

---

## Application architecture with components

Components are versatile tools to organize code and can be used in a variety of ways.

Let's create a simple model entity which we'll use in a simple application, to illustrate different usage patterns for components:

```javascript
var Contact = function(data) {
	data = data || {}
	this.id = m.prop(data.id)
	this.name = m.prop(data.name)
	this.email = m.prop(data.email)
}
Contact.list = function(data) {
	return m.request({method: "GET", url: "/api/contact", data: data})
}
Contact.save = function(data) {
	return m.request({method: "POST", url: "/api/contact", data: data})
}
```

Here, we've defined a class called `Contact`. A contact has an id, a name and an email. There are two static methods: `list` for retrieving a list of contacts, and `save` to save a single contact. These methods assume that the AJAX responses return contacts in JSON format, containing the same fields as the class.

### Aggregation of responsibility

One way of organizing components is to use component parameter lists to send data downstream, and to define events to bubble data back upstream to a centralized module who is responsible for interfacing with the model layer.

```javascript
var ContactsWidget = {
	controller: function update() {
		this.contacts = Contact.list()
		this.save = function(contact) {
			Contact.save(contact).then(update.bind(this))
		}.bind(this)
	},
	view: function(ctrl) {
		return [
			m.module(ContactForm, {onsave: ctrl.save}),
			m.module(ContactList, {contacts: contacts})
		]
	}
}

var ContactForm = {
	controller: function(args) {
		this.contact = m.prop(args.contact || new Contact())
	},
	view: function(ctrl, args) {
		var contact = ctrl.contact()
		
		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),
			
			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),
			
			m("button", {onclick: args.onsave.bind(this, contact)}, "Save")
		])
	}
}

var ContactList = {
	view: function(ctrl, args) {
		return m("table", [
			args.contacts().map(function(contact) {
				return m("tr", [
					m("td", contact.id()),
					m("td", contact.name()),
					m("td", contact.email())
				])
			})
		])
	}
}

m.module(document.body, ContactsWidget)
```

In the example above, there are 3 components. `ContactsWidget` is the top level module being rendered to `document.body`, and it is the module that has the responsibility of talking to our Model entity `Contact`, which we defined earlier.

The `ContactForm` component is, as its name suggests, a form that allows us to edit the fields of a `Contact` entity. It exposes an event called `onsave` which is fired when the Save button is pressed on the form. In addition, it stores the unsaved contact entity internally within the component (`this.contact = m.prop(args.contact || new Contact())`).

The `ContactList` component displays a table showing all the contact entities that are passed to it via the `contacts` argument.

The most interesting component is `ContactsWidget`:

1 - on initialization, it fetches the list of contacts (`this.contacts = Contact.list`)
2 - when `save` is called, it saves a contact (`Contact.save(contact)`)
3 - after saving the contact, it reloads the list (`.then(update.bind(this))`)

`update` is the controller function itself, so defining it as a promise callback simply means that the controller is re-initialized after the previous asynchronous operation (`Contact.save()`)

Aggregating responsibility in a top-level component allows the developer to manage multiple model entities easily: any given AJAX request only needs to be performed once regardless of how many components need its data, and refreshing the data set is simple.

In addition, components can be reused in different contexts. Notice that the `ContactList` does not care about whether `args.contacts` refers to all the contacts in the database, or just contacts that match some criteria. Similarly, `ContactForm` can be used to both create new contacts as well as edit existing ones. The implications of saving are left to the parent component to handle.

This architecture can yield highly flexible and reusable code, but flexibility can also increase the cognitive load of the system (for example, you need to look at both the top-level module and `ContactList` in order to know what is the data being displayed (and how it's being filtered, etc). In addition, having a deeply nested tree of components can result in a lot of intermediate "pass-through" arguments and event handlers.

---

### Concrete components

Another way of organizing code is to distribute concrete responsibilities across multiple modules.

Here's a refactored version of the sample app above to illustrate:

```javascript
var ContactForm = {
	controller: function() {
		this.contact = m.prop(new Contact())
		this.save = function(contact) {
			Contact.save(contact)
		}
	},
	view: function() {
		var contact = ctrl.contact()
		
		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),
			
			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),
			
			m("button", {onclick: ctrl.save.bind(this, contact)}, "Save")
		])
	}
}

var ContactList = {
	controller: function() {
		this.contacts = Contact.list()
	},
	view: function(ctrl) {
		return m("table", [
			ctrl.contacts().map(function(contact) {
				return m("tr", [
					m("td", contact.id()),
					m("td", contact.name()),
					m("td", contact.email())
				])
			})
		])
	}
}

m.route(document.body, "/", {
	"/list": ContactList,
	"/create": ContactForm
})
```

Notice that now each component is self-contained: each has a separate route, and each component does exactly one thing. These components are designed to not interface with other components. On the one hand, it's extremely easy to reason about the behavior of the components since they only serve a single purpose, but on the other hand they don't have the flexibility that the previous example did (e.g. in this iteration, `ContactList` can only list all of the contacts in the database, not an arbitrary subset.

Also, notice that since these components are designed to encapsulate their behavior, they cannot easily affect other components. In practice, this means that if the two components were in a `ContactsWidget` component as before, saving a contact would not update the list without some extra code.

#### Cross-communication in single-purpose components

Here's one way to implement cross-communication between single purpose components:

```javascript
var Reloadable = function() {
	var controllers = []
	return {
		register: function(controller) {
			return function() {
				var ctrl = new controller
				ctrl.onunload = function() {
					controllers.splice(controllers.indexOf(ctrl), 1)
				}
				controllers.push({instance: ctrl, controller: controller})
				return ctrl
			}
		},
		update: function() {
			controllers.map(function(c) {
				ctrl = new c.controller
				for (var i in ctrl) c.instance[i] = ctrl[i]
			})
		}
	}
}.call()


var ContactsWidget = {
	view: function(ctrl) {
		return [
			m.module(ContactForm),
			m.module(ContactList)
		]
	}
}

var ContactForm = {
	controller: function() {
		this.contact = m.prop(new Contact())
		this.save = function(contact) {
			Contact.save(contact).then(Reloadable.update)
		}
	},
	view: function() {
		var contact = ctrl.contact()
		
		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),
			
			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),
			
			m("button", {onclick: ctrl.save.bind(this, contact)}, "Save")
		])
	}
}

var ContactList = {
	controller: Reloadable.register(function() {
		this.contacts = Contact.list()
	}),
	view: function(ctrl) {
		return m("table", [
			ctrl.contacts().map(function(contact) {
				return m("tr", [
					m("td", contact.id()),
					m("td", contact.name()),
					m("td", contact.email())
				])
			})
		])
	}
}

m.module(document.body, ContactsWidget)
```

In this iteration, both the `ContactForm` and `ContactList` components are now children of the `ContactsWidget` component and they appear simultaneously on the same page.

The `Reloadable` object exposes two methods: `register` which marks a controller as a reloadable entity, and `update` which reloads controllers marked by `register`. Controllers are deregistered when their `onunload` event is triggered.

The `ContactList` component's controller is marked as reloadable, and the `save` event handler in `ContactForm` calls `Reloadable.update` after saving.

This mechanism allows multiple components to be reloaded in response to non-idempotent operations. `Reloadable` can be further refactored so that `update` broadcasts to "channels", which controllers can subscribe to.

One extremely important aspect of this architecture is that since components encapsulate their internal state, by definition it's harder to reason about AJAX request redundancy (i.e. how to prevent two identical AJAX requests originating from two different components).

### Hybrid architecture

It's of course possible to use both the aggregation of responsibility and the pub/sub pattern at the same time.

The example below shows a variation of the contacts app where `ContactForm` is responsible for saving.

```javascript
var ContactsWidget = {
	controller: Reloadable.register(function() {
		this.contacts = Contact.list()
	}),
	view: function(ctrl) {
		return [
			m.module(ContactForm),
			m.module(ContactList, {contacts: contacts})
		]
	}
}

var ContactForm = {
	controller: function(args) {
		this.contact = m.prop(args.contact || new Contact())
		this.save = function() {
			Contact.save(contact).then(Reloadable.update)
		}
	},
	view: function(ctrl, args) {
		var contact = ctrl.contact()
		
		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),
			
			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),
			
			m("button", {onclick: args.onsave.bind(this, contact)}, "Save")
		])
	}
}

var ContactList = {
	view: function(ctrl, args) {
		return m("table", [
			args.contacts().map(function(contact) {
				return m("tr", [
					m("td", contact.id()),
					m("td", contact.name()),
					m("td", contact.email())
				])
			})
		])
	}
}

m.module(document.body, ContactsWidget)
```

Here, the data fetching is still centralized in the top-level component, so that we can avoid duplicate AJAX requests when fetching data.

And moving the responsibility of saving to the `ContactForm` component alleviates the need to send data back up the component tree, making the handling of non-idempotent operations less prone to pass-through argument noise.