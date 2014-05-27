## How Should Code Be Organized

While Mithril doesn't dictate how to organize your code, it does provide some recommendations for structuring it.

As a rule of thumb, controllers should not change model entity properties on an individual basis.

Data manipulation should be done in model classes, such that controllers never have entities lying around in temporarily invalid states.

Mithril's design strongly encourages all entity logic to be handled in atomic model layer methods (in the sense of entity state stability).

In fact, unavoidable abstraction leaks (such as network-bound asynchrony) are laid out in such a way as to make idiomatic code organization elegant, and conversely, to make it so that the abstraction leak problems themselves discourage attempts to misplace entity logic in the controller.

This design decision comes from experience with [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) and the ["bus factor"](http://en.wikipedia.org/wiki/Bus_factor) of large, highly relational model layers.

This is in stark contrast to the ActiveRecord pattern of other frameworks, where model entities are largely object representations of database entities and these entities are manipulated in controllers in an ad-hoc field-by-field fashion, and then "committed" via a `save` method.

Because Mithril encourages all entity logic to be done in the model layer, it's idiomatic to create modules with model-level classes that deal specifically with relationships between entities, when there isn't already a model entity that can logically hold the relational business logic.

Models are also responsible for centralizing tasks such as filtering of entity lists and validation routines, so that access to these methods is available across the application.

DOM manipulation should be done in the view via [`m()` and `config`](mithril). Controllers may explicitly call [`m.redraw`](mithril.redraw), but, if possible, it's preferable to abstract this into a service which integrates with Mithril's auto-redrawing system (see [`m.startComputation` / `m.endComputation`](mithril.computation)).

---

## File Separation

The examples in this site usually conflate different MVC layers together for the sake of readability, but normally it's recommended that each layer on a module be in different files. For example:

```javascript
//app.model.js
var app = {};

app.PageList = function() {
	return m.request({method: "GET", url: "pages.json"});
};
```

```javascript
//app.controller.js
app.controller = function() {
	this.pages = new app.PageList();
};
```

```javascript
//app.view.js
app.view = function(ctrl) {
	return ctrl.pages().map(function(page) {
		return m("a", {href: page.url}, page.title);
	});
};
```

You can use task automation tools such as GruntJS to concatenate the files back together for production.

Typically, when separating MVC layers, it's common that the namespace declaration be in the model layer, since this is usually the most used dependency for the other layers.

You may choose to declare the namespace in a separate file or have the build system generate it on demand, instead.

You should avoid grouping classes by the MVC layer they belong to, i.e. don't create three files called model.js, controllers.js and views.js.

That organization pattern needlessly ties unrelated aspects of the application together and dilutes the clarity of modules.

---

## Global Namespace Hygiene

For developer convenience, Mithril uses the global `m` variable as a namespace, much like jQuery uses `$`.

If you want to ensure global namespace hygiene, you can wrap your code in "islands" like this:

```javascript
new function(m) {

	//your code goes here
	
}(Mithril);
```

If you are creating components to be used by 3rd parties, it's recommended that you always use this idiom.

In the unlikely case that you have another global variable called `m` in your page, you should consider renaming it to make it more descriptive, or use the idiom below to keep it intact.

```markup
<script>_temp = m</script>
<script src="mithril.js"></script>
<script>m = _temp</script>
```

---

## Usage of m.redraw

`m.redraw` is a method that allows you to render a template outside the scope of Mithril's auto-redrawing system.

Calling this method while using `m.module` or `m.route` should only be done if you have recurring asynchronous view updates (i.e. something that uses setInterval).

If you're integrating other non-recurring services (e.g. calling setTimeout), you should use [`m.startComputation` / `m.emdComputation`](mithril.computation.md) instead.

This is the most potentially expensive method in Mithril and should not be used at a rate faster than the rate at which the native `requestAnimationFrame` method fires (i.e. the rate at which browsers are comfortable calling recurring rendering-intensive code). Typically, this rate is around 60 calls per second.

If you call this method more often than that, Mithril may ignore calls or defer them to the next browser repaint cycle.

If calls are more expensive than a repaint window, the browser may drop frames, resulting in choppy animations. It's your responsibility to make sure single iterations of animation rendering code don't take longer than 16ms (for a frequency of 60 frames-per-second).

In addition, note that template performance, both in Mithril templates as well as in general, is dependent on markup complexity. You are responsible for ensuring that templates aren't too big to render efficiently.
