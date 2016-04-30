## Integrating with Other Libraries

Integration with third party libraries or vanilla javascript code can be achieved via the [`config` attribute of virtual elements](mithril.md#accessing-the-real-dom).

It's recommended that you encapsulate integration code in a component or a helper function.

The example below shows a simple component that integrates with the [select2 library](http://ivaynberg.github.io/select2/).

```javascript
// Component containing a Select that uses Select2 for functionality.
var S2Component = {

  // Rendered view for S2
  view: function(ctrl, attrs) {
    var current = attrs.selectedUser;

    return m('select', {
        class: 'select-field',
        config: S2Component._configure
      },
      attrs.data.map(function(item){
        return m('option', {
                  id: item.id,
                  value: item.value,
                  selected: (item.id === current) ? true : false
                }, item.name);
      })
    )
  },

   // Configure function -- called from m('select') in the view
  _configure: function(element, initialized) {

    /*
      Note: This is a use of the config attribute given to
      attributes on mithril objects. Integrating with 3rd
      party DOM manipulation (jQuery) needs {config: function(){}} because
      that's the attribute that exposes the real DOM element (as opposed to
      the virtual DOM element) in the corresponding function so you can access
      and manipulate it.

      the function at the config property in attrs is passed the real DOM element
      (element), and whether or not it exists in the page (initialized)

      Anyways, let's look at using Select2 now.
    */


    // Ensure Externals exist, otherwise we'll error out.
    if(!(jQuery && jQuery.fn.select2))
      return console.error('You need jquery and Select2 in the page')

    // jQuery element
    var lmnt = $(element);

    // If this hasn't been initialized, we can do our setup  
    if(!initialized) {

       lmnt.select2({
        tags: "true",
        placeholder: "Select an option",
        allowClear: true
      });

      // Other logic pertaining to this select also goes here.

      // If you add event listeners that change data and you need your
      // component to know about it, consider adding m.redraw() to the end
      // of this function call.

    }
  }
}

// Primary component.
var MainComponent = {
  controller: function() {
    var ctrl = this;

    // Some arbitrary data
    ctrl.selectedUser = 2;
    ctrl.data = [
          {id: 1, name: 'Alexander Hamilton'},
          {id: 2, name: 'Aaron Burr'},
          {id: 3, name: 'Thomas Jefferson'},
          {id: 4, name: 'John Adams'},
          {id: 5, name: 'James Madison'},
          {id: 6, name: 'Elizabeth Schuyler'},
          {id: 7, name: 'King George'},
          {id: 8, name: 'Marquis de Lafayette'}
        ]
  },

  view: function(ctrl) {
    return m('div', {class: 'select-container'}, [
      m('label', 'Historical Figure: '),
      m(S2Component, {
        selectedUser: ctrl.selectedUser, // Let's just say Burr is the Default.
        data: ctrl.data
      })
    ])
  }
}

m.mount(document.body, MainComponent)

```

[Source code in JSFiddle](https://jsfiddle.net/11pz8afy/9/)


`_config` is a helper function that is called via the `config` attribute in the `select` we render in our `SC2Component.view`

This `_config` function has a guarded `if` statement: `if(!initialized)`, meaning if this component is being instantiated for the first time, we're going to want to do all of the initial setup on the first render. There's a good chance that this component will be redrawn throughout the life of the page, so if that's the case, subsequent redraws will __not__ run the initialization code again, making sure everything in the `_config` function is only initialized once.

The initialization code is simply calling `lmnt.select2()` on the exposed DOM element in order to initialize it. There are other things you can do in this initialization code like adding event handlers to these elements. You must remember that if you modify the DOM or any data that your component relies on inside of this function, you'll need to make sure the component knows to update by adding `m.redraw` (or, in very few cases, `m.startComputation` and `m.endComputation`).

`m.startComputation` and `m.endComputation` are used for asynchronous operations. If you were to call a web service using jQuery, then you would be responsible for adding a `m.startComputation` call before the jQuery ajax call, and for adding a `m.endComputation` call at the end of the completion callback, in addition to the calls within any event handlers. Refer to the [`auto-redrawing`](auto-redrawing.md) guide for an example.

Though possible, you should avoid calling `m.redraw`, `m.startComputation` and `m.endComputation` in the `_config` function's execution thread. (An execution thread is basically any amount of code that runs before other asynchronous threads start to run.) Relying on multiple redraw passes degrades performance and makes it possible to code yourself into an infinite execution loop situation, which is extremely difficult to debug.

The component in the example shows how a developer would consume the `SC2Component`.

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
