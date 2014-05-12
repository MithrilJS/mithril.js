## m.redraw

Redraws the view for the currently active module. Use [`m.module()`](mithril.module) to activate a module.

This method is called internally by Mithril's auto-redrawing system. Usually you don't need to call it manually unless you are doing recurring asynchronous operations (i.e. using `setInterval`) or if you want to decouple slow running background requests from the rendering context (see the `background` option in [`m.request`](mithril.request.md).

By default, if you're using either [`m.route`](mithril.route.md) or [`m.module`](mithril.module.md), `m.redraw()` is called automatically by Mithril's auto-redrawing system once the controller finishes executing.

`m.redraw` is also called automatically on event handlers defined in virtual elements.

Note that calling this method will not do anything if a module was not activated via either [`m.module()`](mithril.module) or [`m.route()`](mithril.route). This means that `m.redraw` doesn't do anything when instantiating controllers and rendering views via `m.render` manually.

If there are pending [`m.request`](mithril.request.md) calls in either a controller constructor or event handler, the auto-redrawing system waits for all the AJAX requests to complete before calling `m.redraw`.

This method may also be called manually from within a controller if more granular updates to the view are needed, however doing so is generally not recommended, as it may degrade performance. Model classes should never call this method. 

If you are developing an asynchronous model-level service and finding that Mithril is not redrawing the view after your code runs, you should use [`m.startComputation` and `m.endComputation`](mithril.computation.md) to integrate with Mithril's auto-redrawing system instead.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void redraw()
```