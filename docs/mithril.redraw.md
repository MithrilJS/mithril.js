## m.redraw

Redraws the view for the currently active module. Use [`m.module()`](mithril.module.md) to activate a module.

This method is called internally by Mithril's auto-redrawing system. Usually you don't need to call it manually unless you are doing recurring asynchronous operations (i.e. using `setInterval`) or if you want to decouple slow running background requests from the rendering context (see the `background` option in [`m.request`](mithril.request.md).

By default, if you're using either [`m.route`](mithril.route.md) or [`m.module`](mithril.module.md), `m.redraw()` is called automatically by Mithril's auto-redrawing system once the controller finishes executing.

`m.redraw` is also called automatically on event handlers defined in virtual elements.

Note that calling this method will not do anything if a module was not activated via either [`m.module()`](mithril.module.md) or [`m.route()`](mithril.route.md). This means that `m.redraw` doesn't do anything when instantiating controllers and rendering views via `m.render` manually.

If there are pending [`m.request`](mithril.request.md) calls in either a controller constructor or event handler, the auto-redrawing system waits for all the AJAX requests to complete before calling `m.redraw`.

This method may also be called manually from within a controller if more granular updates to the view are needed, however doing so is generally not recommended, as it may degrade performance. Model classes should never call this method.

If you are developing an asynchronous model-level service and finding that Mithril is not redrawing the view after your code runs, you should use [`m.startComputation` and `m.endComputation`](mithril.computation.md) to integrate with Mithril's auto-redrawing system instead.

---

### Changing redraw strategy

If you need to change how Mithril performs redraws, you can change the value of the `m.redraw.strategy` getter-setter to either `"all"`, `"diff"` or `"none"`. By default, this value is set to `"all"` when running controller constructors, and it's set to `"diff"` for all subsequent redraws.

```javascript
var module1 = {}
module1.controller = function() {
	//this module will attempt to diff its template when routing, as opposed to re-creating the view from scratch.
	//this allows config contexts to live across route changes, if its element does not need to be recreated by the diff
	m.redraw.strategy("diff")
}
module1.view = function() {
	return m("h1", {config: module1.config}, "test")
}
module1.config = function(el, isInit, ctx) {
	if (!isInit) ctx.data = "foo"
}
```

---

### Preventing redraws on events

Similarly, it's possible to skip redrawing altogether by calling `m.redraw.strategy("none")`

```javascript
m("input", {onkeydown: function(e) {
	if (e.keyCode == 13) ctrl.save() //do things and re-render only if the `enter` key was pressed
	else m.redraw.strategy("none") //otherwise, ignore
}})
```

---

### Forcing redraw

If you find yourself needing to redraw before the browsers normal redraw cycle, you can force it.

```javascript
m.redraw(true) // force
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void redraw([Boolean forceSync]) { GetterSetter strategy }

where:
	GetterSetter :: String getterSetter([String value])
```

-	**Boolean forceSync** (optional)
	
	If set to true, forces the redraw to be synchronous. By default, event handlers schedule redraws to be done asynchronously in order to allow simultaneous events to run before redrawing (for example, the keypress and input are often used together for inputs). Defaults to `false`

-	<a name="strategy"></a>

	### m.redraw.strategy

	**GetterSetter strategy**

	The `m.redraw.strategy` getter-setter indicates how the next module redraw will occur. It can be one of three values:

	-	`"all"` - recreates the DOM tree from scratch
	-	`"diff"` - updates only DOM elements if needed
	-	`"none"` - leaves the DOM tree intact

	This value can be programmatically changed in controllers and event handlers to modify the next redrawing strategy. It is modified internally by Mithril to the value `"all"` before running controller constructors, and to the value `"diff"` after all redraws.

	Calling this function without arguments returns the currently assigned redraw strategy.
