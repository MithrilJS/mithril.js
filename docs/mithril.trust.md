## m.trust

If you're writing a template for a view, use `m()` instead.

This method flags a string as trusted HTML.

Trusted HTML is allowed to render arbitrary, potentially invalid markup, as well as run arbitrary Javascript, and therefore the developer is responsible for either:

- sanitizing the markup contained in the string, or

- acknowledging that the string is authorized to run any code that may be contained within it.

Note that browsers ignore `<script>` tags that have been inserted into the DOM via innerHTML. They do this because once the element is ready (and thus, has an accessible `innerHTML` property), their rendering engines cannot backtrack to the parsing-stage if the script calls something like `document.write("</body>")`.

For this reason, `m.trust` will not auto-run `<script>` tags from trusted strings.

Browsers do, however, allow scripts to be run asynchronously via a number of execution points, such as the `onload` or `onerror` attributes in `<img>` and `<iframe>`.

IE also allows running of Javascript via CSS behaviors in `<link>`/`<style>` tags and `style` attributes.

It's worth noting that the execution points listed above are commonly used for security attacks in combination with malformed markup, e.g. strings with mismatched attribute quotes like `" onload="alert(1)`.

Mithril templates are defended against these attacks by default, except when markup is injected via `m.trust`.

It is the developer's responsibility to ensure the input to `m.trust` cannot be maliciously modified by user-entered data.

---

### Usage

```javascript
//assume this content comes from the server
var content = "<h1>Error: invalid user</h1>";

m.render("body", [
	m("div", m.trust(content))
]);
```

yields:

```markup
<body>
	<div>
		<h1>Error: invalid user</h1>
	</div>
</body>
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
String trust(String html)
```

-	**String html**

	A string containing HTML markup

-	**returns String trustedHtml**
	
	The returned string is a String object instance (as opposed to a string primitive) containing the same HTML content, and exposing a flag property for internal use within Mithril. Do not create or manipulate trust flags manually.
	
	Also note that concatenating or splitting a trusted string removes the trust flag. If doing such operations, the final string needs to be flagged as trusted.