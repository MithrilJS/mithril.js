## Components

Components are Mithril's mechanism for [hierarchical MVC](http://en.wikipedia.org/wiki/Hierarchical_model%E2%80%93view%E2%80%93controller).

They allow complex, repeating logic to be abstracted into a logical unit of code, and they help modularize applications with widgets or multi-concern views (e.g. dashboards).

You can also use components for a number of other advanced techniques, like recursive templating (e.g. tree views) and partial template mixins (i.e. injecting part of a template into another).

---

### Nesting components

Here's an example of nested modules in a widgetization scenario:

```javascript
//root module
var dashboard = {};

dashboard.controller = function() {
	this.userProfile = new userProfile.controller();
	this.projectList = new projectList.controller();
}

dashboard.view = function(ctrl) {
	return m("#example", [
		m(".profile", [
			userProfile.view(ctrl.userProfile)
		]),
		m(".projects", [
			projectList.view(ctrl.projectList)
		])
	])
}



//components

//user profile component
var userProfile = {};

userProfile.controller = function() {
	this.name = m.prop("John Doe");
};

userProfile.view = function(ctrl) {
	return [
		m("h1", "Profile"),
		"Name: " + ctrl.name()
	];
};



//project list component
var projectList = {};

projectList.controller = function() {};

projectList.view = function(ctrl) {
	return "There are no projects";
};



//initialize
m.module(document.body, dashboard);
```

As you can see, components look exactly like regular modules - it's [turtles all the way down](https://en.wikipedia.org/wiki/Turtles_all_the_way_down)! Remember that modules are simply dumb containers for `controller` and `view` classes.

This means components are decoupled both *horizontally* and *vertically*. It's possible to refactor each component as an isolated unit of logic (which itself follows the MVC pattern). And we can do so without touching the rest of the application (as long as the component API stays the same).

Similarly, it's possible to mix and match different classes to make mix-in anonymous components (e.g. it's straightforward to build several views - for, say, a mobile app - that use the same controller).

It's also possible to keep references to parent and even sibling components. This is useful, for example, when implementing notification badges in a navigation component, which are triggered and managed by other components in the system.

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

        var list = value === "" ? [] : data.filter(function(item) {
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
    this.autocompleter = new autocompleter.controller(this.names(), function(item) {
        return item.name;
    });
};

dashboard.view = function(ctrl) {
    return m("#example", [
        new autocompleter.view(ctrl.autocompleter, {onchange: m.withAttr("value", console.log)}),
    ]);
};



//initialize
m.module(document.body, dashboard);
```

It's recommended that libraries that provide extra functionality to Mithril be implemented using this modular pattern, as opposed to trying to hide implementation in a [virtual element's `config` attribute](mithril.md).

You should only consider using `config`-based components when leveraging existing libraries.
