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

### Subtree Directives

`m.render` accepts a special low level SubtreeDirective object as a node in a virtual DOM tree: if a tree contains a node that looks exactly like the object below, Mithril will abort the diff algorithm for that node. This allows you to implement optimizations that avoid creating virtual DOM trees in favor of their cached counterparts, if you know they have not changed between redraws. Note that using this feature is discouraged if you don't have visible performance problems.

```javascript
{subtree: "retain"}
```

This mechanism is only intended to be used as a last resort optimization tool. If you do use it, you are responsible for determining what constitutes a scenario where the virtual DOM tree is changed/unchanged.

The example below shows how to use a SubtreeDirective object to create a static header that doesn't incur diff costs once it has been rendered. This means that we are avoiding the creation of the header subtree (and therefore skipping the diff algorithm) altogether, but it also means that dynamic variables will NOT be updated within the header.

```
var app = {}

//here's an example plugin that determines whether data has changes.
//in this case, it simply assume data has changed the first time, and never changes after that.
app.bindOnce = new function() {
	var cache = {}
	function(view) {
		if (!cache[view.toString()]) {
			cache[view.toString()] = true
			return view()
		}
		else return {subtree: "retain"}
	}
}

//here's the view
app.view = function(ctrl) {
	m(".layout", [
		app.bindOnce(function() {
			//this only runs once in order to boost performance
			//dynamic variables are not updated here
			return m("header", [
				m("h1", "this never changes")
			])
		}),
		//dynamic variables here still update on every redraw
		m("main", "rest of app goes here")
	])
}
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
void render(DOMElement rootElement, Children children)

where:
	Children :: String text | VirtualElement virtualElement | SubtreeDirective directive | Array<Children children>
	VirtualElement :: Object { String tag, Attributes attributes, Children children }
    Attributes :: Object<Any | void config(DOMElement element)>
	SubtreeDirective :: Object { String subtree }
```

-	**DOMElement rootElement**

	A DOM element which will contain the template represented by `children`.
	
-	**Children children**

	If this argument is a string, it will be rendered as a text node. To render a string as HTML, see [`m.trust`](mithril.trust)
	
	If it's a VirtualElement, it will be rendered as a DOM Element.
	
	If it's a list, its contents will recursively be rendered as appropriate and appended as children of the `root` element.

