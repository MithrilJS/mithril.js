## m

This is a convenience method to compose virtual elements that can be rendered via [`m.render()`](mithril.render).

You are encouraged to use CSS selectors to define virtual elements. See "Signature" section for details.

---

### Usage

You can use simple tag selectors to make templates resemble HTML:

```javascript
m("br"); //yields a virtual element that represents <br>

m("div", "Hello"); //yields <div>Hello</div>

m("div", {class: "container"}, "Hello"); //yields <div class="container">Hello</div>
```

Note that the output value from `m()` is not an actual DOM element. In order to turn the virtual element into a real DOM element, you must call [`m.render()`](mithril.render).

```javascript
m.render(document.body, m("br")); //puts a <br> in <body>
```

You can also use more complex CSS selectors:

```javascript
m(".container"); //yields <div class="container"></div>

m("#layout"); //yields <div id="layout"></div>

m("a[name=top]"); //yields <a name="top"></a>

m("[contenteditable]"); //yields <div contenteditable></div>

m("a#google.external[href='http://google.com']", "Google"); //yields <a id="google" class="external" href="http://google.com">Google</a>
```

Each `m()` call creates a virtual DOM element, that is, a javascript object that represents a DOM element, and which is eventually converted into one.

You can, of course, nest virtual elements:

```javascript
m("ul", [
	m("li", "item 1"),
	m("li", "item 2"),
]);

/*
yields
<ul>
	<li>item 1</li>
	<li>item 2</li>
</ul>
*/
```

Be aware that when nesting virtual elements, the child elements must be in an Array.

---

The CSS selector syntax (e.g. `a#google.external[href='http://google.com']`) is meant to be used for declaring static attributes in the element, i.e. attribute values that don't change dynamically when the user interacts with the app.

The `attributes` argument (i.e. the second parameter in the `m("div", {class: "container"}, "Hello")` example) is meant to be used for attributes whose values we want to dynamically populate.

For example, let's say that you're generating a link from an entry that comes from a web service:

```javascript
//assume the variable `link` came from a web service
var link = {url: "http://google.com", title: "Google"}

m("a", {href: link.url}, link.title); //yields <a href="http://google.com">Google</a>
```

Here's a less trivial example:

```javascript
var links = [
    {title: "item 1", url: "/item1"},
    {title: "item 2", url: "/item2"}
    {title: "item 3", url: "/item3"}
];

m.render(document.body, [
    m("ul.nav", [
        m("li", links.map(function(link) {
            return m("a", {href: link.url}, link.title)
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
            <a href="/item2">item 2</a>
            <a href="/item3">item 3</a>
        </li>
    </ul>
</body>
```

As you can see, flow control is done with vanilla Javascript. This allows the developer to abstract away any aspect of the template at will.

---

Note that you can use both javascript property names and HTML attribute names to set values in the `attributes` argument, but you should pass a value of appropriate type. If an attribute has the same name in Javascript and in HTML, then Mithril assumes you're setting the Javascript property.

```javascript
m("div", {class: "widget"}); //yields <div class="widget"></div>

m("div", {className: "widget"}); //yields <div class="widget"></div>

m("input", {readonly: true}); //yields <input readonly />

m("button", {onclick: alert}); //yields <button></button>, which alerts its event argument when clicked
```

---

Note that you can use JSON syntax if the attribute name you are setting has non-alphanumeric characters:

```javascript
m("div", {"data-index": 1}); //yields <div data-index="1"></div>
```

You can set inline styles like this:

```javascript
m("div", {style: {border: "1px solid red"}}); //yields <div style="border:1px solid red;"></div>
```

Note that in order to keep the framework lean, Mithril does not auto-append units like `px` or `%` to any values. Typically, you should not even be using inline styles to begin with (unless you are dynamically changing them).

---

You can define a non-HTML-standard attribute called `config`. This special parameter allows you to call methods on the DOM element after it gets created.

This is useful, for example, if you declare a `canvas` element and want to use the Javascript API to draw:

```javascript
function draw(element, isInitialized) {
	//don't redraw if we did once already
	if (isInitialized) return;
	
	var ctx = element.getContext("2d");
	/* draws stuff */
}

var view = [
	m("canvas", {config: draw})
]

//this creates the canvas element, and therefore, `isInitialized` is false
m.render(document.body, view);

//here, isInitialized is `true`
m.render(document.body, view);
```

One common way of using `config` is in conjunction with [`m.route`](mithril.route), which is an unobtrusive extension to links that allow Mithril's routing system to work transparently regardless of which routing mode is used.

```javascript
//this link can use any of Mithril's routing system modes
//(i.e. it can use either the hash, the querystring or the pathname as the router implementation)
//without needing to hard-code any syntax (`#` or `?`) in the `href` attribute.
m("a[href='/dashboard']", {config: m.route}, "Dashboard");
```

The `config` mechanism can also be used to put focus on form inputs, and call methods that would not be possible to execute via the regular attribute syntax.

It is only meant to be used to call methods on DOM elements that cannot be called otherwise.

It is NOT a "free out-of-jail card". You should not use this method to modify element properties that could be modified via the `attributes` argument, nor values outside of the DOM element in question.

Also note that the `config` callback only runs after a rendering lifecycle is done. Therefore, you should not use `config` to modify controller and model values, if you expect these changes to render immediately. Changes to controller and model values in this fashion will only render on the next `m.render` or `m.module` call.

You can use this mechanism to attach custom event listeners to controller methods (for example, when integrating with third party libraries), but you are responsible for making sure the integration with Mithril's autoredrawing system is in place. See the [integration guide](integration.md) for more information.

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
VirtualElement m(String selector [, Attributes attributes] [, Children children])

where:
	VirtualElement :: Object { String tag, Attributes attributes, Children children }
    Attributes :: Object<any | void config(DOMElement element, Boolean isInitialized)>
	Children :: String text | Array<String text | VirtualElement virtualElement | Children children>
```

-	**String selector**

	This string should be a CSS rule that represents a DOM element.

	Only tag, id, class and attribute selectors are supported.

	If the tag selector is omitted, it defaults to `div`.
	
	Note that if the same attribute is defined in the both `selector` and `attributes` parameters, the value in `attributes` is used.
	
	For developer convenience, Mithril makes an exception for the `class` attribute: if there are classes defined in both parameters, they are concatenated as a space separated list. It does not, however, de-dupe classes if the same class is declared twice.

	*Examples:*

	`"div"`

	`"#container"`

	`".active"`

	`"[title='Application']"`

	`"div#container.active[title='Application']"`

	`".active#container"`

-	**Attributes attributes** (optional)
  
	This key-value map should define a list of HTML attributes and their respective values.

	You can use both HTML and Javascript attribute names. For example, both `class` and `className` are valid.

	Values' types should match the expected type for the respective attribute.

	For example, the value for `className` should be a string.

	When a attribute name expects different types for the value in HTML and Javascript, the Javascript type should be used. 

	For example, the value for the `onclick` attribute should be a function.

	Similar, setting the value of attribute `readonly` to `false` is equivalent to removing the attribute in HTML.

	It's also possible to set values to Javascript-only properties, such as `hash` in a `<a>` element.
	
	Note that if the same attribute is defined in the both `selector` and `attributes` parameters, the value in `attributes` is used.
	
	For developer convenience, Mithril makes an exception for the `class` attribute: if there are classes defined in both parameters, they are concatenated as a space separated list. It does not, however, de-dupe classes if the same class is declared twice.
	
	*Examples:*

	`{ title: "Application" }`

	`{ onclick: function(e) { /*do stuff*/ } }`
	
	`{ style: {border: "1px solid red"} }`
	
-	#### The `config` attribute
	
	**void config(DOMElement element, Boolean isInitialized)** (optional)

	You can define a non-HTML-standard attribute called `config`. This special parameter allows you to call methods on the DOM element after it gets created.

	This is useful, for example, if you declare a `canvas` element and want to use the Javascript API to draw:

	```javascript
	function draw(element, isInitialized) {
		//don't redraw if we did once already
		if (isInitialized) return;
		
		var ctx = element.getContext("2d");
		/* draws stuff */
	}
	
	var view = [
		m("canvas", {config: draw})
	]
	
	//this creates the canvas element, and therefore, `isInitialized` is false
	m.render(document.body, view);
	
	//here, isInitialized is `true`
	m.render(document.body, view);
	```
  
	One common way of using `config` is in conjunction with [`m.route`](mithril.route), which is an unobtrusive extension to links that allow Mithril's routing system to work transparently regardless of which routing mode is used.
	
	```javascript
	//this link can use any of Mithril's routing system modes
	//(i.e. it can use either the hash, the querystring or the pathname as the router implementation)
	//without needing to hard-code any syntax (`#` or `?`) in the `href` attribute.
	m("a[href='/dashboard']", {config: m.route}, "Dashboard");
	```

	The `config` mechanism can also be used to put focus on form inputs, and call methods that would not be possible to execute via the regular attribute syntax.
	
	It is only meant to be used to call methods on DOM elements that cannot be called otherwise.
	
	It is NOT a "free out-of-jail card". You should not use this method to modify element properties that could be modified via the `attributes` argument, nor values outside of the DOM element in question.
	
	Also note that the `config` callback only runs after a rendering lifecycle is done. Therefore, you should not use `config` to modify controller and model values, if you expect these changes to render immediately. Changes to controller and model values in this fashion will only render on the next `m.render` or `m.module` call.
	
	You can use this mechanism to attach custom event listeners to controller methods (for example, when integrating with third party libraries), but you are responsible for making sure the integration with Mithril's autoredrawing system is in place. See the [integration guide](integration.md) for more information.
	
	-	**DOMElement element**
	
	The DOM element that corresponds to virtual element defined by the `m()` call.
	
	-	**Boolean isInitialized**
	
	Whether this is the first time we are running this function on this element. This flag is false the first time it runs on an element, and true on redraws that happen after the element has been created.

-	**Children children** (optional)

	If this argument is a string, it will be rendered as a text node. To render a string as HTML, see [`m.trust`](mithril.trust)
	
	If it's a VirtualElement, it will be rendered as a DOM Element.
	
	If it's a list, its contents will recursively be rendered as appropriate and appended as children of the element being created.

-	**returns** VirtualElement

	The returned VirtualElement is a javascript data structure that represents the DOM element to be rendered by [`m.render`](mithril.render)

