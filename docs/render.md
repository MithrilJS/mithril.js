# render(element, vnodes)

- [API](#api)
- [Standalone usage](#standalone-usage)

---

### API

`m.render(element, vnodes)`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
`element`   | `Element`            | Yes      | A DOM element that will be the parent node to the subtree
`vnodes`    | `Array<Vnode>|Vnode` | Yes      | The [vnodes](vnodes.md) to be rendered
**returns** |                      |          | Returns nothing

[How to read signatures](signatures.md)

---

### How it works

The `m.render(element, vnodes)` method takes a virtual DOM tree (typically generated via the [`m()` hyperscript function](hyperscript.md), generates a DOM tree and mounts it on `element`. If `element` already has a DOM tree mounted via a previous `m.render()` call, `vnodes` is diffed against the previous `vnodes` tree and the existing DOM tree is modified where needed to reflect the changes.

This method is internally called by [`m.mount()`](mount.md), [`m.route()`](route.md) amd `[m.request()](request.md)`.

---

### Standalone usage

The `m.render` module is similar in scope to view libraries like Knockout, React and Vue. It is less than 500 lines of code (3kb min+gzip) and implements a virtual DOM diffing engine with a modern search space reduction algorithm and DOM recycling, which translate to top-of-class performance, both in terms of initial page load and re-rendering. It has no dependencies on other parts of Mithril and can be used as a standalone library.

Despite being incredibly small, the render module is fully functional and self-suficient. It supports everything you might expect: SVG, custom elements, and all valid attributes and events - without any weird case-sensitive edge cases or exceptions. Of course, it also fully supports [components](components.md) and [lifecycle methods](lifecycle-methods.md).

