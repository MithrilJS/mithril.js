## The Auto-Redrawing System

Mithril is designed around the principle that data always flows from the model to the view. This makes it easy to reason about the state of the UI and to test it. In order to implement this principle, the rendering engine must run a redraw algorithm globally to ensure no parts of the UI are out of sync with the data. While at first glance, it may seem expensive to run a global redraw every time data changes, Mithril makes it possible to do this efficiently thanks to its fast diffing algorithm, which only updates the DOM where it needs to be updated. Because the DOM is by far the largest bottleneck in rendering engines, Mithril's approach of running a diff against a virtual representation of the DOM and only batching changes to the real DOM as needed is surprisingly performant.

In addition, Mithril attempts to intelligently redraw only when it is appropriate in an application lifecycle. Most frameworks redraw aggressively and err on the side of redrawing too many times because, as it turns out, determining the best time to do a redraw is quite complicated if we want to be as efficient as possible.

Mithril employs a variety of mechanisms to decide the best time and the best strategy to redraw. By default, Mithril is configured to auto-redraw from scratch after component controllers are initialized, and it is configured to diff after event handlers are triggered. In addition, it's possible for non-Mithril asynchronous callbacks to trigger auto-redrawing by calling `m.startComputation` and `m.endComputation` in appropriate places (see below). Any code that is between a `m.startComputation` and its respective `m.endComputation` call is said to live in the *context* of its respective pair of function calls.

It's possible to defer a redraw by calling `m.request` or by manually nesting [`m.startComputation` and `m.endComputation`](mithril.computation.md) contexts. The way the redrawing engine defers redrawing is by keeping an internal counter that is incremented by `m.startComputation` and decremented by `m.endComputation`. Once that counter reaches zero, Mithril redraws. By strategically placing calls to this pair of functions, it is possible to stack asynchronous data services in any number of ways within a context without the need to pass state variables around the entire application. The end result is that you can call `m.request` and other integrated data services seamlessly, and Mithril will wait for all of the asynchronous operations to complete before attempting to redraw.

In addition to being aware of data availability when deciding to redraw, Mithril is also aware of browser availability: if several redraws are triggered in a short amount of time, Mithril batches them so that at most only one redraw happens within a single animation frame (around 16ms). Since computer screens are not able to display changes faster than a frame, this optimization saves CPU cycles and helps UIs stay responsive even in the face of spammy data changes.

Mithril also provides several hooks to control its redrawing behavior with a deep level of granularity: [`m.startComputation` and `m.endComputation`](mithril.computation.md) create redrawable contexts. [`m.redraw`](mithril.redraw.md) forces a redraw to happen in the next available frame (or optionally, it can redraw immediately for synchronous processing). The [config's retain flag](mithril.md#persisting-dom-elements-across-route-changes) can be used to change how specific elements are redrawn when routes change. [`m.redraw.strategy`](mithril.redraw.md#strategy) can change the way Mithril runs the next scheduled redraw. Finally, the low-level [`m.render`](mithril.render.md) can also be used if a developer chooses to opt out of rest of the framework altogether.

---

### Integrating with The Auto-Redrawing System

If you need to do custom asynchronous calls without using Mithril's API, and find that your views are not redrawing automatically, you should consider using `m.startComputation` / `m.endComputation` so that Mithril can intelligently auto-redraw once your custom code finishes running.

In order to integrate asynchronous code to Mithril's autoredrawing system, you should call `m.startComputation` BEFORE making an asynchronous call, and `m.endComputation` at the end of the asynchronous callback.

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

If you want to a recurring callback (such as `setInterval` or a web socket event handler) to trigger redraws, you should call `m.startComputation` at the beginning of the function, not outside of it.

```
setInterval(function() {
	m.startComputation(); //call before everything else in the event handler
	
	doStuff();
	
	m.endComputation(); //call after everything else in the event handler
})
```

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
