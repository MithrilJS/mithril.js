# prop(attrName, callback)

- [Description](#description)
- [Signature](#signature)
- [How it works](#how-it-works)
- [Sending through requests](#sending-through-requests)

---

### Description

Returns a simple getter/setter object.

```javascript
var name = m.prop("John")

var oldName = name.get() // First, it's set to "John"
name.set("Mary") 		 // Set the value to "Mary"
var newName = name.get() // Now it's "Mary", not "John"
```

---

### Signature

`prop = m.prop(initial?)`

Argument    | Type   | Required | Description
----------- | ------ | -------- | ---
`initial`   | `any`  | No       | The prop's initial value
**returns** | `Prop` |          | A prop

`value = prop.get()`

Argument    | Type  | Required | Description
----------- | ----- | -------- | ---
**returns** | `any` |          | The prop's current value

`newValue = prop.set(newValue)`

Argument    | Type  | Required | Description
----------- | ----- | -------- | ---
`newValue`  | `any` | Yes      | The value to set the prop to
**returns** | `any` |          | The value you just set the prop to, for convenience

[How to read signatures](signatures.md)

---

### How it works

The `m.prop` method creates a prop, a getter/setter object wrapping a single mutable reference. You can get the current value with `prop.get()` and set it with `prop.set(value)`. Unlike [streams](stream.md), you can't observe them, so you can't do as much with them.

In conjunction with [`m.withAttr`](withAttr.md), you can emulate two-way binding pretty easily.

```javascript
function Component() {
	var current = m.prop("")
	return {
		view: function(vnode) {
			return m("input", {
				oninput: m.withAttr("value", current.set),
				value: current.get(),
			})
		}
	}
}
```

They're also useful for making simpler models.

```javascript
// With props
var Auth = {
	username: m.prop(""),
	password: m.prop(""),
	canSubmit: function() {
		return Auth.username.get() !== "" && Auth.password.get() !== ""
	},
	login: function() {
		// ...
	},
}

// Without props
var Auth = {
	username: "",
	password: "",
	setUsername: function(value) {
		Auth.username = value
	}
	setPassword: function(value) {
		Auth.password = value
	}
	canSubmit: function() {
		return Auth.username !== "" && Auth.password !== ""
	},
	login: function() {
		// ...
	},
}
```

---

### Sending through requests

For convenience, props define `.toJSON` as an alias for `.get`. This is so you can send them through `m.request` without serializing them manually.

We could also take this model and simplify it:

```javascript
// How it's loaded
User.load = function(id) {
	return m.request({
		method: "GET",
		url: "https://rem-rest-api.herokuapp.com/api/users/" + id,
		withCredentials: true,
	})
	.then(function(result) {
		User.current = {
			id: result.id,
			firstName: m.prop(result.firstName),
			lastName: m.prop(result.lastName),
		}
	})
}

// Original
User.save = function(user) {
	return m.request({
		method: "PUT",
		url: "https://rem-rest-api.herokuapp.com/api/users/" + user.id,
		data: {
			id: user.id,
			firstName: user.firstName.get(),
			lastName: user.lastName.get(),
		},
		withCredentials: true,
	})
}

// Simplified
User.save = function(user) {
	return m.request({
		method: "PUT",
		url: "https://rem-rest-api.herokuapp.com/api/users/" + user.id,
		data: user,
		withCredentials: true,
	})
}
```
