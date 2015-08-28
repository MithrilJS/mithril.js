## m.prop

---

- [Usage](#usage)
- [Third-party promise library support](#third-party-promise-library-support)
- [Serializing getter-setters](#serializing-getter-setters)
- [Signature](#signature)

---

This is a getter-setter factory utility. It returns a function that stores information.

Note that modifying the values of `m.prop` getter-setters does not trigger redrawing. Instead, Mithril's redrawing system relies on [`m.startComputation` and `m.endComputation`](mithril.computation.md). These functions are internally called by Mithril when you initialize a component via [`m.mount`](mithril.mount.md) or [`m.route`](mithril.route.md), and when you trigger event handlers that were created within templates with [`m()`](mithril.md). 

---

### Usage

```javascript
//define a getter-setter with initial value `John`
var name = m.prop("John");

//read the value
var a = name(); //a == "John"

//set the value to `Mary`
name("Mary"); //Mary

//read the value
var b = name(); //b == "Mary"
```

It can be used in conjunction with [`m.withAttr`](mithril.withAttr.md) to implement data binding in the view-to-model direction and to provide uniform data access for model entity properties.

```javascript
//a contrived example of bi-directional data binding
var User = {
	model: function(name) {
		this.name = m.prop(name);
	},
	controller: function() {
		this.user = new User.model("John Doe");
	},
	view: function(controller) {
		m.render("body", [
			m("input", {onchange: m.withAttr("value", controller.user.name), value: controller.user.name()})
		]);
	}
};
```

In the example above, the usage of `m.prop` allows the developer to change the implementation of the user name getter/setter without the need for code changes in the controller and view.

`m.prop` can also be used in conjunction with [`m.request`](mithril.request.md) and [`m.deferred`](mithril.deferred.md) to bind data on completion of an asynchronous operation.

```javascript
var users = m.prop([]);
var error = m.prop("");

m.request({method: "GET", url: "/users"})
	.then(users, error); //on success, `users` will be populated, otherwise `error` will be populated
//assuming the response contains the following data: `[{name: "John"}, {name: "Mary"}]`
//then when resolved (e.g. in a view), the `users` getter-setter will contain a list of User instances
//i.e. users()[0].name() == "John"
```

---

### Third-party promise library support

If a promise is passed into `m.prop()`, a Mithril promise is returned. Mithril promises are also getter-setter functions, which are populated with the resolved value if the promise is fulfilled successfully.

Until the promise is resolved, the value of the prop will resolve to `undefined`

Here's an example using the [Q](https://github.com/kriskowal/q) promise library:

```javascript
var deferred = Q.defer()
var users = m.prop(deferred.promise)

users() // undefined

deferred.resolve("Hello")

//wait for next tick for Q's A+ compliant promise to actually resolve
setTimeout(function() {

	users() // Hello
	users.then(function(value) {
		console.log(value) //Hello
	})
	
}, 1000)
```

---

### Serializing getter-setters

Getter-setters are JSON-serializable:

```javascript
var data = {foo: m.prop("bar")};
JSON.stringify(data); // '{"foo": "bar"}'
```

This allows getter-setters to be passed directly as parameters to [`m.request`](mithril.request.md), for example.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
GetterSetter prop([any initialValue])

where:
	GetterSetter :: any getterSetter([any value])
```

-	**any initialValue** (optional)

	An initialization value. If not provided, the value of the getter-setter's internal store defaults to `undefined`.

-	**returns any getterSetter([any value])**

	A getter-setter method.

	-	**any value** (optional)

		If provided, it updates the getter-setter's internal store to the provided value.

		If not provided, return the current internally stored value.

	-	**returns any value**

		This method always returns the value of the internal store, regardless of whether it was updated or not.
