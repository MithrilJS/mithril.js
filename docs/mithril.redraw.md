## m.redraw

---

- [Changing redraw strategy](#changing-redraw-strategy)
- [Preventing redraws on events](#preventing-redraws-on-events)
- [Forcing redraw](#forcing-redraw)
- [Signature](#signature)

---

Redraws the view for the currently active component. Use [`m.mount()`](mithril.mount.md) to activate a component.

This method is called internally by Mithril's auto-redrawing system. Usually you don't need to call it manually unless you are doing recurring asynchronous operations (i.e. using `setInterval`) or if you want to decouple slow running background requests from the rendering context (see the `background` option in [`m.request`](mithril.request.md).

By default, if you're using either [`m.route`](mithril.route.md) or [`m.mount`](mithril.mount.md), `m.redraw()` is called automatically by Mithril's auto-redrawing system once the controller finishes executing.

`m.redraw` is also called automatically on event handlers defined in virtual elements.

Note that calling this method will not do anything if a component was not activated via either [`m.mount()`](mithril.mount.md) or [`m.route()`](mithril.route.md). This means that `m.redraw` doesn't do anything when instantiating controllers and rendering views via `m.render` manually.

If there are pending [`m.request`](mithril.request.md) calls in either a controller constructor or event handler, the auto-redrawing system waits for all the AJAX requests to complete before calling `m.redraw`.

This method may also be called manually from within a controller if more granular updates to the view are needed, however doing so is generally not recommended, as it may degrade performance. Model classes should never call this method.

If you are developing an asynchronous model-level service and finding that Mithril is not redrawing the view after your code runs, you should use [`m.startComputation` and `m.endComputation`](mithril.computation.md) to integrate with Mithril's auto-redrawing system instead.

---

### Changing redraw strategy

If you need to change how Mithril performs a redraw, you can change the value of the `m.redraw.strategy` getter-setter to either `"all"`, `"diff"` or `"none"`. The new strategy will apply to the next scheduled redraw, if any. By default, Mithril sets this value to `"all"` before running controller constructors, and it sets it to `"diff"` before event handlers are triggered.

After the redraw, Mithril resets the value of the flag to either "all" or "diff", depending on whether the redraw was due to a route change or not.

Changing the flag outside of a redrawable context does nothing since the flag gets reset when entering one of the documented redrawable contexts above.

When the flag is set to "all", Mithril throws away the current view and redraws from scratch. This is the default for going from one route to another.

When the flag is set to "diff", Mithril performs a diff between the old view and the new view and applies patches to the DOM only where needed.

When the flag is set to "none", Mithril skips the next redraw. You don't need to change this flag to something else again later, since Mithril does that for you.

```javascript
var Component1 = m.component({
	controller: function() {
		//this component will attempt to diff its template when routing, as opposed to re-creating the view from scratch.
		//this allows config contexts to live across route changes, if its element does not need to be recreated by the diff
		m.redraw.strategy("diff")
	},
	view: function() {
		return m("h1", {config: Component1.config}, "test") //assume all routes display the same thing
	}
})
Component1.config = function(el, isInit, ctx) {
	if (!isInit) ctx.data = "foo" //we wish to initialize this only once, even if the route changes
}
```

Common reasons why one might need to change redraw strategy are:

-	in order to avoid the full-page recreation when changing routes, for the sake of performance of global 3rd party components

	```javascript
	//diff when routing, instead of redrawing from scratch
	//this preserves the `<input>` element and its 3rd party plugin after route changes, since the `<input>` doesn't change
	var Component1 = m.component({
		controller: function() {
			m.redraw.strategy("diff")
		},
		view: function() {
			return m("div", [
				m("h1", "Hello Foo"),
				m("input", {config: plugin}) //assuming `plugin` initializes a 3rd party library
			])
		}
	})

	var Component2 = m.component({
		controller: function() {
			m.redraw.strategy("diff")
		},
		view: function() {
			return m("div", [
				m("h1", "Hello Bar"),
				m("input", {config: plugin}) //assuming `plugin` initializes a 3rd party library
			])
		}
	})

	m.route(document.body, "/foo", {
		"/foo": Component1,
		"/bar": Component2,
	})
	```

-	in order to prevent redraw when dealing with `keypress` events where the event's keyCode is not of interest

	```javascript
	//model
	var saved = false
	function save(e) {
		if (e.keyCode == 13) {
			//this causes a redraw, since event handlers active auto-redrawing by default
			saved = true
		}
		else {
			//we don't care about other keys, so don't redraw
			m.redraw.strategy("none")
		}
	}

	//view
	var view = function() {
		return m("div", [
			m("button[type=button]", {onkeypress: save}, "Save"),
			saved ? "Saved" : ""
		])
	}
	```

Note that the redraw strategy is a global setting that affects the entire template trees of all components on the page. In order to prevent redraws in *some parts* of an application, but not others, see [subtree directives](mithril.render.md#subtree-directives)

You can also configure individual elements to always be diffed, instead of recreated from scratch (even across route changes), by using the [`ctx.retain` flag](mithril.md#persising-dom-elements-across-route-changes)

---

### Preventing redraws on events

Sometimes you only care about a particular condition in an event and want the event to not trigger a redraw if this condition is not met. 
For example, you might only be interested in running a redraw if a user presses the space bar, and you might not want to waste a redraw if the user presses any other key. In that case, it's possible to skip redrawing altogether by calling `m.redraw.strategy("none")`

```javascript
m("input", {onkeydown: function(e) {
	if (e.keyCode == 13) vm.save() //do things and re-render only if the `enter` key was pressed
	else m.redraw.strategy("none") //otherwise, ignore
}})
```

There are some important semantic caveats for `m.redraw.strategy("none")` that you should be aware of: Setting the strategy to `"none"` only affects **synchronous** redraws. As soon as the event handler returns, the strategy is set back to "diff".

If you set strategy to `"none"` but then proceed to trigger a redraw asynchronously, either via `start/endComputation`, `m.redraw` or `m.request`, a redraw *will* occur, using the `"diff"` strategy.

Additionally, calling `m.redraw` synchronously after calling `m.redraw.strategy("none")` resets the strategy to `"diff"`.

Lastly, be aware that if a user action triggers more than one event handler (for example, oninput and onkeypress, or an event bubbling up to event handlers in multiple ancestor elements), every event triggers a redraw by default. Setting strategy to none in any one of those handlers will not affect the redrawing strategy of other handlers (and remember that `strategy("none")` has no effect on asynchronous redraws).

---

### Forcing redraw

If you find yourself needing to redraw before the browsers normal redraw cycle, you can force a synchronous redraw by passing a boolean `true` as a parameter to `m.redraw`.

```javascript
m.redraw(true) // force
```

Normally, you should only do this if you need to synchronously read a value from the DOM that requires a browser repaint (e.g. `offsetTop` or a CSS rule). If you need to read DOM values, try to read them all at once, because alternating reading and writing to the DOM causes multiple browser repaints, and repaints are expensive.

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

	The `m.redraw.strategy` getter-setter indicates how the next component redraw will occur. It can be one of three values:

	-	`"all"` - recreates the DOM tree from scratch
	-	`"diff"` - updates only DOM elements if needed
	-	`"none"` - leaves the DOM tree intact

	This value can be programmatically changed in controllers and event handlers to modify the next redrawing strategy. It is modified internally by Mithril to the value `"all"` before running controller constructors, and to the value `"diff"` after all redraws.

	Calling this function without arguments returns the currently assigned redraw strategy.
