## m.deferred

---

- [Usage](#usage)
- [Retrieving a value via the getter-setter API](#retrieving-a-value-via-the-getter-setter-api)
- [Integrating to the Mithril redrawing system](#integrating-to-the-mithril-redrawing-system)
- [Differences from Promises/A+](#differences-from-promises-a-)
- [The exception monitor](#the-exception-monitor)
- [Signature](#signature)

---

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

The promise object is actually a getter-setter function that gets populated when the promise is fulfilled.

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

By default, promises are not integrated to the Mithril auto-redrawing system. When dealing with asynchronous functions, you must call [`m.startComputation` / `m.endComputation`] if you want the asynchronous payload to affect the view.

```javascript
//asynchronous service
var greetAsync = function() {
	//tell Mithril to wait for this service to complete before redrawing
	m.startComputation();

	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");

		//the service is done, tell Mithril that it may redraw
		m.endComputation();
	}, 1000);
	return deferred.promise;
};
```

Some cases may not require a redraw upon completion of the asynchronous callbacks. In such cases, simply omit the m.startComputation/m.endComputation calls.

Some asynchronous operations might need to affect redrawing both before and after their completion. In those cases, you can call [`m.redraw`](mithril.redraw.md) instead of using m.startComputation/m.endComputation.

```javascript
//asynchronous service
var greetAsync = function() {
	//don't wait for this service; redraw right away
	
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");

		//redraw again
		m.redraw()
	}, 1000);
	return deferred.promise;
};
```

---

### Differences from Promises/A+

For the most part, Mithril promises behave as you'd expect a [Promise/A+](http://promises-aplus.github.io/promises-spec/) promise to behave, but have one difference: Mithril promises attempt to execute synchronously if possible.

#### Synchronous execution

Mithril promises attempt to execute synchronously if possible. To illustrate the difference between Mithril and A+ promises, consider the code below:

```javascript
var deferred = m.deferred()

deferred.promise.then(function() {
	console.log(1)
})

deferred.resolve("value")

console.log(2)
```

In the example above, A+ promises are required to log `2` before logging `1`, whereas Mithril logs `1` before `2`. Typically `resolve`/`reject` are called asynchronously after the `then` method is called, so normally this difference does not matter.

There are a couple of reasons why Mithril runs callbacks synchronously. Conforming to the spec requires either a `setImmediate` polyfill (which is a significantly large library), or `setTimeout` (which is required to take at least 4 milliseconds per call, according to its specs). Neither of these trade-offs are acceptable, given Mithril's focus on nimbleness and performance.

#### Unchecked Error Handling

By default, Mithril does not swallow errors if these errors are subclasses of the Error class. Manually throwing an instance of the Error class itself (or any other objects or primitives) does trigger the rejection callback path as per the Promises/A+ spec.

This deviation from the spec is there to make it easier for developers to find common logical errors such as typos that lead to null reference exceptions. By default, the spec requires that all thrown errors trigger rejection, which result in silent failures if the developer forgets to explicitly handle the failure case.

For example, there is simply never a case where a developer would want to programmatically handle the error of accessing the property of a nullable entity without first checking for its existence. The only reasonable course of action to prevent the potential null reference exceptions in this case is to add the existence check in the source code. It is expected that such an error would bubble up to the console and display a developer-friendly error message and line number there.

```javascript
m.request({method: "GET", url: "/things"})
	.then(function(items) {
		item.foreach(doSomething) //programmer error: typo will throw runtime error to the console
	})
```

The other side of the coin is still supported: if a developer needs to signal an exceptional condition within a promise callback, they can manually throw a `new Error` (for example, if a validation rule failed, and there should be an error message displayed to the user).

```javascript
var error = m.prop()
m.request({method: "GET", url: "/user/:id", data: {id: 1}})
	.then(function(user) {
		if (!user.isAdmin) throw new Error("Sorry, you don't have permissions")
	})
	.then(null, error) //handle the application error: bind to a getter-setter for diplaying it on the template
```

Note that the default promise exception handling semantics can be modified. See the next section.

---

### The exception monitor

Any time an exception is thrown inside a promise callback, Mithril calls `m.deferred.onerror(e)`.

By default, this event handler rethrows the exception to the console if an error is a subclass of Error (but not an instance of Error itself). Otherwise it follows the Promises/A+ specifications. It does this because people expect unexpected errors like null reference exceptions to be thrown to the console for debugging purposes, and these errors are always subclasses of Error.

On the other hand, javascript developers rarely ever throw errors that are subclasses of Error, and for the purposes of application error handling, the underlying prototypal chain of the error class is typically not relevant.

The `onerror` function can be safely replaced if the default error monitoring semantics are not desired.

```
//swallow all errors
m.deferred.onerror = function() {}

//only log errors
m.deferred.onerror = function(e) {console.error(e)}
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Deferred deferred() {void onerror(Error e)}

where:
	Deferred :: Object { Promise promise, void resolve(any value), void reject(any value) }
	Promise :: GetterSetter { Promise then(any successCallback(any value), any errorCallback(any value)), Promise catch(any errorCallback(any value)) }
	GetterSetter :: any getterSetter([any value])
```

-	**GetterSetter { Promise then([any successCallback(any value) [, any errorCallback(any value)]]) } promise**

	A promise has a method called `then` which takes two computation callbacks as parameters.

	The `then` method returns another promise whose computations (if any) receive their inputs from the parent promise's computation.

	A promise is also a getter-setter (see [`m.prop`](mithril.prop.md)). After a call to either `resolve` or `reject`, it holds the result of the parent's computation (or the `resolve`/`reject` value, if the promise has no parent promises)
	
	Promises also have a method called `catch`, which is equivalent to calling `then(null, errorCallback)`

	-	**Promise then([any successCallback(any value) [, any errorCallback(any value)]])**

		This method accepts two callbacks which process a value passed to the `resolve` and `reject` methods, respectively, and pass the processed value to the returned promise

		-	**any successCallback(any value)** (optional)

			The `successCallback` is called if `resolve` is called in the root `deferred`.

			The default value (if this parameter is falsy) is the identity function `function(value) {return value}`

			If this function returns undefined, then it passes the `value` argument to the next step in the thenable queue, if any

		-	**any errorCallback(any value)** (optional)

			The `errorCallback` is called if `reject` is called in the root `deferred`.

			The default value (if this parameter is falsy) is the identity function `function(value) {return value}`

			If this function returns undefined, then it passes the `value` argument to the next step in the thenable queue, if any

		-	**returns Promise promise**

-	**void resolve(any value)**

	This method passes a value to the `successCallback` of the deferred object's child promise

-	**void reject(any value)**

	This method passes a value to the `errorCallback` of the deferred object's child promise

-	<a name="onerror"></a>

	#### m.deferred.onerror

	**void onerror(Error e)**

	This method gets called every time an exception is thrown inside a promise callback. By default, it rethrows to the console if an error is a subclass of Error (but not an instance of Error itself). Otherwise it follows the Promises/A+ specifications.
