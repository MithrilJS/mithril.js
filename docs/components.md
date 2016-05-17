## Components

---

- [Application architecture with components](#application-architecture-with-components)
	- [Aggregation of responsibility](#aggregation-of-responsibility)
	- [Distribution of concrete responsibilities](#distribution-of-concrete-responsibilities)
	- [Cross-communication in single-purpose components](#cross-communication-in-single-purpose-components)
	- [The observer pattern](#the-observer-pattern)
	- [Hybrid architecture](#hybrid-architecture)
	- [Classic MVC](#classic-mvc)
- [Example: HTML5 drag-n-drop file uploader component](#example-html5-drag-n-drop-file-uploader-component)

---

## Application architecture with components

Components are versatile tools to organize code and can be used in a variety of ways.

Let's create a simple model entity which we'll use in a simple application, to illustrate different usage patterns for components:

```javascript
var Contact = function(data) {
	data = data || {}
	this.id = m.prop(data.id || "")
	this.name = m.prop(data.name || "")
	this.email = m.prop(data.email || "")
}
Contact.list = function(data) {
	return m.request({method: "GET", url: "/api/contact", type: Contact})
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
			m.component(ContactForm, {onsave: ctrl.save}),
			m.component(ContactList, {contacts: ctrl.contacts})
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

			m("button[type=button]", {onclick: args.onsave.bind(this, contact)}, "Save")
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

m.mount(document.body, ContactsWidget)
```

In the example above, there are 3 components. `ContactsWidget` is the top level module being rendered to `document.body`, and it is the module that has the responsibility of talking to our Model entity `Contact`, which we defined earlier.

The `ContactForm` component is, as its name suggests, a form that allows us to edit the fields of a `Contact` entity. It exposes an event called `onsave` which is fired when the Save button is pressed on the form. In addition, it stores the unsaved contact entity internally within the component (`this.contact = m.prop(args.contact || new Contact())`).

The `ContactList` component displays a table showing all the contact entities that are passed to it via the `contacts` argument.

The most interesting component is `ContactsWidget`:

1. on initialization, it fetches the list of contacts (`this.contacts = Contact.list`)

2. when `save` is called, it saves a contact (`Contact.save(contact)`)

3. after saving the contact, it reloads the list (`.then(update.bind(this))`)

`update` is the controller function itself, so defining it as a promise callback simply means that the controller is re-initialized after the previous asynchronous operation (`Contact.save()`)

Aggregating responsibility in a top-level component allows the developer to manage multiple model entities easily: any given AJAX request only needs to be performed once regardless of how many components need its data, and refreshing the data set is simple.

In addition, components can be reused in different contexts. Notice that the `ContactList` does not care about whether `args.contacts` refers to all the contacts in the database, or just contacts that match some criteria. Similarly, `ContactForm` can be used to both create new contacts as well as edit existing ones. The implications of saving are left to the parent component to handle.

This architecture can yield highly flexible and reusable code, but flexibility can also increase the cognitive load of the system (for example, you need to look at both the top-level module and `ContactList` in order to know what is the data being displayed (and how it's being filtered, etc). In addition, having a deeply nested tree of components can result in a lot of intermediate "pass-through" arguments and event handlers.

---

### Distribution of concrete responsibilities

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
	view: function(ctrl) {
		var contact = ctrl.contact()

		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),

			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),

			m("button[type=button]", {onclick: ctrl.save.bind(this, contact)}, "Save")
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
var Observable = function() {
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
		trigger: function() {
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
			ContactForm,
			ContactList
		]
	}
}

var ContactForm = {
	controller: function() {
		this.contact = m.prop(new Contact())
		this.save = function(contact) {
			Contact.save(contact).then(Observable.trigger)
		}
	},
	view: function(ctrl) {
		var contact = ctrl.contact()

		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),

			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),

			m("button[type=button]", {onclick: ctrl.save.bind(this, contact)}, "Save")
		])
	}
}

var ContactList = {
	controller: Observable.register(function() {
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

m.mount(document.body, ContactsWidget)
```

In this iteration, both the `ContactForm` and `ContactList` components are now children of the `ContactsWidget` component and they appear simultaneously on the same page.

The `Observable` object exposes two methods: `register` which marks a controller as a Observable entity, and `trigger` which reloads controllers marked by `register`. Controllers are deregistered when their `onunload` event is triggered.

The `ContactList` component's controller is marked as Observable, and the `save` event handler in `ContactForm` calls `Observable.trigger` after saving.

This mechanism allows multiple components to be reloaded in response to non-idempotent operations.

One extremely important aspect of this architecture is that since components encapsulate their internal state, then by definition it's harder to reason about AJAX request redundancy (i.e. how to prevent two identical AJAX requests originating from two different components).

### The observer pattern

The `Observable` object can be further refactored so that `trigger` broadcasts to "channels", which controllers can subscribe to. This is known, appropriately, as the [observer pattern](http://en.wikipedia.org/wiki/Observer_pattern).

```javascript
var Observable = function() {
	var channels = {}
	return {
		register: function(subscriptions, controller) {
			return function self() {
				var ctrl = new controller
				var reload = controller.bind(ctrl)
				Observable.on(subscriptions, reload)
				ctrl.onunload = function() {
					Observable.off(reload)
				}
				return ctrl
			}
		},
		on: function(subscriptions, callback) {
			subscriptions.forEach(function(subscription) {
				if (!channels[subscription]) channels[subscription] = []
				channels[subscription].push(callback)
			})
		},
		off: function(callback) {
			for (var channel in channels) {
				var index = channels[channel].indexOf(callback)
				if (index > -1) channels[channel].splice(index, 1)
			}
		},
		trigger: function(channel, args) {
			console.log("triggered: " + channel)
			channels[channel].map(function(callback) {
				callback(args)
			})
		}
	}
}.call()
```

This pattern is useful to decouple chains of dependencies (however care should be taken to avoid "come-from hell", i.e. difficulty in following a chains of events because they are too numerous and arbitrarily inter-dependent)

### Hybrid architecture

It's of course possible to use both aggregation of responsibility and the observer pattern at the same time.

The example below shows a variation of the contacts app where `ContactForm` is responsible for saving.

```javascript
var ContactsWidget = {
	controller: Observable.register(["updateContact"], function() {
		this.contacts = Contact.list()
	}),
	view: function(ctrl) {
		return [
			m.component(ContactForm),
			m.component(ContactList, {contacts: ctrl.contacts})
		]
	}
}

var ContactForm = {
	controller: function(args) {
		this.contact = m.prop(new Contact())
		this.save = function(contact) {
			Contact.save(contact).then(Observable.trigger("updateContact"))
		}
	},
	view: function(ctrl, args) {
		var contact = ctrl.contact()

		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),

			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),

			m("button[type=button]", {onclick: ctrl.save.bind(this, contact)}, "Save")
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

m.mount(document.body, ContactsWidget)
```

Here, the data fetching is still centralized in the top-level component, so that we can avoid duplicate AJAX requests when fetching data.

And moving the responsibility of saving to the `ContactForm` component alleviates the need to send data back up the component tree, making the handling of non-idempotent operations less prone to pass-through argument noise.

---

### Classic MVC

Here's one last, but relevant variation of the pattern above.

```javascript
//model layer observer
Observable.on(["saveContact"], function(data) {
	Contact.save(data.contact).then(Observable.trigger("updateContact"))
})

//ContactsWidget is the same as before
var ContactsWidget = {
	controller: Observable.register(["updateContact"], function() {
		this.contacts = Contact.list()
	}),
	view: function(ctrl) {
		return [
			m.component(ContactForm),
			ctrl.contacts() === undefined
			  ? m("div", "loading contacts...") //waiting for promise to resolve
			  : m.component(ContactList, {contacts: ctrl.contacts})
		]
	}
}

//ContactForm no longer calls `Contact.save`
var ContactForm = {
	controller: function(args) {
	        var ctrl = this
		ctrl.contact = m.prop(new Contact())
		ctrl.save = function(contact) {
			Observable.trigger("saveContact", {contact: contact})
			ctrl.contact = m.prop(new Contact()) //reset to empty contact
		}
		return ctrl
	},
	view: function(ctrl, args) {
		var contact = ctrl.contact()

		return m("form", [
			m("label", "Name"),
			m("input", {oninput: m.withAttr("value", contact.name), value: contact.name()}),

			m("label", "Email"),
			m("input", {oninput: m.withAttr("value", contact.email), value: contact.email()}),

			m("button[type=button]", {onclick: ctrl.save.bind(this, contact)}, "Save")
		])
	}
}

//ContactList is the same as before
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

m.mount(document.body, ContactsWidget)
```

Here we've moved `Contact.save(contact).then(Observable.trigger("updateContact"))` out of the `ContactForm` component and into the model layer. In its place, `ContactForm` merely emits an action, which is then handled by this model layer observer.

This allows swapping the implementation of the `saveContact` handler without changing the `ContactForm` component.

---

### Example: HTML5 drag-n-drop file uploader component

Here's an example of a not-so-trivial component: a drag-n-drop file uploader. In addition to the `controller` and `view` properties that make the `Uploader` object usable as a component, it also has an `upload` convenience function that provides a basic upload model method, and a `serialize` function that allows files to be serialized as JSON in regular requests encoded as `application/x-www-form-urlencoded`.

These two functions are here to illustrate the ability to expose APIs to component consumers that complement the component's user interface. By bundling model methods in the component, we avoid hard-coding how files are handled once they're dropped in, and instead, we provide a useful library of functions that can be consumed flexibly to meet the demands on an application.

```javascript
var Uploader = {
	upload: function(options) {
		var formData = new FormData
		for (var key in options.data) {
			for (var i = 0; i < options.data[key].length; i++) {
				formData.append(key, options.data[key][i])
			}
		}

		//simply pass the FormData object intact to the underlying XMLHttpRequest, instead of JSON.stringify'ing it
		options.serialize = function(value) {return value}
		options.data = formData

		return m.request(options)
	},
	serialize: function(files) {
		var promises = files.map(function(file) {
			var deferred = m.deferred()

			var reader = new FileReader
			reader.readAsDataURL()
			reader.onloadend = function(e) {
				deferred.resolve(e.result)
			}
			reader.onerror = deferred.reject
			return deferred.promise
		})
		return m.sync(promises)
	},
	controller: function(args) {
		this.noop = function(e) {
			e.preventDefault()
		}
		this.update = function(e) {
			e.preventDefault()
			if (typeof args.onchange == "function") {
				args.onchange([].slice.call((e.dataTransfer || e.target).files))
			}
		}
	},
	view: function(ctrl, args) {
		return m(".uploader", {ondragover: ctrl.noop, ondrop: ctrl.update})
	}
}
```

Below are some examples of consuming the `Uploader` component:

```javascript
//usage demo 1: standalone multipart/form-data upload when files are dropped into the component
var Demo1 = {
	controller: function() {
		return {
			upload: function(files) {
				Uploader.upload({method: "POST", url: "/api/files", data: {files: files}}).then(function() {
					alert("uploaded!")
				})
			}
		}
	},
	view: function(ctrl) {
		return [
			m("h1", "Uploader demo"),
			m.component(Uploader, {onchange: ctrl.upload})
		]
	}
}
```

[Demo](http://jsfiddle.net/vL22kjvs/5/)

```javascript
//usage demo 2: upload as base-64 encoded data url from a parent form
var Demo2 = {
	Asset: {
		save: function(data) {
			return m.request({method: "POST", url: "/api/assets", data: data})
		}
	},

	controller: function() {
		var files = m.prop([])
		return {
			files: files,
			save: function() {
				Uploader.serialize(files()).then(function(files) {
					Demo2.Asset.save({files: files}).then(function() {
						alert("Uploaded!")
					})
				})
			}
		}
	},
	view: function(ctrl) {
		return [
			m("h1", "Uploader demo"),
			m("p", "Drag and drop a file below. An alert box will appear when the upload finishes"),
			m("form", [
				m.component(Uploader, {onchange: ctrl.files}),
				ctrl.files().map(function(file) {
					return file.name
				}).join(),
				m("button[type=button]", {onclick: ctrl.save}, "Upload")
			])
		]
	}
}
```

[Demo](http://jsfiddle.net/vL22kjvs/6/)

