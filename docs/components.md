## Components

Components are Mithril's mechanism for [hierarchical MVC](http://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller).

[Mithril modules](mithril.module.md) can usually be used as components, in scenarios where components don't need to cross-communicate a lot (for example, a dashboard full of unrelated widgets).

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

An important point to note is that you should never instantiate a controller class from a view (or call a function that does it). Views are re-rendered as a result of events firing, and can clobber state from sub-component controllers.

---

### Organizing components

Another common reason why people need components is that some pages are inherently large and complex, and need to be sub-divided into smaller pieces in order to help keep code maintainable.

In these cases, components often need to communicate with one another frequently and in often unexpected ways. Because of the requirement of interconnectedness, the pattern of importing independent modules to build bigger modules is not a good fit.

Instead, the best way to organize these types of components is to move code out of controllers into view-models. Here's an example: Suppose we have a module that displays a list of users.

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

Here you can see that the controller holds the state for the list of users. The problem with this is that with a large hierarchy of components, it becomes difficult to find this particular controller instance from any given view.

The solution is to refactor the code into a globally available entity: a view-model

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
userList.vm.init = function() {
	//here we specify that this view will interact with a `search`, a `filters` and a `grid` modules
	search.vm.init()
	filters.vm.init()
	grid.vm.init()
}
```

With that, we have a guarantee that all data and all methods from the specified view-models will be available from anywhere within this group of modules.

We can also optionally backfill controllers for each module so that they follow the same pattern as the `userList.controller`, if we need to use those modules as top-level modules in independent pages.

---

### Librarization

Applications often reuse rich UI controls that aren't provided out of the box by HTML. Below is a basic example of a component of that type: a minimalist autocompleter component.

*Note: Be mindful that, for the sake of code clarity and brevity, the example below does not support keyboard navigation and other real world features.*

```javascript
var autocompleter = {};

autocompleter.controller = function(data, getter) {
    //binding for the text input
    this.value = m.prop("");
    //store for the list of items
    this.data = m.prop([]);

    //method to determine what property of a list item to compare the text input's value to
    this.getter = getter;

    //this method changes the relevance list depending on what's currently in the text input
    this.change = function(value) {
        this.value(value);

        var list = value === "" ? [] : data().filter(function(item) {
            return this.getter(item).toLowerCase().indexOf(value.toLowerCase()) > -1;
        }, this);
        this.data(list);
    };

    //this method is called when an option is selected. It triggers an `onchange` event
    this.select = function(value) {
        this.value(value);
        this.data([]);
        if (this.onchange) this.onchange({currentTarget: {value: value}});
    };
}

autocompleter.view = function(ctrl, options) {
    if (options) ctrl.onchange = options.onchange;
    return [
        m("input", {oninput: m.withAttr("value", ctrl.change.bind(ctrl)), value: ctrl.value()}),
        ctrl.data().map(function(item) {
            return m("div", {data: ctrl.getter(item), onclick: m.withAttr("data", ctrl.select.bind(ctrl))}, ctrl.getter(item));
        })
    ];
}



//here's an example of using the autocompleter
var dashboard = {}

dashboard.controller = function() {
    this.names = m.prop([{id: 1, name: "John"}, {id: 2, name: "Bob"}, {id: 2, name: "Mary"}]);
    this.autocompleter = new autocompleter.controller(this.names, function(item) {
        return item.name;
    });
};

dashboard.view = function(ctrl) {
    return m("#example", [
        new autocompleter.view(ctrl.autocompleter, {onchange: m.withAttr("value", log)}),
    ]);
};

//an FP-friendly console.log
var log = function(value) {console.log(value)}


//initialize
m.module(document.body, dashboard);
```
