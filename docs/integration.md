## Integrating with Other Libraries

Integration with third party libraries can be achieved via the `config` attribute of virtual elements.

It's recommended that you encapsulate integration code in a component.

The example below shows a simple component that integrates with the [select2 library](http://ivaynberg.github.io/select2/).

```javascript
//Select2 component (assumes both jQuery and Select2 are included in the page)

/** @namespace */
var select2 = {};

/**
select2 config factory. The params in this doc refer to properties of the `ctrl` argument
@param {Object} data - the data with which to populate the <option> list
@param {number} value - the id of the item in `data` that we want to select
@param {function(Object id)} onchange - the event handler to call when the selection changes.
	`id` is the the same as `value`
*/
select2.config = function(ctrl) {
	return function(element, isInitialized) {
		var el = $(element);
		
		if (!isInitialized) {
			//set up select2 (only if not initialized already)
			el.select2()
				//this event handler updates the controller when the view changes
				.on("change", function(e) {
					//integrate with the auto-redrawing system...
					m.startComputation();
					
					//...so that Mithril autoredraws the view after calling the controller callback
					if (typeof ctrl.onchange == "function") ctrl.onchange(el.select2("val"));
					
					m.endComputation();
					//end integration
				});
		}
		
		//update the view with the latest controller value
		el.select2("val", ctrl.value);
	}
}

//this view implements select2's `<select>` progressive enhancement mode
select2.view = function(ctrl) {
	return m("select", {config: select2.config(ctrl)}, [
		ctrl.data.map(function(item) {
			return m("option", {value: item.id}, item.name)
		})
	]);
};

//end component



//usage
var dashboard = {};

dashboard.controller = function() {
	//list of users to show
	this.data = [{id: 1, name: "John"}, {id: 2, name: "Mary"}, {id: 3, name: "Jane"}];
	
	//select Mary
	this.currentUser = this.data[1];
	
	this.changeUser = function(id) {
		console.log(id)
	};
}

dashboard.view = function(ctrl) {
	return m("div", [
		m("label", "User:"),
		select2.view({data: ctrl.data, value: ctrl.currentUser.id, onchange: ctrl.changeUser})
	]);
}

m.module(document.body, dashboard);
```

`select2.config` is a factory that creates a `config` function based on a given controller. We declare this outside of the `select2.view` function to avoid cluttering the template.

The `config` function created by our factory only runs the initialization code if it hasn't already. This `if` statement is important, because this function may be called multiple times by Mithril's auto-redrawing system and we don't want to re-initialize select2 at every redraw.

The initialization code defines a `change` event handler. Because this handler is not created using Mithril's templating engine (i.e. we're not defining an attribute in a virtual element), we must manually integrate it to the auto-redrawing system.

This can be done by simply calling `m.startComputation` at the beginning, and `m.endComputation` at the end of the function. You must add a pair of these calls for each asynchronous execution thread, unless the thread is already integrated.

For example, if you were to call a web service using `m.request`, you would not need to add more calls to `m.startComputation` / `m.endComputation` (you would still need the first pair in the event handler, though).

On the other hand, if you were to call a web service using jQuery, then you would be responsible for adding a `m.startComputation` call before the jQuery ajax call, and for adding a `m.endComputation` call at the end of the completion callback, in addition to the calls within the `change` event handler. Refer to the [`auto-redrawing`](auto-redrawing.md) guide for an example.

One important note about the `config` method is that you should avoid calling `m.redraw`, `m.startComputation` and `m.endComputation` in the `config` function's execution thread. (An execution thread is basically any amount of code that runs before other asynchronous threads start to run.)

While Mithril technically does support this use case, relying on multiple redraw passes degrades performance and makes it possible to code yourself into an infinite execution loop situation, which is extremely difficult to debug.

The `dashboard` module in the example shows how a developer would consume the select2 component.

You should always document integration components so that others can find out what attribute parameters can be used to initialize the component.

---

## Integrating to legacy code

If you need to add separate widgets to different places on a same page, you can simply initialize each widget as you would a regular Mithril application (i.e. use `m.render`, `m.module` or `m.route`).

There's just one caveat: while simply initializing multiple "islands" in this fashion works, their initialization calls are not aware of each other and can cause redraws too frequently. To optimize rendering, you should add a `m.startComputation` call before the first widget initialization call, and a `m.endComputation` after the last widget initialization call in each execution thread.

```
m.startComputation()

m.module(document.getElementById("widget1-container"), widget1)

m.module(document.getElementById("widget2-container"), widget1)

m.endComputation()
```

