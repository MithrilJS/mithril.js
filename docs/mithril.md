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

Each `m()` call creates a virtual DOM element, that is, a Javascript object that represents a DOM element, and which is eventually converted into one.

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
    {title: "item 2", url: "/item2"},
    {title: "item 3", url: "/item3"}
];

m.render(document.body, [
    m("ul.nav", [
        m("li", links.map(function(link) {
            return m("a", {href: link.url}, link.title)
        }))
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

Note that you can use both Javascript property names and HTML attribute names to set values in the `attributes` argument, but you should pass a value of appropriate type. If an attribute has the same name in Javascript and in HTML, then Mithril assumes you're setting the Javascript property.

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

Mithril also does not auto-camel-case CSS properties on inline style attributes, so you should use the Javascript syntax when setting them via Javascript objects:

```javascript
m("div", {style: {textAlign: "center"}}); //yields <div style="text-align:center;"></div>

//this does not work
m("div", {style: {"text-align": "center"}});
```

You can, however, use CSS syntax when defining style rules as inline strings:

```javascript
m("div[style='text-align:center']"); //yields <div style="text-align:center;"></div>
```

One caveat of using the CSS syntax is that it clobbers the `style` attribute in the DOM element on redraws, so this syntax is not appropriate if you need to use it in conjunction with 3rd party tools that modify the element's style outside of Mithril's templates (e.g. via `config`, which is explained below)

---

#### Accessing the real DOM element

You can define a non-HTML-standard attribute called `config`. This special parameter allows you to call methods on the DOM element after it gets created.

This is useful, for example, if you declare a `canvas` element and want to use the Javascript API to draw:

```javascript
function draw(element, isInitialized, context) {
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

#### Persisting config data

The third argument for `config` allows you to map data to a virtual DOM element in a way that persists across redraws. This is useful when a `config` instantiates 3rd party classes and accesses the instance on redraws.

The example below shows a contrived redraw counter. In it, the count is stored in the context object and re-accessed on each redraw.

```javascript
function alertsRedrawCount(element, isInit, context) {
	if (!isInit) context.count = 0
	alert(++context.count)
}

m("div", {config: alertsRedrawCount})
```

---

#### Destructors

If the `context` object that is passed to a `config` function has a property called `onunload`, this function will be called when the element gets detached from the document by Mithril's diff engine.

This is useful if there are cleanup tasks that need to be run when an element is destroyed (e.g. clearing `setTimeout`'s, etc)

```javascript
function unloadable(element, isInit, context) {
	context.timer = setTimeout(function() {
		alert("timed out!");
	}, 1000);
	
	context.onunload = function() {
		clearTimeout(context.timer);
		console.log("unloaded the div");
	}
};

m.render(document, m("div", {config: unloadable}));

m.render(document, m("a")); //logs `unloaded the div` and `alert` never gets called
```

---

#### SVG

You can use Mithril to create SVG documents (as long as you don't need to support browsers that don't support SVG natively).

Mithril automatically figures out the correct XML namespaces when it sees an SVG island in the virtual DOM tree.

```javascript
m("svg[height='200px'][width='200px']", [
	m("image[href='foo.jpg'][height='200px'][width='200px']")
])
```

---

#### Dealing with focus

The virtual DOM diffing algorithm has a weakness: a naive diff is not aware of the identity of DOM elements. In practice, this means performing operations like shifting an item from the beginning of a list would cause every element in the list to be diffed and potentially recreated. Another side-effect is that UI state like input focus is not tracked correctly if the focused element moves around, and likewise, state for 3rd party plugins that are added via `config` can also end up in the wrong element.

Fortunately, with Mithril, it's possible for developers to attach an identity key to elements so that array operations like shift, splice and sort only affect the minimum amount of elements required, leaving the rest of the DOM elements untouched when a redraw happens. This allows us to maintain input focus and plugin state correctly.

To maintain the identities of DOM elements, you need to add a `key` property to the direct children of the array that you're planning to modify. The key for each child must be unique among its siblings, but it does not need to be globally unique. Also, keys must be either strings or numbers.

```javascript
m("ul", [
	ctrl.items.map(function(item) {
		return m("li", {key: item.id}, [
			m("input")
		]);
	})
]);
```

In the example above, input focus would be maintained correctly after a redraw even if `ctrl.items` got sorted or reversed. The key is defined in the `li`, which is the closest element to the `ctrl.items` array, not directly on the `input`, even though we want to track focus on the input.

Note that in addition to the presence of the `key` attribute, diffing rules also apply in determining whether an element is recreated. Elements are recreated if either their node name changes, or if the list of attribute names change, or if the ID attribute changes. To avoid surprises, be sure to change only attribute values, using `undefined` or `null` as values if appropriate, rather than conditionally substituting attribute dictionaries altogether.

```javascript
//avoid using this idiom
m("li", selected ? {class: "active"} : {})

//use this idiom instead
m("li", {class: selected ? "active" : ""})
```

---

### Signature

[How to read signatures](how-to-read-signatures.md)

```clike
VirtualElement m(String selector [, Attributes attributes] [, Children children])

where:
	VirtualElement :: Object { String tag, Attributes attributes, Children children }
    Attributes :: Object<any | void config(DOMElement element, Boolean isInitialized, Object context)>
	Children :: String text | VirtualElement virtualElement | SubtreeDirective directive | Array<Children children>
	SubtreeDirective :: Object { String subtree }
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
	
	**void config(DOMElement element, Boolean isInitialized, Object context)** (optional)

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

	-	**Object context**
	
	An object that retains its state across redraws. It can be used to store instances of 3rd party classes that need to be accessed more than one time throughout the lifecycle of a page.
	
	The example below shows a contrived redraw counter. In it, the count is stored in the context object and re-accessed on each redraw.

	```javascript
	function alertsRedrawCount(element, isInit, context) {
		if (!isInit) context.count = 0
		alert(++context.count)
	}

	m("div", {config: alertsRedrawCount})
	```
	
	If the `context` object that is passed to a `config` function has a property called `onunload`, this function will be called when the element gets detached from the document by Mithril's diff engine.

	This is useful if there are cleanup tasks that need to be run when an element is destroyed (e.g. clearing `setTimeout`'s, etc)

	```javascript
	function unloadable(element, isInit, context) {
		context.timer = setTimeout(function() {
			alert("timed out!");
		}, 1000);
		
		context.onunload = function() {
			clearTimeout(context.timer);
			console.log("unloaded the div");
		}
	};

	m.render(document, m("div", {config: unloadable}));

	m.render(document, m("a")); //logs `unloaded the div` and `alert` never gets called
	```
	
-	**Children children** (optional)

	If this argument is a string, it will be rendered as a text node. To render a string as HTML, see [`m.trust`](mithril.trust)
	
	If it's a VirtualElement, it will be rendered as a DOM Element.
	
	If it's a list, its contents will recursively be rendered as appropriate and appended as children of the element being created.
	
	If it's a SubtreeDirective with the value "retain", it will retain the existing DOM tree in place, if any. See [subtree directives](mithril.render#subtree-directives) for more information.

-	**returns** VirtualElement

	The returned VirtualElement is a Javascript data structure that represents the DOM element to be rendered by [`m.render`](mithril.render)

