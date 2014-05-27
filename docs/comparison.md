## How is Mithril Different from Other Frameworks

There are a lot of different Javascript MVC frameworks and evaluating their merits and shortcomings can be a daunting task.

This page aims to provide a comparison between Mithril and some of the most widely used frameworks, as well as some of the younger, but relevant ones.

### Code Size

One of the most obvious differences between Mithril and most frameworks is in file size: Mithril is around 4kb gzipped and has no dependencies on other libraries.

Note that while a small gzipped size can look appealing, that number is often used to "hide the weight" of the uncompressed code: remember that the decompressed Javascript still needs to be parsed and evaluated on every page load, and this cost (which can be in the dozens of milliseconds range for some frameworks in some browsers) cannot be cached.

This cost might be less of a concern in single page apps, but not necessarily if the app is typically opened simultaneously in multiple tabs, or run on less powerful devices.

The performance tests in the homepage show execution times for parsing and evaluation of Mithril's code, compared to some popular frameworks. As you can see, it paints a much less flattering picture for some frameworks than when we look at gzipped size alone.

### Documentation

Another point of comparison is documentation. Most of the popular frameworks have at least a bare minimum amount of documentation nowadays, but many leave a bit to be desired: some lack usage examples, and some frameworks' communities need to rely heavily on third party sites for explanations of more advanced topics, and sometimes even for learning the basics.

This is a problem particularly for frameworks that had breaking changes in the past: It's common to find answers in StackOverflow that are out-of-date and no longer work with the latest version of said frameworks.

Mithril has more documentation in its Github repo than source code, and none of the documentation is auto-generated.

All API points are explained in prose, and have code examples. Because the entire documentation is hand-crafted, you get the benefit of actually having explanations for things that documentation-generator tools don't support well (for example, interfaces and callback parameter documentation).

In addition, this guide section covers topics related to how to fit all the pieces together.

From the get-go, Mithril's build system produces archived versions of the code and documentation so that you'll never be stuck without docs for out-of-date versions.

Given how young Mithril is, hopefully you can appreciate the level of commitment for providing good documentation.

### Architecture

In terms of architecture, one of Mithril's main differences is that it does not provide base classes to extend from.

It's often said that *frameworks*, in contrast to *libraries*, dictate how code should be written. In this sense, one could argue that Mithril isn't really a framework.

Instead of locking developers down to very specific implementations of design patterns, Mithril's approach is to provide an idiomatic pattern to follow, and tools to aid the developer when required. This approach means that developers can get discoverable codebases without necessarily getting locked into the framework.

One related difference is that other frameworks often have hard-coded base classes where every conceivable convenience method gets inherited by the developer's classes (remember, in Javascript, this can mean copying all of the utility methods over to the child class, regardless of whether they're going to be used or not).

Mithril's on-demand tooling approach means there are no hidden performance costs when implementing core MVC patterns, and there's also no extra learning curve for framework-specific syntax for those patterns.

### View Layer Paradigm

Some of the older frameworks among the popular ones (out-of-the-box jQuery and Backbone, specifically) take a more procedural paradigm when it comes to the view layer; this means every action requires the developer to write custom view-level code to handle it.

This can get noticeably bulky when you look at thing like collections: you often need to implement insertion code and deletion code, in addition to a "draw everything" routine for performance. And this is for every list that needs to be displayed in some way.

Mithril's view layer paradigm is designed be **declarative**, much like HTML, such that the same code implicitly does everything it needs to. As it turns out, this design decision is actually a compromise: it offers the benefit of decreased application code complexity at the cost of some performance loss. However, as the performance tests in the homepage show, this does not necessarily hurt Mithril in a meaningful way.

---

## Specific Framework Comparisons

Warning: this section is likely biased. Take it with a grain of salt.

### jQuery

jQuery is ubiquitous and has a large ecosystem, but it's not an MVC framework.

There's no idiomatic way to organize jQuery code in an MVC pattern and many frameworks were created specifically to overcome that shortcoming.

As summarized above, Mithril differs from jQuery by allowing DOM-related code to be written largely in a declarative style (thereby decreasing code complexity), in addition to providing an idiomatic way to structure applications.

One other difference that is extremely clear is the treatment of data. In jQuery it's common to use the DOM as a data storage mechanism, whereas Mithril encourages data to exist in an isolated model layer.

### Backbone

Backbone was originally designed as a way to structure jQuery-based applications. One of its selling points is that it allows developers to leverage their existing jQuery knowledge, while providing some "walls" to organize the code in a more structured manner.

As with jQuery, Mithril differs from Backbone by enforcing view code to be written in a declarative style.

Another marking difference is that Backbone is workflow agnostic, providing no idiomatic way to organize applications. This is good for framework adoption, but not necessarily ideal for team scalability and codebase discoverability.

In contrast, Mithril encourages you to develop applications using the patterns found throughout this guide, and discourages the use of "bastardized" MVC pattern variations.

One technical aspect that is also different is that Backbone is heavily event-oriented. Mithril, on the other hand, purposely avoids the observer pattern in an attempt to abolish "come-from hell", a class of debugging problems where you don't know what triggers some code because of a long chain of events triggering other events.

A particularly nasty instance of this problem that sometimes occurs in "real-time" applications is when event triggering chains become circular due to a conditional statement bug, causing infinite loops and browser crashes.

Another significant difference between Backbone and Mithril is in their approach to familiarity: Backbone appeals to people familiar w/ jQuery; Mithril is designed to be familiar to people with server-side MVC framework experience.

### Angular

Angular is an MVC framework maintained by Google, and it provides a declarative view layer and an emphasis on testability. It leverages developer experience with server-side MVC frameworks, and in many ways, is very similar in scope to Mithril.

The main difference between Angular templates and Mithril templates is that Angular templates follow the tradition of being defined in HTML. This has the benefit of cleaner syntax for writing static text, but it comes with the disadvantage of features getting awkwardly tied to HTML syntax, as well as providing poor debugging support.

One thing you may have noticed on the [Mithril homepage](http://lhorie.github.io/mithril/index.html#performance) is that, out of the box, Angular is not as performant as other frameworks. Steep performance degradation is a notoriously common issue in non-trivial Angular applications and there are several third party libraries which attempt to get around performance problems. Speaking from experience, it's generally difficult to reason about performance in Angular.

Mithril takes some learnings from that and implements a templating redrawing system that renders less aggressively, is less complex and is easier to profile.

A noteworthy difference between Angular and Mithril is in framework complexity: Angular implements several subsystems that would seem more logical in programming language implementations (e.g. a parser, a dynamic scoping mechanism, decorators, etc). Mithril, on the other hand, tries to provide only features that support a more classic MVC paradigm.

### Ember

Ember is a highly comprehensive MVC framework, providing a large API that covers not only traditional MVC patterns, but also a vast range of helper utilities as well.

The biggest difference between Ember and Mithril is summarized in the Architecture section above: Ember's comprehensiveness comes at the cost of a steep learning curve and a high degree of vendor lock-in.

Ember is also more opinionated in terms of how application architecture should look, and as a result, tends to be less transparent in terms of what is actually happening under the hood.

### React

React is a templating engine developed by Facebook. It's relevant for comparison because it uses the same architecture as Mithril's templating engine: i.e. it acknowledges that DOM operations are the bottleneck of templating systems, and implements a virtual DOM tree which keeps track of changes and only applies diffs to the real DOM where needed.

The most visible difference between React and Mithril is that React's *JSX* syntax does not run natively in the browser, whereas Mithril's uncompiled templates do. Both can be compiled, but React's compiled code still has function calls for each virtual DOM element; Mithril templates compile into static Javascript data structures.

Another difference is that Mithril, being an MVC framework, rather than a templating engine, provides an auto-redrawing system that is aware of network asynchrony and that can render views efficiently without cluttering application code with redraw calls, and without letting the developer unintentionally bleed out of the MVC pattern.

Note also that, despite having a bigger scope, Mithril has a smaller file size than React.

### Knockout

Knockout is a library focused on data binding. It is not an MVC framework in the traditional sense, but idiomatic Knockout code uses the similar concept of view models.

A Knockout view model is an amalgamation of model and controller layers in a single class. In contrast, Mithril separates the two layers more distinctly.

Generally speaking, Knockout applications tend to be more tightly coupled than Mithril since Knockout doesn't provide an equivalent to Mithril's modules and components.

As with Angular, Knockout templates are written in HTML, and therefore have the same pros and cons as Angular templates.

### Vue

Vue is a relatively new templating engine, but it boasts impressive results in its performance benchmark.

It is not a full MVC framework, but it is similar to Angular templates, and uses the same terminology for its features (e.g. directives and filters).

The most relevant difference is that Vue uses browser features that don't work (and cannot be made to work) in Internet Explorer 8. Mithril allows developers to support browsers all the way back to IE6 and Blackberry.

Vue's implementation cleverly hijacks array methods, but it should be noted that Javascript Arrays cannot be truly subclassed and as such, Vue suffers from abstraction leaks.

In contrast, Mithril avoids "magic" types.
