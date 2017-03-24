# redraw()

- [Description](#description)
- [Signature](#signature)
- [How it works](#how-it-works)

---

### Description

Updates the DOM after a change in the application data layer.

You DON'T need to call it if data is modified within the execution context of an event handler defined in a Mithril view, or after request completion when using `m.request`/`m.jsonp`.

You DO need to call it in `setTimeout`/`setInterval`/`requestAnimationFrame` callbacks, or callbacks from 3rd party libraries.

Typically, `m.redraw` triggers an asynchronous redraws, but it may trigger synchronously if Mithril detects it's possible to improve performance by doing so (i.e. if no redraw was requested within the last animation frame). You should write code assuming that it always redraws asynchronously.

---

### Signature

`m.redraw()`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
**returns** |                      |          | Returns nothing

---

### How it works

When callbacks outside of Mithril run, you need to notify Mithril's rendering engine that a redraw is needed. External callbacks could be `setTimeout`/`setInterval`/`requestAnimationFrame` callbacks, web socket library callbacks, event handlers in jQuery plugins, third party XHR request callbacks, etc.

To trigger a redraw, call `m.redraw()`. Note that `m.redraw` only works if you used `m.mount` or `m.route`. If you rendered via `m.render`, you should use `m.render` to redraw.

You should not call m.redraw from a [lifecycle method](lifecycle-methods.md). Doing so will result in undefined behavior.
