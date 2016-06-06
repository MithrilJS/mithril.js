## Integrating with Other Libraries

Integration with third party libraries or vanilla javascript code can be achieved via the [`config` attribute of virtual elements](mithril.md#accessing-the-real-dom).

It's recommended that you encapsulate integration code in a component or a helper function.

The example below shows a simple component that integrates with the [select2 library](http://ivaynberg.github.io/select2/).

```javascript
var Select2 = {
	//	Returns a select box
	view: function(ctrl, attrs) {
		var selectedId = attrs.value().id;
        //Create a Select2 progrssively enhanced SELECT element
		return m("select", {config: Select2.config(attrs)}, [
			attrs.data.map(function(item) {
				var args = {value: item.id};
				//	Set selected option
				if(item.id == selectedId) {
					args.selected = "selected";
				}
				return m("option", args, item.name);
			})
		]);
	},
	/**
	Select2 config factory. The params in this doc refer to properties of the `ctrl` argument
	@param {Object} data - the data with which to populate the <option> list
	@param {prop} value - the prop of the item in `data` that we want to select
	@param {function(Object id)} onchange - the event handler to call when the selection changes.
		`id` is the the same as `value`
	*/
	//	Note: The config is never run server side.
	config: function(ctrl) {
		return function(element, isInitialized) {
			if(typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined') {
				var el = $(element);
				if (!isInitialized) {
					el.select2()
						.on("change", function(e) {
							var id = el.val();
							m.startComputation();
                            //Set the value to the selected option
							ctrl.data.map(function(d){
								if(d.id == id) {
									ctrl.value(d);
								}
							});

							if (typeof ctrl.onchange == "function"){
								ctrl.onchange(el.val());
							}
							m.endComputation();
						});
				}
				el.val(ctrl.value().id).trigger("change");
			} else {
				console.warn('ERROR: You need jquery and Select2 in the page');	
			}
		};
	}
};

var Dashboard = {
    controller: function() {
        var ctrl = this,
          //list of users to show
          data = [
            {id: 1, name: "John"}, 
            {id: 2, name: "Mary"}, 
            {id: 3, name: "Seniqua"}
          ];
      
        ctrl.data = data;
        //  Has to use a prop for the current user
        ctrl.currentUser = m.prop(data[1]);
        ctrl.changeUser = function(id) {
          console.log(id);
        };
    },

    view: function(ctrl) {
        return m("div", [
            m("label", "User:"),
            m.component(Select2, {
              data: ctrl.data, 
              value: ctrl.currentUser, 
              onchange: ctrl.changeUser
            })
        ]);
    }
};

m.mount(document.body, Dashboard);
```

`select2.config` is a factory that creates a `config` function based on a given controller. We declare this outside of the `select2.view` function to avoid cluttering the template.

The `config` function created by our factory only runs the initialization code if it hasn't already. This `if` statement is important, because this function may be called multiple times by Mithril's auto-redrawing system and we don't want to re-initialize select2 at every redraw.

The initialization code defines a `change` event handler. Because this handler is not created using Mithril's templating engine (i.e. we're not defining an attribute in a virtual element), we must manually integrate it to the auto-redrawing system.

This can be done by simply calling `m.startComputation` at the beginning, and `m.endComputation` at the end of the function. You must add a pair of these calls for each asynchronous execution thread, unless the thread is already integrated.

For example, if you were to call a web service using `m.request`, you would not need to add more calls to `m.startComputation` / `m.endComputation` (you would still need the first pair in the event handler, though).

On the other hand, if you were to call a web service using jQuery, then you would be responsible for adding a `m.startComputation` call before the jQuery ajax call, and for adding a `m.endComputation` call at the end of the completion callback, in addition to the calls within the `change` event handler. Refer to the [`auto-redrawing`](auto-redrawing.md) guide for an example.

One important note about the `config` method is that you should avoid calling `m.redraw`, `m.startComputation` and `m.endComputation` in the `config` function's execution thread. (An execution thread is basically any amount of code that runs before other asynchronous threads start to run.)

While Mithril technically does support this use case, relying on multiple redraw passes degrades performance and makes it possible to code yourself into an infinite execution loop situation, which is extremely difficult to debug.

The `dashboard` component in the example shows how a developer would consume the select2 component.

You should always document integration components so that others can find out what attribute parameters can be used to initialize the component.

---

## Integrating to legacy code

If you need to add separate widgets to different places on a same page, you can simply initialize each widget as you would a regular Mithril application (i.e. use `m.render`, `m.mount` or `m.route`).

There's just one caveat: while simply initializing multiple "islands" in this fashion works, their initialization calls are not aware of each other and can cause redraws too frequently. To optimize rendering, you should add a `m.startComputation` call before the first widget initialization call, and a `m.endComputation` after the last widget initialization call in each execution thread.

```javascript
m.startComputation()

m.mount(document.getElementById("widget1-container"), Widget1)

m.mount(document.getElementById("widget2-container"), Widget2)

m.endComputation()
```

