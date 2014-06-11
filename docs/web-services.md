## Web Services

Mithril provides a high-level utility for working with web services, which allows writing asynchronous code relatively procedurally.

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

While both basic assignment syntax and thennable syntax can be used to the same effect, typically it's recommended that you use the assignment syntax in the first example whenever possible, as it's easier to read.

The thennable mechanism is intended to be used in three ways:

-	In the model layer: to process web service data in transformative ways (e.g. filtering a list based on a parameter that the web service doesn't support)
-	In the controller layer: to bind redirection code upon a condition
-	In the controller layer: to bind error messages

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

Mithril thennables take two functions as optional parameters: the first parameter is called if the web service request completes successfully. The second parameter is called if it completes with an error.

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

-	In model-level methods if client-side processing is needed to make the data useful for a controller or view
-	In the controller, to redirect after a model service resolves
-	In the controller, to bind error messages

In the example below, we take advantage of queuing to debug the AJAX response data prior to doing further processing on the user list:

```javascript
var users = m.request({method: "GET", url: "/user"})
	.then(log);
	.then(function(users) {
		//add one more user to the response
		return users.concat({name: "Jane"})
	})
	
function log(value) {
    console.log(value)
    return value
}

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

