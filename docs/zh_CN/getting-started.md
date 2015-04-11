## Getting Started
## 入门指南

### What is Mithril?
### Mithril是什么?

Mithril is a client-side Javascript MVC framework, i.e. it's a tool to ake application code divided into a data layer (called **M**odel), a UI layer (called **V**iew), and a glue layer (called **C**ontroller)

Mithril 是一个客户端的 Javascript MVC 框架，即将应用代码分拆成一个数据层（称为 **M**odel ），一个 UI 层（称为 **V**iew ），以及一个"胶水"层（称为 **C**ontroller ）。

Mithril is around 5kb gzipped thanks to its [small, focused, API](mithril.md). It provides a templating engine with a virtual DOM diff implementation for performant rendering, utilities for high-level modelling via functional composition, as well as support for routing and componentization.

得益于其[小而专注的 API](mithril.md)，Mithril 在通过 gzipped 压缩后只有5kb左右大小。它提供了一套模板引擎和一套虚拟 DOM 的 diff 实现方法，来达到高效的内容绘制；提供了通过函数组合进行高级别建模的工具，还有对路由和组件化的支持。

The goal of the framework is to make application code discoverable, readable and maintainable, and hopefully help you become an even better developer.

这个框架的目标是让应用代码变得可确定的，可读的且是可维护的，同时希望帮助你成为更好的开发者。

Unlike some frameworks, Mithril tries very hard to avoid locking you into a web of dependencies: you can use as *little* of the framework as you need.

和其他一些框架不同，Mithril 努力尝试去避免将你限制在一个依赖网络中：你可以使用你仅需要的框架的 *一小部分*。

However, using its entire toolset idiomatically can bring lots of benefits: learning to use functional programming in real world scenarios and solidifying good coding practices for OOP and MVC are just some of them.

然而，使用它的整个工具集可以带来很多好处：在现实世界的场景中学习使用函数式编程以及巩固好的 OOP 和 MVC 的编程习惯仅仅是（众多好处）的其中一部分。

---

## A Simple Application
## 一个简单的应用

Once you have a [copy of Mithril](installation.md), getting started is surprisingly boilerplate-free:

当你有一份 [Mithril 代码的拷贝](installation.md) 时，入门的工作是令人惊讶的简单（注：boilerplate-free不知道怎么译好）：

```markup
<!doctype html>
<title>Todo app</title>
<script src="mithril.min.js"></script>
<script>
//app goes here
</script>
```

Yes, this is valid HTML 5! According to the specs, the `<html>`, `<head>` and `<body>` tags can be omitted, but their respective DOM elements will still be there implicitly when a browser renders that markup.

是的，这就是合法的 HTML 5 文件！根据 HTML 5 的规范，`<html>`，`<head>`，`<body>`标签可以省略，但这些标签对应的 DOM 元素在浏览器呈现这个文件时还是会隐式地出现。

---

### Model

In Mithril, an application typically lives in a namespace and contains modules. Modules are merely structures that represent a viewable "page" or a part of a page. In addition, an application can be organizationally divided into three major layers: Model, Controller and View.

For simplicity, our application will have only one module, and we're going to use it as the namespace for our application.

In Mithril, a *module* is an object that contains two functions: `controller` and `view`.

在 Mithril 中，一个应用通常在一个命名空间中生存，并且包括模块。模块仅仅是表现一个可见的“页面”或者是一个页面的一部分。此外，一个应用可以被有组织的分为三个主要层：Model，Controller，View。

为了简洁，我们的应用只会有一个模块，我们会用这个模块来作为我们的应用的命名空间。


在 Mithril 中，一个 *模块* 是一个对象，包含两个函数：`controller` 和 `view`。

```
//an empty Mithril module
//一个空的 Mithril 模块
var myModule = {
	controller: function() {},
	view: function() {}
}
```

In addition to holding a controller and a view, a module is typically also used to store data that pertains to it.

Let's create a module.

除了存放 controller 和 view 之外，一个模块通常还会存放属于该模块的数据。

让我们来建立一个模块。

```markup
<script>
//this application only has one module: todo
var todo = {};
</script>
```

Typically, model entities are reusable and live outside of modules (e.g. `var User = ...`). In our example, since the whole application lives in one module, we're going to use the module as a namespace for our model entities.

通常，model 实体是可重用的，且在模块外生存（如：`User = ...`）在我们的例子中，因为整个应用就在一个模块中，我们将用这个模块作为我们 model 实体的命名空间。

```javascript
var todo = {};

//for simplicity, we use this module to namespace the model classes
//为了简洁，我们用这个模块来作为 model 类的命名空间

//the Todo class has two properties
//这个 Todo 类有两个属性
todo.Todo = function(data) {
	this.description = m.prop(data.description);
	this.done = m.prop(false);
};

//the TodoList class is a list of Todo's
//Todolist 类（的实体）是一个 Todo 类对象的列表
todo.TodoList = Array;
```

[`m.prop`](mithril.prop.md) is simply a factory for a getter-setter function. Getter-setters work like this:

[`m.prop`](mithril.prop.md) 是一个 getter-setter 函数的简单工厂。Getter-setter 工作如下图：

```javascript
//define a getter-setter with initial value `John`
//用初始值 `John` 定义一个 getter-setter
var a_name = m.prop("John");

//read the value
//读取值
var a = a_name(); //a == "John"

//set the value to `Mary`
//将值设为 `Mary`
a_name("Mary"); //Mary

//read the value
//再读取值
var b = a_name(); //b == "Mary"
```

Note that the `Todo` and `TodoList` classes we defined above are plain vanilla Javascript constructors. They can be initialized and used like this:

要注意到，我们刚才定义的 `Todo` 和 `TodoList` 类就是个普通的 Javascript 构造器。它们的对象可以像这样初始化和使用：

```javascript
var myTask = new todo.Todo({description: "Write code"});

//read the description
//读 description
myTask.description(); //Write code

//is it done?
//完成了么？
var isDone = myTask.done(); //isDone == false

//mark as done
//标记为完成
myTask.done(true); //true

//now it's done
//现在完成了
isDone = myTask.done(); //isDone == true
```

The `TodoList` class is simply an alias of the native `Array` class.

`Todolist` 类就是原生的 `Array` 类的别名。

```javascript
var list = new todo.TodoList();
list.length; //0
```

According to the classic definition of the MVC pattern, the model layer is responsible for data storage, state management and business logic.

You can see that our classes above fit the criteria: they have all the methods and properties that they need to be assembled into a meaningful state. A `Todo` can be instantiated, and have its properties changed. The list can have todo items added to it via the `push` method. And so on.

根据 MVC 模式的经典定义，model 层应该负责数据存放，状态管理和业务逻辑。

你可以留意到我们刚才定义的类符合这个标准：它们有组合成一个有含义的状态机所需的所有方法和属性。一个 Todo 对象可以被实例化，可以修改其属性，列表可以通过 `push` 方法来添加项，等等。

#### View-Model

Our next step is to write a view-model that will use our model classes. A view-model is a model level entity that stores UI state. In many frameworks UI state is typically stored in a controller, but doing so makes the code harder to scale since controllers aren't designed to be data providers. In Mithril, UI state is understood to be model data, even though it doesn't necessarily map to a database ORM entity.


View-models are also responsible for handling business logic that revolves around UI-specific restrictions. For example a form might have an input and a cancel button. In such a case, it's the view-model's responsibility to track the current state of the input vs the original state and to apply a cancellation, if required. In the event the form was saved, then view-model would delegate saving to a more appropriate ORM model entity.

In the case of our todo application, the view-model needs a few things: it needs to track a running list of todos and a field for adding new todos, and it needs to handle the logic of adding to the todo and the implications of this action of the UI.

我们的下一步是写一个 view-model 来使用我们的 model 类。一个 view-model 是一个 model 级别的实体，存放 UI 状态。在很多框架中，UI 状态通常放在 controller 中，但这样做会使得代码更难扩展，因为 controllers 不是设计成数据提供者的。在 Mithril 中，UI 状态被看做是 model 的数据，尽管其并不需要被映射到一个数据库ORM实体上。

View-model 同时还负责处理以 UI 相关限制为中心的的业务逻辑。例如一个表单会含有一个输入框和一个取消按钮。在这个情况下，view-model 需要跟踪输入框的当前状态，和原来的状态比较，在需要的时候取消输入。在表单保存的事件中，view-model 会将保存的操作通过代理的方式让一个更适于保存信息的 ORM model 实体来进行操作。

在我们的 todo 应用中，view-model 需要做到以下几件事：需要跟踪一个不断变化的 todo 列表，一个添加新的 todo 的输入域，和需要处理添加 todo 的逻辑，和该动作在 UI 层上的表现。

```javascript
//define the view-model
//定义 view-model
todo.vm = {
	init: function() {
		//a running list of todos
		//一个不断变化的 todo 列表
		todo.vm.list = new todo.TodoList();
		
		//a slot to store the name of a new todo before it is created
		//在新建一个 todo 前储存 todo 名称的变量（注：slot 怎么译）
		todo.vm.description = m.prop('');
		
		//adds a todo to the list, and clears the description field for user convenience
		//向列表添加一个 todo，同时清除输入框，方便用户
		todo.vm.add = function(description) {
			if (description()) {
				todo.vm.list.push(new todo.Todo({description: description()}));
				todo.vm.description("");
			}
		};
	}
};
```

The code above defines a view-model object called `vm`. It is simply a javascript object that has a `init` function. This function initializes the `vm` object with three members: `list`, which is simply an array, `description`, which is an `m.prop` getter-setter function with an empty string as the initial value, and `add`, which is a method that adds a new Todo instance to `list` if an input description getter-setter is not an empty string.

Later in this guide, we'll pass the `description` property as the parameter to this function. When we get there, I'll explain why we're passing description as an argument instead of simply using OOP-style member association.

You can use the view-model like this:

以上的代码定义了一个叫做 `vm` 的 view-model 对象。这个对象就是一个普通的 Javascript 对象，含有一个 `init` 函数。这个函数初始化了 vm 对象的三个成员：`list` 是一个数组，`description` 是一个 `m.prop` getter-setter 函数，其初始值是一个空字符串，还有 `add` 是一个方法，该方法在输入框的内容不是一个空字符串时添加一个新的 Todo 实例到 `list` 中。

稍候我们会将 `description` 属性当做参数传入这个函数中，届时我将解释为什么我们将 description 作为一个参数传入，而不是简单的使用 OOP 风格的成员关联【注：member association???】。

你可以这样来使用 view-model：

```javascript
//initialize our view-model
//初始化 view-model
todo.vm.init();

todo.vm.description(); //[empty string] [空字符串]

//try adding a to-do
//尝试添加一个 to-do
todo.vm.add(todo.vm.description);
todo.vm.list.length; //0, because you can't add a to-do with an empty description

//add it properly
//正确地添加
todo.vm.description("Write code");
todo.vm.add(todo.vm.description);
todo.vm.list.length; //1
```

---

### Controller

In classic MVC, the role of the controller is to dispatch actions from the view to the model layer. In traditional server-side frameworks, the controller layer is of large significance because the nature of HTTP requests, responses and the framework abstractions that are exposed to developers require that the controller act as an adapter layer to transform the serialized data from HTTP requests to something that can be passed to ORM model methods.

In client-side MVC, however, this dissonance doesn't exist, and controllers can be extremely simple. Mithril controllers can be stripped down to a bare minimum, so that they only perform a single essential role: to expose a scoped set of model-level functionality. As you may recall, models are responsible for encapsulating business logic, and view-models encapsulate logic that pertains specifically to UI state, so there's really nothing else for a controller to abstract away, and all it needs to do is expose a slice of the model layer that pertains to the UI that is currently in view.

In other words, all our controller needs to do is this:

在经典 MVC 中，controller 的角色是将来自 view 的动作分发到 model 层。在传统的服务器端框架中，controller 层非常重要，因为 HTTP 请求和回复的特点以及框架的抽象性，要求 controller 扮演一个适配器层，将来自 HTTP 请求的序列化的数据转换为可以传给 ORM model 的方法。【注：exposed to developers?】

然而，在客户端 MVC 中，这样的不一致并不存在，controller 可以极度简单。Mithril 的 controller 可以被剥离到最小，结果是它们只扮演一个单一的关键角色：暴露一组 model 层级的功能（译者注：指可以操作 model 的方法）。你可能还记得，model 负责封装业务逻辑，view-model 封装和 UI 状态相关的逻辑，所以对于 controller 来说，没有其他关系需要抽象，它需要做的所有工作就是将 model 层的和 UI 相关的，当前位于 view 的那部分暴露出来。

换句话说，controller 要做的全部事情就是：

```javascript
todo.controller = function() {
	todo.vm.init()
}
```

---

### View

The next step is to write a view so users can interact with the application

接下来的一部是写一个 view，这样用户可以和应用进行交互。

```javascript
todo.view = function() {
	return m("html", [
		m("body", [
			m("input"),
			m("button", "Add"),
			m("table", [
				m("tr", [
					m("td", [
						m("input[type=checkbox]")
					]),
					m("td", "task description"),
				])
			])
		])
	]);
};
```

The utility method `m()` creates virtual DOM elements. As you can see, you can use CSS selectors to specify attributes. You can also use the `.` syntax to add CSS classes and the `#` to add an id.

For the purposes of testing out our code so far, the view can be rendered using the `m.render` method:

通用方法 `m()` 创建一个虚拟 DOM 元素。如你见，你可以用 CSS 选择器来指定属性，你还可以用 `.` 语法来添加 CSS 类，用 `#`来添加 id。

到现在为止，为了测试一下我们的代码，我们可以用 `m.render` 方法来绘制 view：

```javascript
m.render(document, todo.view());
```

Notice that we pass a root DOM element to attach our template to, as well as the template itself.

This renders the following markup:

要注意的是，我们传入了一个作为根节点的 DOM 元素来将我们的模板附加在上，同时传入了要附加的模板。

这段代码绘制的结果是以下的标签：

```markup
<html>
	<body>
		<input />
		<button>Add</button>
		<table>
			<tr>
				<td><input type="checkbox" /></td>
				<td>task description</td>
			</tr>
		</table>
	</body>
</html>
```

Note that `m.render` is a very low level method in Mithril that draws only once and doesn't attempt to run the auto-redrawing system. In order to enable auto-redrawing, the `todo` module must be initialized by either calling `m.module` or by creating a route definition with `m.route`. Also note that, unlike observable-based frameworks like Knockout.js, setting a value in a `m.prop` getter-setter does NOT trigger redrawing side-effects in Mithril.

要注意的是，`m.render` 是 Mithril 一个非常底层的方法，它只执行一次，且不会尝试启动自动重绘系统。（译者注：这里的“重绘”是指 Mithril 根据 view 中含有的 model 的值，对 view 进行重新解析的过程，不是浏览器的重绘）为了启用自动重绘，必须通过调用 `m.module` 方法或者通过 `m.route` 方法定义路由来初始化 `todo` 模块。还要注意，和基于观察者模式的框架如 Knockout.js 不同，对一个 `m.prop` getter-setter 进行赋值 **不会** 触发 Mithril 的重绘副作用。

---

#### Data Bindings
#### 数据绑定

Let's implement a **data binding** on the text input. Data bindings connect a DOM element to a Javascript variable so that updating one updates the other.

让我们来对输入框实现 **数据绑定**。数据绑定将一个 DOM 元素和一个 Javascript 变量连接起来，这样对其中一个进行更新都将更新另一个。

```javascript
//binding a model value to an input in a template
//将一个 model 的值和一个在模板中的输入框绑定
m("input", {value: todo.vm.description()})
```

This binds the `description` getter-setter to the text input. Updating the value of the description in the model updates the DOM input when Mithril redraws.

这段代码将 `description` getter-setter 和输入框绑定起来。更新 model 中的 description 的值会在 Mithril 重绘时修改 DOM 输入框。

```javascript
todo.vm.init();

todo.vm.description(); // empty string 空字符串
m.render(document, todo.view()); // input is blank 输入框是空的

todo.vm.description("Write code"); //set the description in the controller 在 controller 中设置 description 的值
m.render(document, todo.view()); // input now says "Write code" 这时输入框中显示 "Write code"
```

At a glance it may seem like we're doing something very expensive by redrawing, but as it turns out, calling the `todo.view` method multiple times does not actually re-render the entire template. Internally, Mithril keeps a virtual representation of the DOM in cache, scans for changes, and then only modifies the absolute minimum required to apply the change to the DOM. In practice, this results in surprisingly fast re-rendering.

In the case above, Mithril only touches the `value` attribute of the input.

Note that the example above only *sets* the value of the input element in the DOM, but it never *reads* it. This means that typing something on the input and then re-rendering will clobber the text on screen.

乍一看好像我们用做了一些很昂贵的工作如重绘，但事实证明，多次调用 `todo.view` 方法实际上并不会重新绘制整个模板。在内部，Mithril 在缓存保留一个对 DOM 的虚拟形式，检查需要变化的地方，只修改需要应用到 DOM 的变化，这样的结果是重新绘制的速度非常的快。

注意到上述例子只 *设置* 了 DOM 的 input 元素的值，但从来没有 *读取* 之。这意味着，即使（用户）在 input 元素中输入其他内容，在重绘时这些内容会被覆写。

---

Fortunately, bindings can also be **bi-directional**: that is, they can be coded in such a way that, in addition to setting the DOM value, it's also possible to read it as a user types, and then update the `description` getter-setter in the view-model.

Here's the most basic way of implementing the view-to-model part of the binding:

幸运的是，绑定可以是 **双向** ：即，可以以这样的方法编码，除了设置 DOM 的值外，同时可以在用户输入时读取其输入的值，然后更新 view-model 中 `description` getter-setter 的值。

以下是实现 view 到 model 绑定的最基本的方法：

```javascript
m("input", {onchange: m.withAttr("value", todo.vm.description), value: todo.vm.description()})
```

The code bound to the `onchange` can be read like this: "with the attribute value, set todo.vm.description".

Note that Mithril does not prescribe how the binding updates: you can bind it to `onchange`, `onkeypress`, `oninput`, `onblur` or any other event that you prefer.

You can also specify what attribute to bind. This means that just as you are able to bind the `value` attribute in an `<select>`, you are also able to bind the `selectedIndex` property, if needed for whatever reason.

The `m.withAttr` utility is a functional programming tool provided by Mithril to minimize the need for anonymous functions in the view.

The `m.withAttr("value", todo.vm.description)` call above returns a function that is the rough equivalent of this code:

和 `onchange` 对应的代码可以这么理解："用这个属性值，设置 todo.vm.description"

值得一提的是，Mithril 不会规定绑定更新的方式：你可以绑定到 `onchange`，`onkeypress`，`oninput`，`onblur`或者任何你喜欢的事件。

你还可以指定绑定的属性，这意味着除了绑定 `<select>` 元素的 `value` 属性，你还可以绑定 `selectedIndex` 属性，如果需要的话。

`m.withAttr` 方法是 Mithril 提供的一个函数式编程工具，用于最小化 view 中需要的匿名函数的使用。

`m.withAttr("value", todo.vm.description)` 返回一个函数，大概和以下代码相同：

```javascript
onchange: function(e) {
	todo.vm.description(e.target["value"]);
}
```

The difference, aside from avoiding an anonymous function, is that the `m.withAttr` idiom also takes care of catching the correct event target and selecting the appropriate source of the data - i.e. whether it should come from a Javascript property or from `DOMElement::getAttribute()`

除了避免匿名函数外，`m.withAttr` 语法同时保证获得正确的事件对象，以及选择合适的数据源 - 即应该从 Javascript 属性中获得，还是从 `DOMElement::getAttribute()` 中获得。

---

In addition to bi-directional data binding, we can also bind parameterized functions to events:

除了双向数据绑定，我们还可以对事件绑定参数化的函数：

```javascript
var vm = todo.vm

m("button", {onclick: vm.add.bind(vm, vm.description)}, "Add")
```

In the code above, we are simply using the native Javascript `Function::bind` method. This creates a new function with the parameter already set. In functional programming, this is called [*partial application*](http://en.wikipedia.org/wiki/Partial_application).

The `vm.add.bind(vm, vm.description)` expression above returns a function that is equivalent to this code:

在上述代码中，我们使用了 Javascript 原生的 `Function::bind` 函数。这个函数新建一个已设置了参数的函数。在函数式编程中，这叫做 [*partial application*](http://en.wikipedia.org/wiki/Partial_application)。

上述的 `vm.add.bind(vm, vm.description)` 表达式返回一个函数，和下面代码等同：

```javascript
onclick: function(e) {
	todo.vm.add(todo.vm.description)
}
```

Note that when we construct the parameterized binding, we are passing the `description` getter-setter *by reference*, and not its value. We only evaluate the getter-setter to get its value in the controller method. This is a form of *lazy evaluation*: it allows us to say "use this value later, when the event handler gets called".

Hopefully by now, you're starting to see why Mithril encourages the usage of `m.prop`: Because Mithril getter-setters are functions, they naturally compose well with functional programming tools, and allow for some very powerful idioms. In this case, we're using them in a way that resembles C pointers.

Mithril uses them in other interesting ways elsewhere.

Clever readers will probably notice that we can refactor the `add` method to make it much simpler:

当我们构建参数化的绑定时，我们 *按引用* 传入了 `description` getter-setter，而不是传入其值。我们只有在 controller 方法中计算 getter-setter 的值。这是一种 *lazy evaluation*：允许我们“在稍后使用这个值，当事件函数被调用时”。（注：这里译成“句柄”会不会更容易被接受？）

希望到这里时，你开始明白为什么 Mithril 鼓励使用 `m.prop` 了：因为 Mithril 的 getter-setter 是函数，它们和函数式编程工具天生合得来，而且可以使用一些非常强大的语法。在这个例子中，我们用一种类似 C 指针的方式来使用它们。

Mithril 在其他有趣的地方也使用了它们。

聪明的你大概会意识到我们可以来重构 `add` 方法，让它变得更加简洁了：


```javascript
vm.add = function() {
	if (vm.description()) {
		vm.list.push(new todo.Todo({description: vm.description()}));
		vm.description("");
	}
};
```

The difference with the modified version is that `add` no longer takes an argument.

With this, we can make the `onclick` binding on the template *much* simpler:

修改后的 `add` 版本的区别在于其不再接受参数。

这样子，我们可以让模板中的 `onclick` 绑定变得 *更加* 简洁：

```
m("button", {onclick: todo.vm.add}, "Add")
```

The only reason I talked about partial application here was to make you aware of that technique, since it becomes useful when dealing with parameterized event handlers. In real life, given a choice, you should always pick the simplest idiom for your use case.

我提到 partial application 的唯一理由是让你知道这么个技术，因为在处理参数化事件函数时这个概念会有用。在现实生活中，你应该选择相对你的使用场景来说最简单的术语。

---

To implement flow control in Mithril views, we simply use Javascript Array methods:

我们使用 Javascript 数组方法来实现对 Mithril view 的流控制：

```javascript
//here's the view
//这是 view
m("table", [
	todo.vm.list.map(function(task, index) {
		return m("tr", [
			m("td", [
				m("input[type=checkbox]")
			]),
			m("td", task.description()),
		])
	})
])
```

In the code above, `todo.vm.list` is an Array, and `map` is one of its native functional methods. It allows us to iterate over the list and merge transformed versions of the list items into an output array.

As you can see, we return a partial template with two `<td>`'s. The second one has a data binding to the `description` getter-setter of the Todo class instance.

You're probably starting to notice that Javascript has strong support for functional programming and that it allows us to naturally do things that can be clunky in other frameworks (e.g. looping inside a `<dl>/<dt>/<dd>` construct).

在上述代码中，`todo.vm.list` 是一个数组，`map` 是其原生的函数式方法。它允许我们遍历列表，并将变换后的列表条目合并成一个数组作为输出结果。

如你所见，我们返回一个 partial 模板，有两个`<td>`。第二个 `<td>` 和 Todo 类的实例的 `description` getter-setter 有一个数据绑定。

你大概开始意识到 Javascript 对函数式编程有强大的支持，它允许我们自如的完成在其他框架中可能会很麻烦的事情（比如：遍历一个 `<dl>/<dt>/<dd>` 结构）

---

The rest of the code can be implemented using idioms we already covered. The complete view looks like this:

剩余的代码可以用我们已经解释过的语法来实现。完整的 view 如下：

```javascript
todo.view = function() {
	return m("html", [
		m("body", [
			m("input", {onchange: m.withAttr("value", todo.vm.description), value: todo.vm.description()}),
			m("button", {onclick: todo.vm.add}, "Add"),
			m("table", [
				todo.vm.list.map(function(task, index) {
					return m("tr", [
						m("td", [
							m("input[type=checkbox]", {onclick: m.withAttr("checked", task.done), checked: task.done()})
						]),
						m("td", {style: {textDecoration: task.done() ? "line-through" : "none"}}, task.description()),
					])
				})
			])
		])
	]);
};
```

Here are the highlights of the template above:

-	The template is rendered as a child of the implicit `<html>` element of the document.
-	The text input saves its value to the `todo.vm.description` getter-setter we defined earlier.
-	The button calls the `todo.vm.add` method when clicked.
-	The table lists all the existing to-dos, if any.
-	The checkboxes save their value to the `task.done` getter setter.
-	The description gets crossed out via CSS if the task is marked as done.
-	When updates happen, the template is not wholly re-rendered - only the changes are applied.

上述代码有几个重点：

- 这个模板绘制后会是文档的隐式的`<html>`元素的子元素。
- 输入框将其 value 值保存到我们先前定义的 `todo.vm.description` getter-setter 中
- 点击 button 会调用 `todo.vm.add` 方法
- table 列举了所有的 to-do
- checkbox 的值保存到了 `task.done` getter-setter 中
- 通过 CSS 样式，当任务被标记为完成时，任务描述会被划掉
- 当发生更新时，模板不会整个重新绘制 - 只有发生变化的部分会重绘


---

So far, we've been using `m.render` to manually redraw after we made a change to the data. However, as I mentioned before, you can enable an [auto-redrawing system](auto-redrawing.md), by initializing the `todo` module via `m.module`.

到目前为止，我们用 `m.render` 在修改数据后，手动地重绘模板。然而正如我之前提及的，你可以通过用 `m.module` 初始化 `todo` 模块的方法来启用 [自动重绘](auto-redrawing.md)

```javascript
//render the todo module inside the document DOM node
//在 document DOM 节点中绘制 todo 模块
m.module(document, {controller: todo.controller, view: todo.view});
```

Mithril's auto-redrawing system keeps track of controller stability, and only redraws the view once it detects that the controller has finished running all of its code, including asynchronous AJAX payloads. Likewise, it intelligently waits for asynchronous services inside event handlers to complete before redrawing.

You can learn more about how redrawing heuristics work [here](auto-redrawing.md).

Mithril 的自动重绘系统追踪 controller 的稳定性，只有在 controller 执行完所有代码后才开始重绘 view，包括异步的 AJAX。同样的，Mithril 会机智地等待事件函数中的异步服务完成后才重绘。

你可以在 [这里](auto-redrawing.md) 了解更多关于重绘的启发式工作。

---

### Summary
### 总结

Here's the application code in its entirety:

以下是全部的应用代码：

```markup
<!doctype html>
<script src="mithril.min.js"></script>
<script>
//this application only has one module: todo
var todo = {};

//for simplicity, we use this module to namespace the model classes

//the Todo class has two properties
todo.Todo = function(data) {
	this.description = m.prop(data.description);
	this.done = m.prop(false);
};

//the TodoList class is a list of Todo's
todo.TodoList = Array;

//the view-model tracks a running list of todos,
//stores a description for new todos before they are created
//and takes care of the logic surrounding when adding is permitted
//and clearing the input after adding a todo to the list
todo.vm = (function() {
	var vm = {}
	vm.init = function() {
		//a running list of todos
		vm.list = new todo.TodoList();
		
		//a slot to store the name of a new todo before it is created
		vm.description = m.prop("");
		
		//adds a todo to the list, and clears the description field for user convenience
		vm.add = function() {
			if (vm.description()) {
				vm.list.push(new todo.Todo({description: vm.description()}));
				vm.description("");
			}
		};
	}
	return vm
}())

//the controller defines what part of the model is relevant for the current page
//in our case, there's only one view-model that handles everything
todo.controller = function() {
	todo.vm.init()
}

//here's the view
todo.view = function() {
	return m("html", [
		m("body", [
			m("input", {onchange: m.withAttr("value", todo.vm.description), value: todo.vm.description()}),
			m("button", {onclick: todo.vm.add}, "Add"),
			m("table", [
				todo.vm.list.map(function(task, index) {
					return m("tr", [
						m("td", [
							m("input[type=checkbox]", {onclick: m.withAttr("checked", task.done), checked: task.done()})
						]),
						m("td", {style: {textDecoration: task.done() ? "line-through" : "none"}}, task.description()),
					])
				})
			])
		])
	]);
};

//initialize the application
m.module(document, {controller: todo.controller, view: todo.view});
</script>
```

---

This example is also available as a [jsFiddle](http://jsfiddle.net/milesmatthias/fbgypzbr/1/).

这个例子可以从 [jsFiddle](http://jsfiddle.net/milesmatthias/fbgypzbr/1/) 处得到。

## Notes on Architecture
## 关于架构的说明

Idiomatic Mithril code is meant to apply good programming conventions and be easy to refactor.

In the application above, notice how the Todo class can easily be moved to a different module if code re-organization is required.

Todos are self-contained and their data aren't tied to the DOM like in typical jQuery based code. The Todo class API is reusable and unit-test friendly, and in addition, it's a plain-vanilla Javascript class, and so has almost no framework-specific learning curve.

[`m.prop`](mithril.prop.md) is a simple but surprisingly versatile tool: it's functionally composable, it enables [uniform data access](http://en.wikipedia.org/wiki/Uniform_data_access) and allows a higher degree of decoupling when major refactoring is required.

When refactoring is unavoidable, the developer can simply replace the `m.prop` call with an appropriate getter-setter implementation, instead of having to grep for API usage across the entire application.

For example, if todo descriptions needed to always be uppercased, one could simply change the `description` getter-setter:

理想中的 Mithril 代码会采用好的编程范式，且是易于重构的。

在上述的应用中，请留意可以很容易的将 Todo 类移到另一个模块，如果需要重新组织代码的话。

Todo 是自我包含的，它们的数据并没有像典型的基于 jQuery 的代码一样和 DOM 绑在一起。Todo 类的 API 是可重用的，且对单元测试友好，同时，它是一个普通的 Javascript 类，所以几乎没有和框架相关的学习曲线。

[`m.prop`](mithril.prop.md) 是一个简单而（令人惊讶的）多功能的工具：它可以和其它函数组合，允许 [uniform data access](http://en.wikipedia.org/wiki/Uniform_data_access) 还允许在需要大的重构时，在更高的层次上进行解耦。

当重构不可避免时，开发者只需要简单的用一个合适的 getter-setter 函数取代 `m.prop`，而不需要了解整个应用中的 API 用法。

例如，如果 todo 的描述需要总是大写的，只需要修改 `description` 的 getter-setter：

```javascript
this.description = m.prop(data.description)
```

becomes:

改成：

```javascript
//private store
var description;

//public getter-setter
this.description = function(value) {
	if (arguments.length > 0) description = value.toUpperCase();
	return description;
}

//make it serializable
this.description.toJSON = function() {return description}

//set the value
this.description(data.description)
```

In the view-model, we aliased the native Array class for `TodoList`. Be aware that by using the native Array class, we're making an implicit statement that we are going to support all of the standard Array methods as part of our API.

While this decision allows better API discoverability, the trade-off is that we're largely giving up on custom constraints and behavior. For example, if we wanted to change the application to make the list be persisted, a native Array would most certainly not be a suitable class to use.

In order to deal with that type of refactoring, one can explicitly decide to support only a subset of the Array API, and implement another class with the same interface as this subset API.

Given the code above, the replacement class would only need to implement the `.push()` and `.map()` methods. By freezing APIs and swapping implementations, the developer can completely avoid touching other layers in the application while refactoring.

在 view-model 中，我们用 `TodoList` 作为原生的 Javascript 数组类的别名。请注意，当使用原生数组类时，我们隐式声明我们将支持所有标准的数组方法，作为我们 API 的其中一部分。（译者注：即在不支持部分标准的数组方法的环境中， Mithril 将通过 polyfill 补充这些方法）

这个决定会让 API 变得更加 discoverability，但其代价是 we're largely giving up on custom constraints and behavior. 例如，如果我们想修改应用，让列表持久化，一个原生的数组肯定不是一个合适的类。

为了处理这种情况的重构，开发者可以显式地决定仅支持数组 API 的一个子集，然后实现另一个类，这个类和这个子集的 API 的接口相同。

考虑以上的代码，替代的类只需要实现 `push()` 和 `map()` 两个方法。通过”冻结“ API 以及替换实现的方式，开发者可以在重构中完全避免接触应用的其他层的代码：

```javascript
todo.TodoList = Array;
```

becomes:

```javascript
todo.TodoList = function () {
	this.push = function() { /*...*/ },
	this.map = function() { /*...*/ }
};
```

Hopefully these examples give you an idea of ways requirements can change over time and how Mithril's philosophy allows developers to use standard OOP techniques to refactor their codebases, rather than needing to modify large portions of the application.

希望这些例子能够为你提供 an idea of ways requirements can change over time 以及 Mithril 的哲学是如何允许开发者使用标准的 OOP 技术来重构他们的代码，同时无需大规模的修改应用。

---

The first and most obvious thing you may have noticed in the view layer is that the view is not written in HTML.

While superficially this may seem like an odd design, this actually has a lot of benefits:

-	No flash-of-unbehaviored-content (FOUC). In fact, Mithril is able to render a fully functional application - with working event handlers - before the "DOM ready" event fires!

-	There's no need for a parse-and-compile pre-processing step to turn strings containing HTML + templating syntax into working DOM elements.

-	Mithril views can provide accurate and informative error reporting, with line numbers and meaningful stack traces.

-	You get the ability to automate linting, unit testing and minifying of the entire view layer.

-	It provides full Turing completeness: full control over evaluation eagerness/laziness and caching in templates. You can even build components that take other components as first-class-citizen parameters!

关于 view 层，你可能会留意到的第一个，也是最明显的一个事情是 view 并不是由 HTML 写成的。

从表面看，这是一个奇怪的设计，但实际上这样的设计有很多优点：

- 没有 flash-of-unbehaviored-content (FOUC). 事实上，Mithril 可以在 "DOM ready" 事件触发前，绘制一个功能完整的应用（和可用的事件函数）。
- 不需要 解析-编译 的预处理，来将HTML和模板语法转换为 DOM 元素
- Mithril view 可以提供准确且富含信息的错误报告，包含行数和有意义的调用栈踪迹。
- 你可以对整个 view 层进行语法检查，单元测试和最小化
- 它提供了图灵完备性：full control over evaluation eagerness/laziness and caching in templates. You can even build components that take other components as first-class-citizen parameters!

And if you really do want to use HTML syntax after all, [you can use a package called MSX](https://github.com/insin/msx).

Views in Mithril use a virtual DOM diff implementation, which sidesteps performance problems related to opaque dirty-checking and excessive browser repaint that are present in some frameworks.

Another feature - the optional `m()` utility - allows writing terse templates in a declarative style using CSS shorthands, similar to popular HTML preprocessors from server-side MVC frameworks.

And because Mithril views are Javascript, the developer has full freedom to abstract common patterns - from bidirectional binding helpers to full blown components - using standard Javascript refactoring techniques.

如果你最后还是想使用 HTML 语法，[你可以使用MSX](https://github.com/insin/msx).

在其他框架中出现的不透明的 dirty-checking 和过多的浏览器重绘造成了性能问题，Mithril 的 view 通过使用虚拟 DOM diff ，回避了这些问题。（译者注：感觉黑了ng...）

另一个功能 - 可选的 `m()` 方法 - 能让你用声明式的风格利用 CSS 选择器写出简洁的模板，和服务器端的 MVC 框架的一些流行的 HTML 预处理器类似（译者注：如jade）

同时，因为 Mithril view 是 Javascript，开发者有全部的自由，来对公共范式进行抽象，从双向绑定的辅助函数，到完整的组件 - 利用 Javascript 重构技术。

Mithril templates are also more collision-proof than other component systems since there's no way to pollute the HTML tag namespace by defining ad-hoc tag names. [TODO]

A more intellectually interesting aspect of the framework is that event handling is encouraged to be done via functional composition (i.e. by using tools like [`m.withAttr`](mithril.withAttr.md), [`m.prop`](mithril.prop.md) and the native `.bind()` method for partial application). [TODO]

If you've been interested in learning or using Functional Programming in the real world, Mithril provides very pragmatic opportunities to get into it. [TODO]


---

## Learn More

Mithril provides a few more facilities that are not demonstrated in this page. The following topics are good places to start a deeper dive.

-	[Routing](routing.md)
-	[Web Services](web-services.md)
-	[Components](components.md)

## Advanced Topics

-	[Optimizing performance](optimizing-performance.md)
-	[Integrating with the Auto-Redrawing System](auto-redrawing.md)
-	[Integrating with Other Libraries](integration.md)

## Misc

-	[Differences from Other MVC Frameworks](comparison.md)
-	[Benchmarks](benchmarks.md)
-	[Good Practices](practices.md)
-	[Useful Tools](tools.md)
