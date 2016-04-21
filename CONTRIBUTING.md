# FAQ

## How do I go about contributing ideas or new features?

Create an issue to suggest it and discuss first. Avoid submitting large changes.



## How should I report bugs?

Ideally, provide code to reproduce the issue (via jsfiddle, a gist, etc). Even better, submit a pull request with a fix and tests. If you don't know how to test your fix, or lint or whatever, submit anyways, and we can help you.



## How do I run tests?

Assuming you have forked this repo, you can open the `index.html` file in a module's `tests` folder and look at console output to see only tests for that module, or you can run `ospec/bin/ospec` from the command line to run all tests under a Node.js environment. Additionally, you can modify a test to use `o.only(description, test)` instead of `o(description, test)` if you wish to run only a specific test.



## How do I build Mithril?

Run `node bundler/bundler.js` from the command line to generate the bundled file.



## Why do tests mock the browser APIs?

Most notoriously, because it's impossible to test the router and some side effects properly otherwise. Also, mocks allow the tests to run under Node.js without requiring heavy dependencies like PhantomJS/ChromeDriver/JSDOM.

Another important reason is that it allows us to document browser API quirks via code, through the tests for the mocks.



## Why does Mithril use its own testing framework and not Mocha/Jasmine/Tape?

Mainly to avoid requiring dependencies. ospec is customized to provide only essential information for common testing workflows (namely, no spamming ok's on pass, and accurate noiseless errors on failure)



## Why do tests and examples use `module/module.js`? Why not use Browserify, Webpack or Rollup?

Again, to avoid requiring dependencies. The Mithril codebase is written using a statically analyzable subset of CommonJS module definitions (as opposed to ES6 modules) because its syntax is backwards compatible with ES5, therefore making it possible to run source code unmodified in browsers without the need for a build tool or a file watcher.

This simplifies the workflow for bug fixes, which means they can be fixed faster.



## Why doesn't the Mithril codebase use ES6 via Babel? Would a PR to upgrade be welcome?

Being able to run Mithril raw source code in IE is a requirement for all browser-related modules in this repo.

In addition, ES6 features are usually less performant than equivalent ES5 code, and transpiled code is bulkier.



## Why doesn't the Mithril codebase use trailing semi-colons? Would a PR to add them be welcome?

I don't use them. Adding them means the semi-colon usage in the codebase will eventually become inconsistent. If you're not comfortable with ASI rules, bear in mind that this codebase is heavily optimized and large modifications will require an advanced level of javascript mastery.



## Why does the Mithril codebase use a mix of `instanceof` and `typeof` checks instead of `Object.prototype.toString.call`, `Array.isArray`, etc? Would a PR to refactor those checks be welcome?

Mithril avoids peeking at objects' [[class]] string for performance considerations. Many type checks are seemingly inconsistent, weird or convoluted because those specific constructs demonstrated the best performance profile in benchmarks compared to alternatives.

Type checks are generally already irreducible expressions and having micro-modules for type checking subroutines would add maintenance overhead.



## What should I know in advance when attempting a performance related contribution?

You should be trying to reduce the number of DOM operations or reduce algorithmic complexity in a hot spot. Anything else is likely a waste of time. Specifically, micro-optimizations like caching array lengths, caching object property values and inlining functions won't have any positive impact in modern javascript engines.

Keep object properties consistent (i.e. ensure the data objects always have the same properties and that properties are always in the same order) to allow the engine to keep using JIT'ed structs instead of hashmaps. Always place null checks first in compound type checking expressions to allow the Javascript engine to optimize to type-specific code paths. Prefer for loops over Array methods and try to pull conditionals out of loops if possible.



