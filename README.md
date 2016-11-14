# Mithril.js - A framework for building brilliant applications

[Installation](docs/installation.md) | [API](docs/api.md) | [Examples](docs/examples.md) | [Migration Guide](docs/v1.x-migration.md)

Note: This branch is the upcoming version 1.0. It's a rewrite from the ground up and it's not backwards compatible with [Mithril 0.2.x](http://mithril.js.org). You can find preliminary [documentation here](docs) and [migration guide here](docs/v1.x-migration.md)

This rewrite aims to fix longstanding API design issues, significantly improve performance, and clean up the codebase.

## Early Preview

You can install this via NPM using this command:

```
npm install mithril@rewrite
```

Examples run out of the box. Just open the HTML files.

## Status

The code is fairly stable and I'm using it in production, but there may be bugs still lurking.

Some examples of usage can be found in the [examples](examples) folder. [ThreadItJS](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/threaditjs/index.html) has the largest API surface coverage.

Partial documentation can be found in the [`/docs`](docs) directory

## Performance

Mithril's virtual DOM engine is around 500 lines of well organized code and it implements a modern search space reduction diff algorithm and a DOM recycling mechanism, which translate to top-of-class performance. See the [dbmon implementation](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/mithril/index.html) (for comparison, here are dbmon implementations for [React v15.3.2](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/react/index.html), [Angular v2.0.0-beta.17](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/angular/index.html) and [Vue 2](http://cdn.rawgit.com/lhorie/mithril.js/rewrite/examples/dbmonster/vue/index.html). All implementations are naive (i.e. apples-to-apples, no optimizations)

## Robustness

There are over 4000 assertions in the test suite, and tests cover even difficult-to-test things like `location.href`, `element.innerHTML` and `XMLHttpRequest` usage.

## Modularity

Despite the huge improvements in performance and modularity, the new codebase is smaller than v0.2.x, currently clocking at 7.5kb min+gzip

In addition, Mithril is now completely modular: you can import only the modules that you need and easily integrate 3rd party modules if you wish to use a different library for routing, ajax, and even rendering
