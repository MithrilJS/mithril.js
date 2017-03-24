# version

- [Signature](#signature)
- [How it works](#how-it-works)

---

### Signature

`m.version`

Argument    | Type                 | Required | Description
----------- | -------------------- | -------- | ---
**returns** | String               |          | Returns the version number

---

### How it works

The `m.version` property is a string containing the [semver](http://semver.org/) value for the current release.

Semver (or Semantic Versioning) specifies that a version number must follow the syntax "0.0.0", where the first number is the MAJOR number, the second is the MINOR number and the third is the PATCH number.

- The MAJOR number changes when there are backwards-incompatible API changes,
- The MINOR number changes when functionality is added in a backwards-compatible manner, and
- The PATCH number changes when there are backwards-compatible bug fixes

