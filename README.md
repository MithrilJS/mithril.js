# Mithril.js - A framework for building brilliant applications

Note: This branch is a sneak peek for the upcoming version 1.0. It's a rewrite from the ground up and it's not backwards compatible with [Mithril 0.2.x](http://mithril.js.org)

This rewrite aims to fix longstanding API design issues, significantly improve performance, and clean up the codebase.

## Early Preview

You can install this via NPM using this command:

```
npm install lhorie/mithril.js#rewrite
```

Examples run out of the box. Just open the HTML files.

## Status

Code still is in flux. Most notably, there's no promise polyfill yet and there are several use cases that still need to be polished. DO NOT USE IN PRODUCTION YET!

Some examples of usage can be found in the [examples](examples) folder. [ThreadItJS](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/threaditjs/index.html) has the largest API surface coverage and comments indicating pending issues in framework usability. Note that the APIs those examples use may not become the final public API points in v1.0.

Partial documentation can be found in the `/docs` directory

## Performance

Mithril's virtual DOM engine is less than 500 lines of well organized code and it implements a modern search space reduction diff algorithm and a DOM recycling mechanism, which translate to top-of-class performance. See the [dbmon implementation (non-optimized)](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/mithril/index.html) (for comparison, here are optimized dbmon implementations for [React v15.0.2](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/react/index.html), [Angular v2.0.0-beta.17](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/angular/index.html) and [Mithril 0.2.x](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/mithril-0.2.x/index.html)).

## Lifecycle methods and Animation Support

Mithril's `config` method is now replaced by several lifecycle methods to improve separation of concerns and allow better control over animations.

- **`oninit(vnode)`** Runs once before vnode diff and creation
- **`oncreate(vnode)`** Runs once after the DOM element is created. It's guaranteed to run after all DOM changes in the render cycle
- **`onupdate(vnode)`** Runs after vnode is diffed by a re-render. It's guaranteed to run after all DOM changes in the render cycle
- **`onbeforeremove(vnode, done)`** Runs before DOM removal and waits for `done` to be called before actually removing the DOM element. Affects when `onremove` is called
- **`onremove(vnode)`** Runs after DOM removal.

## Robustness

There are over 2500 assertions in the test suite, and tests cover even difficult-to-test things like `location.href`, `element.innerHTML` and `XMLHttpRequest` usage.

## Modularity

Despite the huge performance improvements, the new codebase is smaller than v0.2.x, currently clocking at 6.5kb min+gzip

In addition, Mithril is now completely modular: you can import only the modules that you need and easily integrate 3rd party modules if you wish to use a different library for routing, ajax, and even rendering
