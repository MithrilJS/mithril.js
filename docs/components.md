## Components

### Widgetization

Components are Mithril's mechanism for [hierarchical MVC](http://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller).

In Mithril, [modules](mithril.module.md) are components. In scenarios where components don't need to cross-communicate a lot (for example, a dashboard full of unrelated widgets), it's often convenient to use fat controllers (i.e. controllers that hold state and methods).

Here's an example of a hierarchy of such components:

```javascript
//root module
var dashboard = {};

dashboard.controller = function() {
	this.userProfile = new userProfile.controller();
	this.projectList = new projectList.controller();
}

dashboard.view = function(ctrl) {
	return [
		userProfile.view(ctrl.userProfile)
		projectList.view(ctrl.projectList)
	]
}
```

In the snippet above, there are three modules: `dashboard`, `userProfile` and `projectList`. Each of the sub-components can reasonably be rendered as a standalone page, but here we see how we can put them together to create a bigger page.

An important point to note is that if you have fat controllers, you should never instantiate a controller class from a view (or call a function that does it). Views are re-rendered as a result of events firing, and can clobber state from sub-component controllers.

---

### Divide and conquer

Another common reason why people need components is that some pages are inherently large and complex, and need to be sub-divided into smaller pieces in order to help keep code maintainable.

In these cases, components often need to communicate with one another frequently and in often unexpected ways. Because of the requirement of interconnectedness, the pattern of using fat controllers is not a good fit.

Instead, the best way to organize these types of components is to move code out of controllers into view-models. 

A view-model can be thought of a special type of model entities. You are probably familiar with the idea of model entities being ORM classes to map to database tables, but in reality, the model layer is an abstract area where you should be putting everything related to data and the business logic surround it.

View-models are, by definition, entities that hold data about the state of the application. For example, which tab is open, which filters are applied to a grid, the temporary value of a resettable input, etc. This type of data typically doesn't fit in the ORM schema because it relates to the UI, and not the canonical data.

Refactoring a fat controller into using view-models allow better accessibility of data and provides a scalable structure for organizing and scoping non-ORM state.

Here's an example that illustrates how we can migrate from a fat-controller-based codebase to thin controllers. Suppose we have a module that displays a list of users:

```javascript
var userList = {}

userList.controller = function() {
	this.users = m.request({method: "GET", url: "/users"})
}

userList.view = function(ctrl) {
	return ctrl.users().map(function(user) {
		return user.name
	})
}
```

Here you can see that the controller holds the state for the list of users. The problem with this is that with a large hierarchy of components, it becomes cumbersome to find this particular controller instance from any given view, and therefore it's difficult to access its data and call methods on it.

```javascript
var userList = {}

userList.controller = function() {
	userList.vm.init()
}

userList.vm = {}
userList.vm.init = function() {
	this.users = m.request({method: "GET", url: "/users"})
}

userList.view = function() {
	return userList.vm.users().map(function(user) {
		return user.name
	})
}
```

This pattern allows us to access the data for the userList module from anywhere in the application, as long as the view model has been initialized. Notice that refactoring from the fat controller is easy: we simply moved the controller function body into the `init` function of the view model, and changed the reference to the controller in the view.

It's then possible to extend this pattern to create view-model dependency trees:

```javascript
userList.controller = function() {
	//here we specify that this component will require with a `search` view-model
	userList.vm.init()
	search.vm.init()
}
```

With that, we have a guarantee that all data and all methods from the required view-models will be available from anywhere within this component, even if it has multiple sub-views and view-models.

You might have noticed that we're simply sub-dividing a component into smaller pieces and not providing controllers for each of these pieces. You should be aware that these pieces aren't Mithril modules (because they don't contain both a `view` function AND a `controller` function), and therefore they are not components.

Checking whether there is a controller for a unit of functionality gives you a dead simple way to tell whether your sub-divided code is merely an organized part of a bigger component, or whether it is a truly modular and reusable component itself.

If we decide that a unit of functionality is indeed a reusable component, we can simply add a controller to it so that it follows the module interface.

```
//assuming we already have a view in `search`, adding a controller lets us use `search` as an independent component
search.controller = function() {
	search.vm.init()
}

userList.controller = function() {
	userList.vm.init()
	
	//the controller encapsulates the scope that it is responsible for
	new search.controller()
}
```

It's strongly recommended that you consider adopting the pattern of using thin controllers and view models. Moving logic out of fat controllers into the model layer brings your code structure closer to the original MVC pattern (where controllers merely exist to tell the views what actions are possible within a given context), and can dramatically reduce the complexity of cross-communicating modules in the long run.

#### Scoping to namespaces

Sometimes you might find that organizing code into various namespaces results in repetitive declarations of the namespace.

```javascript
//repetitive namespace declarations
myApp.users.index.controller = function() {/*...*/}

myApp.users.index.vm = {/*...*/}

myApp.users.index.view = function() {
	return myApp.users.index.vm.something
}
```

There's no rule for how you should organize code, and given that namespacing is often achieved with simple javascript, you can use simple javascript patterns to alias a long namespace and reduce the amount of typing:

```javascript
new function() {
	var module = myApp.users.index = {}

	module.vm = {/*...*/}

	module.controller = function() {/*...*/}

	module.view = function() {
		var vm = module.vm
		
		return vm.something
	}
}
```

---

### Librarization

Applications often require reusable UI controls that aren't provided out of the box by HTML. Let's walk through how one might implement one. In this example, we'll create a very simple autocompleter control.

We can start building it as an singleton module as we did with our components in the previous section. Here's how an implementation might look like:

```javascript
var autocompleter = {}
autocompleter.vm = {
	term: m.prop(""),
	filter: function(item) {
		return autocompleter.vm.term() && item.name.toLowerCase().indexOf(autocompleter.vm.term().toLowerCase()) > -1
	}
}
autocompleter.view = function(ctrl) {
	var vm = autocompleter.vm
	return [
		m("div", [
			m("input", {oninput: m.withAttr("value", vm.term), value: vm.term})
		]),
		ctrl.data().filter(vm.filter).map(function(item) {
			return m("div", {onclick: ctrl.binds.bind(this, item)}, item.name);
		})
	];
}
```

As with our earlier examples, we put logic and UI state in a view model entity, and use it from our view. The `<input>` updates the `term` getter-setter via a binding, and the `filter` function takes care of slicing the data set to display only relevant matches as a user types.

The problem with this component, as it stands, is that the module and its view-model are singletons, so the component can only be used once in a page. Fortunately this is easy to fix: we can simply put the whole thing in a factory function.

```javascript
var autocompleter = function() {
	var autocompleter = {}
	autocompleter.vm = {
		term: m.prop(""),
		search: function(value) {
			autocompleter.vm.term(value.toLowerCase())
		},
		filter: function(item) {
			return autocompleter.vm.term() && item.name.toLowerCase().indexOf(autocompleter.vm.term()) > -1
		}
	}
	autocompleter.view = function(ctrl) {
		return [
			m("div", [
				m("input", {oninput: m.withAttr("value", autocompleter.vm.search)})
			]),
			ctrl.data().filter(autocompleter.vm.filter).map(function(item) {
				return m("div", {onclick: ctrl.binds.bind(this, item)}, item.name);
			})
		];
	}
	return autocompleter
}
```

As you can see, the code is exactly the same as before, with the exception that it is wrapped in a function that returns the module. This allows us to easily create copies of the autocompleter:

```javascript
//here's an example of using the autocompleter
var dashboard = {}
dashboard.controller = function() {
	dashboard.vm.init()
}
dashboard.vm = {}
dashboard.vm.init = function() {
	this.users = m.prop([{id: 1, name: "John"}, {id: 2, name: "Bob"}, {id: 2, name: "Mary"}]);
	this.selectedUser = m.prop()
	this.userAC = new autocompleter()
	
	this.projects = m.prop([{id: 1, name: "John's project"}, {id: 2, name: "Bob's project"}, {id: 2, name: "Mary's project"}]);
	this.selectedProject = m.prop()
	this.projectAC = new autocompleter()
};

dashboard.view = function() {
	var vm = dashboard.vm
	return m("div", [
		vm.userAC.view({data: vm.users, binds: vm.selectedUser}),
		vm.projectAC.view({data: vm.projects, binds: vm.selectedProject}),
	]);
};

//initialize
m.module(document.body, dashboard);
```

In the usage example above, we created a `dashboard` top-level module, and instantiated two `autocompleter` modules, along with some data to populate the autocompleter, and getter-setters to bind data to.

