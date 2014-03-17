## m.render

This method generates a DOM tree inside of a given HTML element.

If the method is run more than once with the same root element, it diffs the new tree against the existing one and intelligently modifies only the portions that have changed.

Note that, unlike many templating engines, this "smart diff" feature does not affect things like cursor placement in inputs and focus, and is therefore safe to call during user interactions.

---

### Usage

Assuming a document has an empty `<body>` element, the code below:

```javascript
var links = [
    {title: "item 1", url: "/item1"}
];

m.render(document.body, [
    m("ul.nav", [
        m("li", links.map(function(link) {
            return m("a", {href: link.url, config: m.route}, link.title)
        })
    ])
]);
```

yields:

```markup
<body>
    <ul class="nav">
        <li>
            <a href="/item1">item 1</a>
        </li>
    </ul>
</body>
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void render(DOMElement rootElement, Children children)

where:
	Children :: String text | Array<String text | VirtualElement virtualElement | Children children>
	VirtualElement :: Object { String tag, Attributes attributes, Children children }
    Attributes :: Object<Any | void config(DOMElement element)>
```

-	**DOMElement rootElement**

	A DOM element which will contain the template represented by `children`.
	
-	**Children children**

	If this argument is a string, it will be rendered as a text node. To render a string as HTML, see [`m.trust`](mithril.trust)
	
	If it's a VirtualElement, it will be rendered as a DOM Element.
	
	If it's a list, its contents will recursively be rendered as appropriate and appended as children of the `root` element.

