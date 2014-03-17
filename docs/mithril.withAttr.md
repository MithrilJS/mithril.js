## m.withAttr

This is an event handler factory. It returns a method that can be bound to a DOM element's event listener.

Typically, it's used in conjunction with [`m.prop`](mithril.prop) to implement data binding in the view-to-model direction.

This method is provided to decouple the browser's event model from the controller/logic model.

You should use this method and implement similar ones when extracting values from a browser's Event object, instead of hard-coding the extraction code into controllers (or model methods).

---

### Usage

```javascript
//standalone usage
document.body.onclick = m.withAttr("title", function(value) {
	//alerts the title of the body element when it's clicked
	alert(value);
})
```

A contrived example of bi-directional data binding

```javascript
var user = {
	model: function(name) {
		this.name = m.prop(name);
	},
	controller: function() {
		this.user = new user.model("John Doe");
	},
	view: function(controller) {
		m.render("body", [
			m("input", {onchange: m.withAttr("value", controller.user.name), value: controller.user.name()})
		]);
	}
};
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
EventHandler withAttr(String property, void callback(any value))

where:
	EventHandler :: void handler(Event e)
```

-	**String property**

	Defines the property of the DOM element whose value will be passed to the callback.
	
-	**void callback(any value)**

	This function will be called with the value of the defined property as an argument.
	
	-	**any value**
	
		This is the value of the defined DOM element's property.
		
-	**returns EventHandler handler**

	This handler method can be assigned to properties like `onclick`, or passed as callbacks to `addEventListener`.