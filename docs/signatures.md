# How to read signatures

Signature sections typically look like this:

`vnode = m(selector, attributes, children)`

Argument     | Type                                 | Required | Description
------------ | ------------------------------------ | -------- | ---
`selector`   | `String|Object`                      | Yes      | A CSS selector or a component
`attributes` | `Object`                             | No       | HTML attributes or element properties
`children`   | `Array<Vnode>|String|Number|Boolean` | No       | Child [vnodes](vnodes.md). Can be written as [splat arguments](signatures.md#splats)
**returns**  | `Vnode`                              |          | A [vnode](vnodes.md)

The signature line above the table indicates the general syntax of the method, showing the name of the method, the order of its arguments and a suggested variable name for its return value.

The **Argument** column in the table indicates which part of the signature is explained by the respective table row. The `returns` row displays information about the return value of the method.

The **Type** column indicates the expected type for the argument.

A pipe (`|`) indicates that an argument is valid if it has any of the listed types. For example, `String|Object` indicates that `selector` can be a string OR an object.

Angled brackets (`< >`) after an `Array` indicate the expected type for array items. For exampe, `Array<String>` indicates that an argument must be an array and that all items in that array must be strings.

Sometimes non-native types may appear to indicate that a specific object signature is required. For example, `Vnode` is an object that has a [virtual DOM node](vnodes.md) structure.

The **Required** column indicates whether an argument is required or optional. If an argument is optional, you may set it to `null` or `undefined`, or omit it altogether, such that the next argument appears in its place.

### Splats

A splat argument means that if the last argument is an array, you can omit the square brackets and have a variable number of arguments in the method instead.

In the example at the top, this means that `m("div", {id: "foo"}, ["a", "b", "c"])` can also be written as `m("div", {id: "foo"}, "a", "b", "c")`.

Splats are useful in some compile-to-js languages such as Coffeescript, and also allow helpful shorthands for some common use cases.
