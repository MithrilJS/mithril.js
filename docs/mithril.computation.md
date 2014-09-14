## m.startComputation / m.endComputation

---

[How auto-redrawing-works](#how-auto-redrawing-works)
[Integrating multiple execution threads](#integrating-multiple-execution-threads)
[Integrating to legacy code](#integrating-to-legacy-code)
[Signature](#signature)

---

Typically, `m.startComputation` / `m.endComputation` don't need to be called from application space. These methods are only intended to be used by people who are writing libraries that do things asynchronously, or when calling vanilla javascript asynchronous functions from template [`config`](mithril.md#accessing-the-real-dom) functions.

If you need to do custom asynchronous calls without using Mithril's API, and find that your views are not redrawing, or that you're being forced to call [`m.redraw`](mithril.redraw.md) manually, you should consider using `m.startComputation` / `m.endComputation` so that Mithril can intelligently auto-redraw once your custom code finishes running.

In order to integrate an asynchronous code to Mithril's autoredrawing system, you should call `m.startComputation` BEFORE making an asynchronous call, and `m.endComputation` after the asynchronous callback completes.

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

Note that failing to call `endComputation` after a respective `startComputation` call will halt the redrawing system. It's a good idea to wrap exception-prone code in a `try` block and call `m.endComputation` from within the respective `finally` block, in order to prevent rendering from halting.

```javascript
window.onfocus = function() {
	m.startComputation();
	
	try {
		doStuff();
	}
	finally {
		m.endComputation(); //redraw regardless of whether `doStuff` threw errors
	}
}
```

---

### How auto-redrawing works

The auto-redrawing system in Mithril is not affected by changes in values of `m.prop` getter-setters. Instead, Mithril relies on `m.startComputation` and `m.endComputation` calls to figure out when to redraw.

Mithril has an internal counter, which is incremented every time `m.startComputation` is called, and decremented every time `m.endComputation` is called. Once the counter reaches zero, Mithril redraws. Mithril internally calls this pair of functions when you call [`m.module`](mithril.module.md), [`m.route`](mithril.route.md), [`m.request`](mithril.request.md), and whenever an event defined with [`m()`](mithril.md) is triggered.

So calling `m.request` multiple times from a controller context increments the internal counter. Once each request completes, the counter is decremented. The end result is that Mithril waits for all requests to complete before attempting to redraw. This also applies for asynchronous functions called from 3rd party libraries or from vanilla javascript, if they call this pair of functions.

The reason Mithril waits for all asynchronous services to complete before redrawing is to avoid wasteful browser repaints, and to minimize the need for null reference checks in templates.

It's possible to opt out of the redrawing schedule by using the `background` option for `m.request`, or by simply not calling `m.startComputation` / `m.endComputation` when calling non-Mithril asynchronous functions.

---

### Integrating multiple execution threads

When [integrating with third party libraries](integration.md), you might find that you need to call asynchronous methods from outside of Mithril's API.

In order to integrate non-trivial asynchronous code to Mithril's auto-redrawing system, you need to ensure all execution threads call `m.startComputation` / `m.endComputation`.

An execution thread is basically any amount of code that runs before other asynchronous threads start to run.

Integrating multiple execution threads can be done in a two different ways: in a layered fashion or in comprehensive fashion

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

Comprehensive integration is recommended if integrating a monolithic series of asynchronous operations. In contrast to layered integration, it minimizes the number of `m.startComputation` / `m.endComputation` to avoid clutter.

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

---

### Integrating to legacy code

If you need to add separate widgets to different places on a same page, you can simply initialize each widget as you would a regular Mithril application (i.e. use `m.render`, `m.module` or `m.route`).

There's just one caveat: while simply initializing multiple "islands" in this fashion works, their initialization calls are not aware of each other and can cause redraws too frequently. To optimize rendering, you should add a `m.startComputation` call before the first widget initialization call, and a `m.endComputation` after the last widget initialization call in each execution thread.

```
m.startComputation()

m.module(document.getElementById("widget1-container"), widget1)

m.module(document.getElementById("widget2-container"), widget1)

m.endComputation()
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void startComputation()
```

```clike
void endComputation()
```