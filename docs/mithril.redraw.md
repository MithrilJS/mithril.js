## m.redraw

Redraws the view for the currently active module. Use [`m.module()`](mithril.module) to activate a module.

This method is called internally by Mithril's auto-redrawing system and is only documented for completeness; you should avoid calling it manually unless you explicitly want a multi-pass redraw cycle.

A multi-pass redraw cycle is usually only useful if you need non-trivial UI metrics measurements. A multi-pass cycle may span multiple browser repaints and therefore could cause flash of unbehaviored content (FOUC) and performance degradation.

By default, if you're using either [`m.route`](mithril.route.md) or [`m.module`](mithril.module.md), `m.redraw()` is called automatically by Mithril's auto-redrawing system once the controller finishes executing.

`m.redraw` is also called automatically on event handlers defined in virtual elements.

If there are pending [`m.request`](mithril.request.md) calls in either a controller constructor or event handler, the auto-redrawing system waits for all the AJAX requests to complete before calling `m.redraw`.

This method may also be called manually from within a controller if more granular updates to the view are needed, however doing so is generally not recommended, as it may degrade performance. Model classes should never call this method.

If you are developing an asynchronous model-level service and finding that Mithril is not redrawing the view after your code runs, you should use [`m.startComputation` and `m.endComputation`](mithril.computation.md) to integrate with Mithril's auto-redrawing system instead.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void redraw()
```