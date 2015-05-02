## m.startComputation / m.endComputation

---

- [How auto-redrawing works](#how-auto-redrawing-works)
- [Difference between computation methods and m.redraw](#difference-between-computation-methods-and-m-redraw)
- [Integrating multiple execution threads](#integrating-multiple-execution-threads)
- [Integrating to legacy code](#integrating-to-legacy-code)
- [Signature](#signature)

---

Typically, `m.startComputation` / `m.endComputation` don't need to be called from application space. These methods are only intended to be used by people who are writing libraries that do things asynchronously, or when calling vanilla javascript asynchronous functions from template [`config`](mithril.md#accessing-the-real-dom) functions.

If you need to do custom asynchronous calls without using Mithril's API, and find that your views are not redrawing, you should consider using `m.startComputation` / `m.endComputation` so that Mithril can intelligently auto-redraw once your custom code finishes running.

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

Mithril has an internal counter, which is incremented every time `m.startComputation` is called, and decremented every time `m.endComputation` is called. Once the counter reaches zero, Mithril redraws. Mithril internally calls this pair of functions when you call [`m.mount`](mithril.mount.md), [`m.route`](mithril.route.md), [`m.request`](mithril.request.md), and whenever an event defined with [`m()`](mithril.md) is triggered.

So calling `m.request` multiple times from a controller context increments the internal counter. Once each request completes, the counter is decremented. The end result is that Mithril waits for all requests to complete before attempting to redraw. This also applies for asynchronous functions called from 3rd party libraries or from vanilla javascript, if they call this pair of functions.

The reason Mithril waits for all asynchronous services to complete before redrawing is to avoid wasteful browser repaints, and to minimize the need for null reference checks in templates.

It's possible to opt out of the redrawing schedule by using the `background` option for `m.request`, or by simply not calling `m.startComputation` / `m.endComputation` when calling non-Mithril asynchronous functions.

```javascript
//`background` option example
var component = m.component({
	controller: function() {
		//setting `background` allows the component to redraw immediately, without waiting for the request to complete
		m.request({method: "GET", url: "/foo", background: true})
	},
	//...
})
```

It's also possible to modify the strategy that Mithril uses for any given redraw, by using [`m.redraw.strategy`](mithril.redraw.md#changing-redraw-strategy). Note that changing the redraw strategy only affects the next scheduled redraw. After that, Mithril resets the `m.redraw.strategy` flag to either "all" or "diff" depending on whether the redraw was due to a route change or whether it was triggered by some other action.

```javascript
//diff when routing, instead of redrawing from scratch
//this preserves the `<input>` element and its 3rd party plugin after route changes, since the `<input>` doesn't change
var Component1 = m.component({
	controller: function() {
		m.redraw.strategy("diff")
	},
	view: function() {
		return m("div", [
			m("h1", "Hello Foo"),
			m("input", {config: plugin}) //assuming `plugin` initializes a 3rd party library
		])
	}
})

var Component2 = m.component({
	controller: function() {
		m.redraw.strategy("diff")
	},
	view: function() {
		return m("div", [
			m("h1", "Hello Bar"),
			m("input", {config: plugin}) //assuming `plugin` initializes a 3rd party library
		])
	}
})

m.route(document.body, "/foo", {
	"/foo": Component1,
	"/bar": Component2,
})
```

```javascript
//model
var saved = false
function save(e) {
	if (e.keyCode == 13) {
		//this causes a redraw, since event handlers active auto-redrawing by default
		saved = true
	}
	else {
		//we don't care about other keys, so don't redraw
		m.redraw.strategy("none")
	}
}

//view
var view = function() {
	return m("div", [
		m("button[type=button]", {onkeypress: save}, "Save"),
		saved ? "Saved" : ""
	])
}
```

---

### Difference between computation methods and m.redraw

The `m.startComputation` / `m.endComputation` pair is designed to be "stacked", i.e. multiple asynchronous services can each call this pair of functions to indicate that they want the redrawing algorithm to wait for them to finish before a redraw occurs. In contrast, `m.redraw` is "aggressive": it redraws as many times as it is called (with the caveat that redraws are batched if they occur less than one animation frame apart in time). In practice, this means that calling `m.redraw` may cause a redraw to happen before some AJAX calls have finished, which in turn, may cause null reference exceptions in templates that try to use the data from these requests without first checking that the data exists.

Therefore, using the computation methods is recommended in order to reduce the amount of intermediate redraws that would otherwise occur as multiple asynchronous services are resolved.

When computation methods are used dilligently and religiously, templates are never redrawn with incomplete data. However, it's important to always write conditional tests in templates to account for the possibility of nullables, because redraws may come to occur more aggressively than data is available (perhaps because a newly introduced 3rd party library calls `m.redraw`, or because you might want a more aggressive redraw policy to implement a specific feature down the road).

Defending against nullables can typically be achieved via the `initialValue` option in [`m.request`](mithril.request.md) and basic null checks (e.g. `data ? m("div", data) : null`).

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

If you need to add separate widgets to different places on a same page, you can simply initialize each widget as you would a regular Mithril application (i.e. use `m.render`, `m.mount` or `m.route`).

There's just one caveat: while simply initializing multiple "islands" in this fashion works, their initialization calls are not aware of each other and can cause redraws too frequently. To optimize rendering, you should add a `m.startComputation` call before the first widget initialization call, and a `m.endComputation` after the last widget initialization call in each execution thread.

```
m.startComputation()

m.mount(document.getElementById("widget1-container"), Widget1)

m.mount(document.getElementById("widget2-container"), Widget2)

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
