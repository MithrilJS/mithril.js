## m.deferred

This is a low-level method in Mithril. It's a modified version of the Thenable API.

A deferred is an asynchrony monad. It exposes a `promise` property which can *bind* callbacks to build a computation tree.

The deferred object can then *apply* a value by calling either `resolve` or `reject`, which then dispatches the value to be processed to the computation tree.

Each computation function takes a value as a parameter and is expected to return another value, which in turns is forwarded along to the next computation function (or functions) in the tree.

The deferred object returned by `m.deferred` has two methods: `resolve` and `reject`, and one property called `promise`. The methods can be called to dispatch a value to the promise tree. The `promise` property is the root of the promise tree. It has a method `then` which takes a `successCallback` and a `errorCallback` callbacks. Calling the `then` method attaches the computations represented by `successCallback` and `errorCallback` to the promise, which will be called when either `resolve` or `reject` is called. The `then` method returns a child promise, which, itself, can have more child promises, recursively.

The `promise` object is actually a function - specifically, it's an [`m.prop`](mithril.prop.md) getter-setter, which gets populated with the value returned by  `successCallback` if the promise is resolved successfully.

Note that Mithril promises are not automatically integrated to its automatic redrawing system. If you wish to use third party asynchronous libraries (for example, `jQuery.ajax`), you should also consider using [`m.startComputation` / `m.endComputation`](mithril.computation.md) if you want views to redraw after requests complete.

---

### Usage

```javascript
//standalone usage
var greetAsync = function() {
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");
	}, 1000);
	return deferred.promise;
};

greetAsync()
	.then(function(value) {return value + " world"})
	.then(function(value) {console.log(value)}); //logs "hello world" after 1 second
```

---

#### Retrieving a value via the getter-setter API

```javascript
//asynchronous service
var greetAsync = function() {
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");
	}, 1000);
	return deferred.promise;
};

//asynchronous consumer
var greeting = greetAsync()
var processed = greeting.then(function(value) {return value + " world"})

console.log(greeting()) // undefined - because `deferred.resolve` has not been called yet

setTimeout(function() {
	//now `deferred.resolve` has been called
	console.log(greeting()) // "hello"
	console.log(processed()) // "hello world"
}, 2000)
```

---

#### Integrating to the Mithril redrawing system

```javascript
//asynchronous service
var greetAsync = function() {
	m.startComputation();
	
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");
		
		m.endComputation();
	}, 1000);
	return deferred.promise;
};
```

---

### Recoverable vs Unrecoverable errors

Recoverable errors are exceptions that are deliberately thrown by the application developer to signal an abnormal condition in the business logic. You can throw errors in this way if a computation needs to forward a failure condition to downstream promises.

In the example below we throw a recoverable error. It rejects the subsequent promise, and logs the string `"error"` to the console

```javascript
//standalone usage
var greetAsync = function() {
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");
	}, 1000);
	return deferred.promise;
};

greetAsync()
	.then(function(data) {
		if (data != "hi") throw new Error("wrong greeting")
	})
	.then(function() {
		console.log("success")
	}, function() {
		console.log("error")
	})
```

Unrecoverable errors are exceptions that happen at runtime due to bugs in the code.

In the example below, calling the inexistent `foo.bar.baz` triggers a `ReferenceError`. Mithril does not handle this error in any way: it aborts execution and dumps the error information in the console.

```javascript
//standalone usage
var greetAsync = function() {
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");
	}, 1000);
	return deferred.promise;
};

greetAsync().then(function() {
	foo.bar.baz()
})
```

---

### Differences from Promises/A+

For the most part, Mithril promises behave as you'd expect a [Promise/A+](http://promises-aplus.github.io/promises-spec/) promise to behave, but with a few key differences:

Mithril promises forward a value downstream if a resolution callback returns `undefined`. This allows simpler debugging of promise chains:

```javascript
var data = m.request({method: "GET", url: "/data"})
	.then(console.log) //Mithril promises let us debug like this
	.then(doStuff)
	
var data = m.request({method: "GET", url: "/data"})
	.then(function(value) { // Promises/A+ would require us to declare an anonymous function
		console.log(value) // here's the debugging snippet
		return value // and we need to remember to return the value as well
	})
	.then(doStuff) // or else `doStuff` will break

```

Another subtle difference is that the Promises/A+ require a callback to run in a different execution context than its respective `then` method. This requirement exists to support an obscure edge cases and incurs [a significant performance hit on each link of a promise chain](http://thanpol.as/javascript/promises-a-performance-hits-you-should-be-aware-of/). To be more specific, the performance hit can come either in the form of a 4ms minimum delay (if the implementation uses `setTimeout`), or from having to load a [bunch of hacky polyfill code](https://raw.githubusercontent.com/NobleJS/setImmediate/master/setImmediate.js) for a [feature that is not being considered for addition by some browser vendors](https://developer.mozilla.org/en-US/docs/Web/API/Window.setImmediate).

To illustrate the difference between Mithril and A+ promises, consider the code below:

```javascript
var deferred = m.deferred()

deferred.promise.then(function() {
	console.log(1)
})

deferred.resolve("value")

console.log(2)
```

In the example above, A+ promises are required to log `2` before logging `1`, whereas Mithril logs `1` before `2`. Typically `resolve`/`reject` are called asynchronously after the `then` method is called, so normally this difference does not matter.

One final difference is in how Mithril handles exceptions: if exceptions are thrown from within a success or error callbacks, A+ promises always reject the downstreams (and thus swallow the exception). Mithril does so only with errors that are subclasses of the Error class. Errors that are instances of the Error class itself are not caught by Mithril. This allows unrecoverable runtime errors to get thrown to the console w/ standard stack traces, while allowing developers to create application-space errors normally.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Deferred deferred()

where:
	Deferred :: Object { Promise promise, void resolve(any value), void reject(any value) }
	Promise :: GetterSetter { Promise then(any successCallback(any value), any errorCallback(any value)) }
	GetterSetter :: any getterSetter([any value])
```

-	**GetterSetter { Promise then([any successCallback(any value) [, any errorCallback(any value)]]) } promise**

	A promise has a method called `then` which takes two computation callbacks as parameters.
	
	The `then` method returns another promise whose computations (if any) receive their inputs from the parent promise's computation.
	
	A promise is also a getter-setter (see [`m.prop`](mithril.prop)). After a call to either `resolve` or `reject`, it holds the result of the parent's computation (or the `resolve`/`reject` value, if the promise has no parent promises)
	
	-	**Promise then([any successCallback(any value) [, any errorCallback(any value)]])**
	
		This method accepts two callbacks which process a value passed to the `resolve` and `reject` methods, respectively, and pass the processed value to the returned promise
		
		-	**any successCallback(any value)** (optional)
		
			The `successCallback` is called if `resolve` is called in the root `deferred`.
			
			The default value (if this parameter is falsy) is the identity function `function(value) {return value}`
			
			If this function returns undefined, then it passes the `value` argument to the next step in the thennable queue, if any
			
		-	**any errorCallback(any value)** (optional)
		
			The `errorCallback` is called if `reject` is called in the root `deferred`.
			
			The default value (if this parameter is falsy) is the identity function `function(value) {return value}`
			
			If this function returns undefined, then it passes the `value` argument to the next step in the thennable queue, if any
			
		-	**returns Promise promise**

-	**void resolve(any value)**
	
	This method passes a value to the `successCallback` of the deferred object's child promise
	
-	**void reject(any value)**
	
	This method passes a value to the `errorCallback` of the deferred object's child promise
	
	

	