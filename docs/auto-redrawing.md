## Integrating with The Auto-Redrawing System

If you need to do custom asynchronous calls without using Mithril's API, and find that your views are not redrawing, or that you're being forced to call [`m.redraw`](mithril.redraw.md) manually, you should consider using `m.startComputation` / `m.endComputation` so that Mithril can intelligently auto-redraw once your custom code finishes running.

In order to integrate asynchronous code to Mithril's autoredrawing system, you should call `m.startComputation` BEFORE making an asynchronous call, and `m.endComputation` after the asynchronous callback completes.

```javascript
//this service waits 1 second, logs "hello" and then notifies the view that
//it may start redrawing (if no other asynchronous operations are pending)
var doStuff = function() {
	m.startComputation(); //call `startComputation` before the asynchronous `setTimeout`
	
	setTimeout(function() {
		console.log("hello");
		
		m.endComputation(); //call `endComputation` at the end of the callback
	}, 1000);
};
```

To integrate synchronous code, call `m.startComputation` at the beginning of the method, and `m.endComputation` at the end.

```javascript
window.onfocus = function() {
	m.startComputation(); //call before everything else in the event handler
	
	doStuff();
	
	m.endComputation(); //call after everything else in the event handler
}
```

For each `m.startComputation` call a library makes, it MUST also make one and ONLY one corresponding `m.endComputation` call.

You should not use these methods if your code is intended to run repeatedly (e.g. by using `setInterval`). If you want to repeatedly redraw the view without necessarily waiting for user input, you should manually call [`m.redraw`](mithril.redraw.md) within the repeatable context.


---

### Integrating multiple execution threads

When [integrating with third party libraries](integration.md), you might find that you need to call asynchronous methods from outside of Mithril's API.

In order to integrate non-trivial asynchronous code with Mithril's auto-redrawing system, you need to ensure all execution threads call `m.startComputation` / `m.endComputation`.

An execution thread is basically any amount of code that runs before other asynchronous threads start to run.

Integrating multiple execution threads can be done in two different ways: in a layered fashion or in comprehensive fashion.

#### Layered integration

Layered integration is recommended for modular code where many different APIs may be put together at the application level.

Below is an example where various methods implemented with a third party library can be integrated in layered fashion: any of the methods can be used in isolation or in combination.

Notice how `doBoth` repeatedly calls `m.startComputation` since that method calls both `doSomething` and `doAnother`. This is perfectly valid: there are three asynchronous computations pending after the `jQuery.when` method is called, and therefore, three pairs of `m.startComputation` / `m.endComputation` in play.

```javascript
var doSomething = function(callback) {
	m.startComputation(); //call `startComputation` before the asynchronous AJAX request
	
	return jQuery.ajax("/something").done(function() {
		if (callback) callback();
		
		m.endComputation(); //call `endComputation` at the end of the callback
	});
};
var doAnother = function(callback) {
	m.startComputation(); //call `startComputation` before the asynchronous AJAX request
	
	return jQuery.ajax("/another").done(function() {
		if (callback) callback();
		m.endComputation(); //call `endComputation` at the end of the callback
	});
};
var doBoth = function(callback) {
	m.startComputation(); //call `startComputation` before the asynchronous synchronization method
	
	jQuery.when(doSomething(), doAnother()).then(function() {
		if (callback) callback();
		
		m.endComputation(); //call `endComputation` at the end of the callback
	})
};
```

#### Comprehensive integration

Comprehensive integration is recommended if integrating a monolithic series of asynchronous operations. In contrast to layered integration, it minimizes the number of `m.startComputation` / `m.endComputation` calls to avoid clutter.

The example below shows a convoluted series of AJAX requests implemented with a third party library.

```javascript
var doSomething = function(callback) {
	m.startComputation(); //call `startComputation` before everything else
	
	jQuery.ajax("/something").done(function() {
		doStuff();
		jQuery.ajax("/another").done(function() {
			doMoreStuff();
			jQuery.ajax("/more").done(function() {
				if (callback) callback();
				
				m.endComputation(); //call `endComputation` at the end of everything
			});
		});
	});
};
```
