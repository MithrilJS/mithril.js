## m.sync

This method takes a list of promises and returns a promise that resolves when all promises in the input list have resolved. See [`m.deferred`](mithril.deferred) for more information on promises.

---

### Usage

```javascript
var greetAsync = function(delay) {
	var deferred = m.deferred();
	setTimeout(function() {
		deferred.resolve("hello");
	}, delay);
	return deferred.promise;
};

m.sync([
	greetAsync(1000),
	greetAsync(1500)
]).then(function(args) {
	console.log(args); // ["hello", "hello"]
});
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Promise sync(Array<Promise> promises)

where:
	Promise :: GetterSetter { Promise then(any successCallback(any value), any errorCallback(any value)) }
	GetterSetter :: any getterSetter([any value])
```

-	**Array<Promise> promises**

	A list of promises to synchronize
	
-	**return Promise promise**

	The promise of the deferred object that is resolved when all input promises have been resolved
	
	The callbacks for this promise receive as a parameter an Array containing the values of all the input promises