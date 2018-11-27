<!--meta-description
Documentation on m.buildPathname(), which creates URLs from path templates and query objects
-->
# buildPathname(object)

- [Description](#description)
- [Signature](#signature)
- [How it works](#how-it-works)

---

### Description

Turns a [path template](paths.md) and a parameters object into a string of form `/path/user?a=1&b=2`

```javascript
var pathname = m.buildPathname("/path/:id", {id: "user", a: "1", b: "2"})
// "/path/user?a=1&b=2"
```

---

### Signature

`pathname = m.buildPathname(object)`

Argument     | Type                                       | Required | Description
------------ | ------------------------------------------ | -------- | ---
`path`       | `String`                                   | Yes      | A URL path
`query `     | `Object`                                   | Yes      | A key-value map to be converted into a string
**returns**  | `String`                                   |          | A string representing the URL with the query string

[How to read signatures](signatures.md)

---

### How it works

The `m.buildPathname` creates a [path name](paths.md) from a path template and a parameters object. It's useful for building URLs, and it's what [`m.route`](route.md), [`m.request`](request.md), and [`m.jsonp`](jsonp.md) all use internally to interpolate paths. It uses [`m.buildQueryString`](buildQueryString.md) to generate the query parameters to append to the path name.

```javascript
var pathname = m.buildPathname("/path/:id", {id: "user", a: 1, b: 2})

// pathname is "/path/user?a=1&b=2"
```
