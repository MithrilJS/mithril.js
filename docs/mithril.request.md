## m.request

This is a high-level utility for working with web services, which allows writing asynchronous code relatively procedurally.

By default, it assumes server responses are in JSON format and optionally instantiates a class with the response data.

It provides a number of useful features out of the box:

-	The ability to get an early reference to a container that will hold the asynchronous response
-	The ability to queue operations to be performed after the asynchronous request completes
-	The ability to "cast" the response to a class of your choice
-	The ability to unwrap data in a response that includes metadata properties

---

### Basic usage

The basic usage pattern for `m.request` returns an [`m.prop`](mithril.prop.md) getter-setter, which is populated when the AJAX request completes.

The returned getter-setter can be thought of as a box: you can pass this reference around cheaply, and you can "unwrap" its value when needed.

```javascript
var users = m.request({method: "GET", url: "/user"});

//assuming the response contains the following data: `[{name: "John"}, {name: "Mary"}]`
//then when resolved (e.g. in a view), the `users` getter-setter will contain a list of users
//i.e. users() //[{name: "John"}, {name: "Mary"}]
```

Note that this getter-setter holds an *undefined* value until the AJAX request completes. Attempting to unwrap its value early will likely result in errors.

The returned getter-setter also implements the [promise](mithril.deferred.md) interface (also known as a *thennable*): this is the mechanism you should always use to queue operations to be performed on the data from the web service.

The simplest use case of this feature is to implement functional value assignment via `m.prop` (i.e. the same thing as above). You can bind a pre-existing getter-setter by passing it in as a parameter to a `.then` method:

```javascript
var users = m.prop([]); //default value

m.request({method: "GET", url: "/user"}).then(users)
//assuming the response contains the following data: `[{name: "John"}, {name: "Mary"}]`
//then when resolved (e.g. in a view), the `users` getter-setter will contain a list of users
//i.e. users() //[{name: "John"}, {name: "Mary"}]
```

This syntax allows you to bind intermediate results before piping them down for further processing, for example:

```javascript
var users = m.prop([]); //default value
var doSomething = function() { /*...*/ }

m.request({method: "GET", url: "/user"}).then(users).then(doSomething)
```

While both basic assignment syntax and thennable syntax can be used to the same effect, typically it's recommended that you use the assignment syntax whenever possible, as it's easier to read.

The thennable mechanism is intended to be used in three ways:

-	in the model layer: to process web service data in transformative ways (e.g. filtering a list based on a parameter that the web service doesn't support)
-	in the controller layer: to bind redirection code upon a condition
-	in the controller layer: to bind error messages

#### Processing web service data

This step is meant to be done in the model layer. Doing it in the controller level is also possible, but philosophically not recommended, because by tying logic to a controller, the code becomes harder to reuse due to unrelated controller dependencies.

In the example below, the `listEven` method returns a getter-setter that resolves to a list of users containing only users whose id is even.

```javascript
//model
var User = {}

User.listEven = function() {
	return m.request({method: "GET", url: "/user"}).then(function(list) {
		return list.filter(function(user) {return user.id % 2 == 0});
	});
}

//controller
var controller = function() {
	this.users = User.listEven()
}
```

#### Bind redirection code

This step is meant to be done in the controller layer. Doing it in the model level is also possible, but philosophically not recommended, because by tying redirection to the model, the code becomes harder to reuse due to overly tight coupling.

In the example below, we use the previously defined `listEven` model method and queue a controller-level function that redirects to another page if the user list is empty.

```javascript
//controller
var controller = function() {
	this.users = User.listEven().then(function(users) {
		if (users.length == 0) m.route("/add");
	})
}
```

#### Binding errors

Mithril thennables take two functions as optional parameters: the first parameter is called if the web service request completes successfully. The second one is called if it completes with an error.

Error binding is meant to be done in the controller layer. Doing it in the model level is also possible, but generally leads to more code in order to connect all the dots.

In the example below, we bind an error getter-setter to our previous controller so that the `error` variable gets populated if the server throws an error.

```javascript
//controller
var controller = function() {
	this.error = m.prop("")
	
	this.users = User.listEven().then(function(users) {
		if (users.length == 0) m.route("/add");
	}, this.error)
}
```

If the controller doesn't already have a success callback to run after a request resolves, you can still bind errors like this:

```javascript
//controller
var controller = function() {
	this.error = m.prop("")
	
	this.users = User.listEven().then(null, this.error)
}
```

---

### Queuing Operations

As you saw, you can chain operations that act on the response data. Typically this is required in three situations:

-	in model-level methods if client-side processing is needed to make the data useful for a controller or view.
-	in the controller, to redirect after a model service resolves.
-	in the controller, to bind error messages

In the example below, we take advantage of queuing to debug the AJAX response data prior to doing further processing on the user list

```javascript
var users = m.request({method: "GET", url: "/user"})
	.then(console.log);
	.then(function(users) {
		//add one more user to the response
		return users.concat({name: "Jane"})
	})

//assuming the response contains the following data: `[{name: "John"}, {name: "Mary"}]`
//then when resolved (e.g. in a view), the `users` getter-setter will contain a list of users
//i.e. users() //[{name: "John"}, {name: "Mary"}, {name: "Jane"}]
```

---

### Casting the Response Data to a Class

It's possible to auto-cast a JSON response to a class. This is useful when we want to control access to certain properties in an object, as opposed to exposing all the fields in POJOs (plain old Javascript objects) for arbitrary processing.

In the example below, `User.list` returns a list of `User` instances.

```javascript
var User = function(data) {
	this.name = m.prop(data.name);
}

User.list = function() {
	return m.request({method: "GET", url: "/user", type: User});
}

var users = User.list();
//assuming the response contains the following data: `[{name: "John"}, {name: "Mary"}]`
//then when resolved (e.g. in a view), `users` will contain a list of User instances
//i.e. users()[0].name() == "John"
```

---

### Unwrapping Response Data

Often, web services return the relevant data wrapped in objects that contain metadata.

Mithril allows you to unwrap the relevant data, by providing two callback hooks: `unwrapSuccess` and `unwrapError`.

These hooks allow you to unwrap different parts of the response data depending on whether it succeed or failed.

```javascript
var users = m.request({
	method: "GET",
	url: "/user",
	unwrapSuccess: function(response) {
		return response.data;
	},
	unwrapError: function(response) {
		return response.error;
	}
});

//assuming the response is: `{data: [{name: "John"}, {name: "Mary"}], count: 2}`
//then when resolved (e.g. in a view), the `users` getter-setter will contain a list of users
//i.e. users() //[{name: "John"}, {name: "Mary"}]
```

---

### Using Different Data Transfer Formats

By default, `m.request` uses JSON to send and receive data to web services. You can override this by providing `serialize` and `deserialize` options:

```javascript
var users = m.request({
	method: "GET",
	url: "/user",
	serialize: mySerializer,
	deserialize: myDeserializer
});
```

One typical way to override this is to receive as-is responses. The example below shows how to receive a plain string from a txt file.

```javascript
var file = m.request({
	method: "GET",
	url: "myfile.txt",
	deserialize: function(value) {return value;}
});
```

---

### Using variable data formats

By default, Mithril assumes both success and error responses are in JSON format, but some servers may not return JSON responses when returning HTTP error codes (e.g. 404)

You can get around this issue by using `extract`

```javascript
var nonJsonErrors = function(xhr) {
  return xhr.status > 200 ? JSON.stringify(xhr.responseText) : xhr.responseText
}

m.request({method: "GET", url: "/foo/bar.x", extract: nonJsonErrors})
  .then(function(data) {}, function(error) {console.log(error)})
```

---

### Extracting Metadata from the Response

The `extract` method can be used to read metadata from HTTP response headers or the status field of an XMLHttpRequest.

```javascript
var extract = function(xhr, xhrOptions) {
	if (xhrOptions.method == "HEAD") return xhr.getResponseHeader("x-item-count")
	else return xhr.responseText
}

m.request({method: "POST", url: "/foo", extract: extract});
```

---

### Configuring the underlying XMLHttpRequest

The `config` option can be used to arbitrarily configure the native XMLHttpRequest instance and to access properties that would not be accessible otherwise.

The example below show how to configure a request where the server expects requests to have a `Content-Type: application/json` header

```javascript
var xhrConfig = function(xhr) {
	xhr.setRequestHeader("Content-Type", "application/json");
}

m.request({method: "POST", url: "/foo", config: xhrConfig});
```

---

### Aborting a request

The `config` option can also be used to retrieve the `XMLHttpRequest` instance for aborting the request. This idiom can also be used to attach `onprogress` event handlers.

```javascript
var transport = m.prop();

m.request({method: "POST", url: "/foo", config: transport});

//the `transport` getter-setter contains an instance of XMLHttpRequest
transport().abort();
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Promise request(XHROptions options)

where:
	Promise :: GetterSetter { Promise then(any successCallback(any value), any errorCallback(any value)) }
	GetterSetter :: any getterSetter([any value])
	XHROptions :: Object {
		String method,
		String url,
		[String user,]
		[String password,]
		[Object<any> data,]
		[Boolean background,]
		[any unwrapSuccess(any data),]
		[any unwrapError(any data),]
		[String serialize(any dataToSerialize),]
		[any deserialize(String dataToDeserialize),]
		[any extract(XMLHttpRequest xhr, XHROptions options),]
		[void type(Object<any> data),]
		[XMLHttpRequest? config(XMLHttpRequest xhr, XHROptions options)]
	}
```

-	**XHROptions options**

	A map of options for the XMLHttpRequest
	
	-	**String method**
	
		The HTTP method. Must be either `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, `"HEAD"` or `"OPTIONS"`
		
	-	**String url**
	
		The URL to request. If the URL is not in the same domain as the application, the target server must be configured to accept cross-domain requests from the application's domain, i.e. its responses must include the header `Access-Control-Allow-Origin: *`.
	
	-	**String user** (optional)
	
		A user for HTTP authentication. Defaults to `undefined`
		
	-	**String password** (optional)
	
		A password for HTTP authentication. Defaults to `undefined`
		
	-	**String password** (optional)
	
		A password for HTTP authentication. Defaults to `undefined`
		
	-	**Object<any> data** (optional)
	
		Data to be sent. It's automatically placed in the appropriate section of the request with the appropriate serialization based on `method`
		
	-	**Boolean background** (optional)
	
		Determines whether the `m.request` can affect template rendering. Defaults to false.
		
		If this option is set to true, then the request does NOT call [`m.startComputation` / `m.endComputation`](mithril.computation.md), and therefore the completion of the request does not trigger an update of the view, even if data has been changed. This option is useful for running operations in the background (i.e. without user intervention).
		
		In order to force a redraw after a background request, use [`m.redraw`](mithril.redraw.md)
		
		```javascript
		m.request({method: "GET", url: "/foo", background: true})
			.then(m.redraw); //force redraw
		```
		
	-	**any unwrapSuccess(any data)** (optional)

		A preprocessor function to unwrap the data from a success response in case the response contains metadata wrapping the data.
		
		The default value (if this parameter is falsy) is the identity function `function(value) {return value}`
		
		For example, if the response is `{data: [{name: "John"}, {name: "Mary"}]}` and the unwrap function is `function(response) {return response.data}`, then the response will be considered to be `[{name: "John"}, {name: "Mary"}]` when processing the `type` parameter
		
		-	**Object<any> | Array<any> data**
		
			The data to unwrap
			
		-	**returns Object<any> | Array<any> unwrappedData**
		
			The unwrapped data

	-	**any unwrapError(any data)** (optional)

		A preprocessor function to unwrap the data from an error response in case the response contains metadata wrapping the data.
		
		The default value (if this parameter is falsy) is the identity function `function(value) {return value}`
		
		-	**Object<any> | Array<any> data**
		
			The data to unwrap
			
		-	**returns Object<any> | Array<any> unwrappedData**
		
			The unwrapped data
			
	-	**String serialize(any dataToSerialize)** (optional)

		Method to use to serialize the request data
		
		The default value (if this parameter is falsy) is `JSON.stringify`
			
		-	**any dataToSerialize**
		
			Data to be serialized
			
		-	**returns String serializedData**
		
	-	**any deserialize(String dataToDeserialize)** (optional)

		Method to use to deserialize the response data
		
		The default value (if this parameter is falsy) is `JSON.parse`
		
		-	**String dataToDeserialize**
		
			Data to be deserialized
			
		-	**returns any deserializedData**
		
	-	**any extract(XMLHttpRequest xhr, XHROptions options)** (optional)
	
		Method to use to extract the data from the raw XMLHttpRequest. This is useful when the relevant data is either in a response header or the status field.

		If this parameter is falsy, the default value is a function that returns `xhr.responseText`.
		
	-	**void type(Object<any> data)** (optional)

		The response object (or the child items if this object is an Array) will be passed as a parameter to the class constructor defined by `type`
		
		If this parameter is falsy, the deserialized data will not be wrapped.
		
		For example, if `type` is the following class:
		
		```javascript
		var User = function(data) {
			this.name = m.prop(data.name);
		}
		```
		
		And the data is `[{name: "John"}, {name: "Mary"}]`, then the response will contain an array of two User instances.
		
	-	**XMLHttpRequest? config(XMLHttpRequest xhr, XHROptions options)** (optional)
		
		An initialization function that runs after `open` and before `send`. Useful for adding request headers and when using XHR2 features, such as the XMLHttpRequest's `upload` property.
		
		-	**XMLHttpRequest xhr**
		
			The XMLHttpRequest instance.
			
		-	**XHROptions options**
			
			The `options` parameter that was passed into `m.request` call
			
		-	**returns XMLHttpRequest? xhr**
		
			You may return an XHR-like object (e.g. a XDomainRequest instance) to override the provided XHR instance altogether.
	
-	**returns Promise promise**

	returns a promise that can bind callbacks which get called on completion of the AJAX request.

	
