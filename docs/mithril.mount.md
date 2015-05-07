## m.mount

---

- [Rendering Components](#rendering-components)
- [Signature](#signature)

---

Mounting is the process of rendering a [component](mithril.component.md) into a DOM element.

The different between `m.mount` and [`m.render`](mithril.render.md) is that a component rendered via `m.mount` auto-redraws automatically when event handlers are triggered, whereas components rendered via `m.render` do not.

In order to allow a user to navigate between different pages by loading and unloading components, consider using [`m.route`](mithril.route.md) instead.

---

## Rendering Components

### Usage

Calling `m.mount` with a DOM element as the first argument and a component as the second argument will call the component's controller function, and then call the component's view function. The return value of the controller function is passed to the view function as its first argument.

```javascript
var MyComponent = {
	controller: function() {
		return {greeting: "Hello"}
	},
	view: function(ctrl) {
		return m("h1", ctrl.greeting)
	}
}

m.mount(document.body, MyComponent)

//<body><h1>Hello</h1></body>
```

For more information on components, see [`m.component`](mithril.component.md).

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
Object mount(DOMElement rootElement, Component component)

where:
	Component :: Object { Controller, View }
	Controller :: SimpleController | UnloadableController
	SimpleController :: void controller([Object attributes [, any... args]])
	UnloadableController :: void controller([Object attributes [, any... args]]) { prototype: void unload(UnloadEvent e) }
	UnloadEvent :: Object {void preventDefault()}
	View :: void view(Object controllerInstance [, Object attributes [, any... args]])
```

-	**DOMElement rootElement**

	A DOM element which will contain the view's template.

-	**Component component**

	A component is supposed to be an Object with two keys: `controller` and `view`. Each of those should point to a Javascript function. If the `controller` is omitted, Mithril will provide one, pointing to an empty function.

	When `m.mount` is called, the controller function runs, and its return value is returned by the `m.mount` call.

	Once the controller code finishes executing (and this may include waiting for AJAX requests to complete), the view class is instantiated, and the instance of the controller is passed as an argument to the view's constructor.

-	**returns Object controllerInstance**

	An instance of the controller constructor
