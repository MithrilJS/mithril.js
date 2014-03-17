## m.deferred

This is a low-level method in Mithril. It's a modified version of the Thenable API.

A deferred is an asynchrony monad. It exposes a `promise` property which can *bind* callbacks to build a computation tree.

The deferred object can then *apply* a value by calling either `resolve` or `reject`, which then dispatches the value to be processed to the computation tree.

Each computation function takes a value as a parameter and is expected to return another value, which in turns is forwarded along to the next computation function (or functions) in the tree.

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
	
	

	