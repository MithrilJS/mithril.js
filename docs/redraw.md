# redraw()

- [Signature](#signature)
- [How it works](#how-it-works)

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