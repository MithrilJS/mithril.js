# Bug reports

Use the [issue tracker](https://github.com/lhorie/mithril.js/issues). Do check to make sure your bug hasn't already been filed. Please give the following information, where possible:

1. The version of Mithril you're using, whether it's the dev version or [the version on npm](http://npm.im/mithril.js). The version on npm may not have all the latest bug fixes, so your bug might very well be fixed in the dev version.
2. The name and version of the browser(s) affected.
3. A detailed explanation of the bug.
4. A test case. The simpler, the better.

# Feature requests

Use the [issue tracker](https://github.com/lhorie/mithril.js/issues). Please do the following, where possible:

1. Check to make sure your suggestion hasn't already been filed. There's a nice collection of some of these feature requests [here](https://github.com/lhorie/mithril.js/issues/802).
2. Clearly denote your issue as a feature request. It helps make the intent clearer. Even better is to denote it in the title.
3. Describe your idea. This is the most important part.
4. Submit, and wait for feedback. Don't forget to drop by the [Gitter room](https://gitter.im/lhorie/mithril.js) to get some publicity. It gets traffic daily. :smile:

# Contributing

We welcome any and all contributions. This is a community-driven project. Although we don't have a lot, we do have a few guidelines for contributions.

1. Please try to adhere to the style guide. Most of it is checked by ESLint. ESLint is also set up to check for other common errors, such as undeclared variables and invalid `typeof` values.
2. Please make sure there are no regressions with your patch. Please don't disable existing tests, and please don't send a PR with new, disabled tests.
3. For any new features introduced, be sure to write new unit tests for it. Maximum coverage is what we want.
4. Try to not leave any extra `TODO`s, `FIXME`s, etc. in your code. ESLint will nag at you until you fix whatever problem it is.
	- Note that it's only a warning, not an error. It won't fail the CI tests, and there's a few outstanding ones inside Mithril right now.
	- If you must, use a `TODO(<your_username>): whatever` (or the equivalent `FIXME`, etc.) if it's something you are actively working on, or if it's something more general, file an issue titled "TODO: <short_description>" and reference the `TODO` comment itself.

It is assumed that for all contributions you make, you have the appropriate rights to and it may be made available under the MIT License, the license used for this project.

# Style Guide

The style is checked with ESLint. This style guide is here for one reason only: consistency. This should work for most code here, but it shouldn't be considered absolute &endash; consistency with the surrounding code is higher priority than following this guide. Also, if you need some sort of hack that doesn't follow this style guide like [Bluebird's `toFastProperties` hack](https://stackoverflow.com/q/24987896), make sure the code is consistent with what's around it, and disable whatever ESLint warnings you need to. (In that case, you would use `no-eval` and `no-unused-expressions`).

### EditorConfig

This project has its own [EditorConfig](http://editorconfig.org/). Most common editors either support it natively or have a plugin to support it. Here's links for several editors:

- [Atom](https://atom.io/packages/editorconfig)
- [Nodepad++](https://github.com/editorconfig/editorconfig-notepad-plus-plus#readme)
- [Sublime Text](https://packagecontrol.io/packages/EditorConfig)
- [Vim](http://www.vim.org/scripts/script.php?script_id=3934)
- [Emacs](https://marmalade-repo.org/packages/editorconfig)
- IntelliJ, WebStorm: You're already set, since it supports EditorConfig natively.
- [Eclipse](https://marketplace.eclipse.org/content/editorconfig-eclipse)
- [Visual Studio](https://visualstudiogallery.msdn.microsoft.com/c8bccfe2-650c-4b42-bc5c-845e21f96328)
- [Xcode](https://github.com/MarcoSero/EditorConfig-Xcode)
- [Komodo](http://komodoide.com/packages/addons/editorconfig/)

EditorConfig also has [their own curated list](http://editorconfig.org/#download) of plugins. Do note that Text Mate's plugin doesn't support multiple properties used in this repo's `.editorconfig`.

### Line length

Please keep line length down to a maximum of 80 characters.

The only exception to this rule is with long regexes and test names. You can use `// eslint-disable-line max-len` to suppress this.

### Function length

Please keep function length to no more than 20 statements, including those in nested blocks.

The only exceptions are for revealing module wrappers and Mocha `describe` and `context` blocks. If you need to suppress this, you can use `// eslint-disable-line max-statements` at the beginning of the function.

This isn't checked for the tests, but still, please keep it reasonable.

### Line endings

Use Windows-style line endings (i.e. CRLF).

### Semicolons

Avoid semicolons. A few resources to help you understand this: [*](http://blog.izs.me/post/2353458699/an-open-letter-to-javascript-leaders-regarding) [*](http://inimino.org/~inimino/blog/javascript_semicolons) [*](http://jamesallardice.com/understanding-automatic-semi-colon-insertion-in-javascript/)

### Redundant expressions

Don't use redundant parentheses, curly braces, `undefined`s, ternaries, etc.

- `var foo = value === 1 ? true : false` is better written as `var foo = value === 1`.
- `var foo = undefined` is better written as `var foo`.
- `return undefined` is better written as `return`.
- `delete(obj.foo)` is better written as `delete obj.foo`.
- As an exception, use an extra set of parentheses when assigning in conditions.

### Equality testing

Prefer strict equality (`===`/`!==`) to loose equality (`==`/`!=`), unless you're comparing against `null` or `undefined`, where loose equality (`== null`/`!= null`) is preferred. It's more type-safe with primitives.

### `eval` and friends

Never use `eval`, the `Function` constructor, and friends. Those will fail when running under CSP restrictions, and this library should work in those environments.

### Quotes

Prefer double quotes to single quotes, but using single quotes to avoid escaping is okay.

### Strict mode

Any code not in the global scope should be in strict mode unless there's a good reason it shouldn't be. Browsers run it faster, and there's certain things where it's safer.

## Comments

Comments are helpful. Use descriptive comments where needed, so others can read it and understand it. If a non-obvious hack is used, explain it with a comment. But don't repeat yourself with a redundant comment when the code adequately describes itself.

```js
// Good
var CARD_DECK_SIZE = 52

// Shuffle the deck of cards.
for (var i = 0; i < CARD_DECK_SIZE; i++) {
	var j = i + (Math.random() * CARD_DECK_SIZE - i)|0

	var tmp = deck[i]
	deck[i] = deck[j]
	deck[j] = tmp
}

// Also good
function toFastProperties(obj) {
	// Bluebird's toFastProperties hack. Forces V8 to optimize object as prototype,
	// significantly speeding up property access.

	/* eslint-disable no-eval */
	function C() {}
	C.prototype = obj
	new C()
	return
	eval(obj)
	/* eslint-enable no-eval */
}

// Bad
var CARD_DECK_SIZE = 52

// Shuffle the deck of cards.
function shuffle(deck) {
	for (var i = 0; i < CARD_DECK_SIZE; i++) {
		// Generate a random card index to swap at.
		var j = i + (Math.random() * CARD_DECK_SIZE - i)|0

		// Swap the cards at each index.
		var tmp = deck[i]
		deck[i] = deck[j]
		deck[j] = tmp
	}
}

// Also bad
// This function loops through each item in a list, calling `f` with each item
// and their respective index. If the function `f` returns explicitly with
// `false`, iteration stops. This function returns the original list for
// convenience.
function forEach(list, f) {
	// Loop through each entry in the list with the loop index `i`
	for (var i = 0; i < list.length; i++) {
		// Call the function with the current item and index
		if (f(list[i], i) === false) {
			// If the function explicitly returns `false`, immediately stop
			// iteration.
			break
		}
	}
	// Return the list, for convenience.
	return list
}
```

### Magic values

Prefer constant variables to magic values where it helps with code readability. Also, don't use comments in place of a constant.

```js
// Good
var CARD_DECK_SIZE = 52
for (var i = 0; i < CARD_DECK_SIZE; i++) {
	var j = i + (Math.random() * CARD_DECK_SIZE - i)|0
	var tmp = a[i]
	a[i] = a[j]
	a[j] = tmp
}

// Bad
for (var i = 0; i < 52; i++) {
	var j = i + (Math.random() * 52 - i)|0
	var tmp = a[i]
	a[i] = a[j]
	a[j] = tmp
}

// Also bad
// Note: 52 cards in a deck
for (var i = 0; i < 52; i++) {
	var j = i + (Math.random() * 52 - i)|0
	var tmp = a[i]
	a[i] = a[j]
	a[j] = tmp
}
```

### Initial whitespace

Start your comments with a space. It's more readable.

```js
// Good
// This is a comment.

// Bad
//This is a comment.
```

### Grammar and spelling

Please try to use proper grammar and spelling. Not all of us are perfect English speakers (even us native ones struggle at times), but it's easier to understand down the road when reading the code.

## Whitespace

Use vertical whitespace and indentation to your advantage. It helps with readability, and minifiers are astonishingly great at removing this. :stuck_out_tongue_winking_eye:

```js
// Good
function iterate() {
	var index = 0
	var list = []
	while (hasNext()) {
		list.push(next(index))
		index++
	}

	for (var i = 0; i < list.length; i++) {
		read(list[i])
	}
}

// Bad
function iterate() {
	var index = 0
	var list = []
	while (hasNext()) list.push(next(index++))
	for (var i = 0; i < list.length; i++) read(list[i])
}

// Also bad
function iterate() {
	var list = []
	for (var index = 0; hasNext(); list.push(next(index++))) {}
	for (var i = 0; i < list.length; i++) read(list[i])
}
```

### Trailing whitespace

Please don't leave trailing spaces, even in blank likes. It makes diffs harder to read. If your [editor supports EditorConfig, or you've downloaded a plugin for it](http://editorconfig.org/#download), you're already set. Otherwise, searching "<editor> strip trailing whitespace blank lines" should help you.

### Indentation and vertical whitespace

Indent with hard tabs. Each one counts for 4 spaces.

Never mix tabs and spaces. Don't use smart tabs.

### Excessive whitespace

Keep whitespace within reason. Limit vertical whitespace to no more than 1 consecutive blank line, and don't start or end blocks with plain whitespace. Don't use more than one character of horizontal whitespace beyond indentation.

```js
// Bad
function iterate() {
	var index = 0
	var list = []

	while (hasNext()) {
		list.push(next(index))
		index++
	}



	for (var i = 0; i < list.length; i++) {
		read(list[i])
	}
}

// Also bad
var a  =  2
//   ^^ ^^
```

If you're find yourself resorting to multiple consecutive blank lines to separate logic, consider refactoring the code into smaller functions if possible.

### Control keywords

Always surround control keywords (e.g. `if`, `else`, `for`) with whitespace.

## Operators

### Binary operators

Always surround binary keyword operators (e.g. `in`, `instanceof`) with whitespace.

Always surround any other binary operator with whitespace, including assignment operators. Add line breaks after the operator, not before.

```js
// Good
var a = 1 + 2
a = 3

var a = 1 + 2 + 3 + 4 + 5 +
	6 + 7 + 8 + 9 + 10

// Bad
var a = 1+2
var a=1+2
a=3

var a = 1 + 2 + 3 + 4 + 5
	+ 6 + 7 + 8 + 9 + 10
```

In the event you're casting to a 32-bit integer (i.e. `x|0`), it's okay to omit the whitespace. Mithril doesn't currently have any instances of this, but it may in the future.

```js
// This is okay
var casted = value|0
```

### Unary operators

Always use whitespace between an unary keyword operator (e.g. `delete`, `new`) with whitespace.

Do not use spaces between any other unary operator and the value they apply to.

```js
// Good
!a
-1
~1

// Bad
! a
- 1
~ 1
```

## Objects

### Exterior whitespace

Do not include space between the opening curly brace and the first object key in single line objects. For multi-line objects, don't include any extra preceding whitespace at the beginning or end.

```js
// Good
var object = {foo: 1}

var object = {
	foo: 1,
	bar: 2,
	baz: 3,
	quux: "string"
}

// Bad
var object = { foo: 1 }

var object = {

	foo: 1,
	bar: 2,
	baz: 3,
	quux: "string"

}
```

### Interior whitespace

Use no space before an object key and the colon, but use a single space between the colon and value.

```js
// Good
var object = {foo: 1}

// Bad
var object = {foo:1}
var object = {foo : 1}
var object = {foo :1}
```

### Larger objects

Non-trivial objects should occupy multiple lines.

```js
// Good
var object = {
	foo: 1,
	bar: 2,
	baz: 3,
	quux: "string"
}

// Bad
var object = {foo: 1, bar: 2, baz: 3, quux: "string"}
```

Prefer plain objects over `new function () {}`, but if you feel the latter is better, use `// eslint-disable-line no-new-func` on the first line.

### Comma placement

Commas come last. Also, don't use trailing commas.

```js
// Good
var object = {
	foo: 1,
	bar: 2
}

// Bad
var object = {
	foo: 1,
	bar: 2, // Trailing comma
}

var object = {
	foo: 1
,	bar: 2 // Comma first
}

// Also bad
var object = {foo: 1,}
```

### Member access

When chaining methods and/or properties across multiple lines, dots come first.

```js
// Good
object
	.foo()
	.bar()

// Bad
object.
	foo().
	bar()
```

### Property quoting

Quote properties when needed. Never quote valid identifiers. This may lead to some inconsistency in whether properties are quoted or not in the object, but that inconsistency is okay.

```js
// Good
var object = {
	foo: 1,
	bar: 2
}

var object = {
	foo: 1,
	"non-identifier": 2
}

// Bad
var object = {
	"foo": 1,
	"bar": 2
}

var object = {
	"foo": 1,
	"non-identifier": 2
}
```

### Iteration

When iterating objects with `for-in`, filter it with `Object.prototype.hasOwnProperty` first. This may be on the same line if that's the only condition. If this is used more than once, make a local `hasOwn` alias to use like `hasOwn.call(object, prop)`.

## Variables and declarations

Use camel case (e.g. `loopIndex`) for variables, pascal case (e.g. `MyClass`) for classes, and upper case with underscores (e.g. `MAX_VALUE`) for constants.

Use `self` to capture `this` where needed. (i.e. `var self = this`)

Prefer short but clear, descriptive, and self-documenting variable names.

Single letter names are generally okay in these contexts:

- Loop variables: `i`, `j`, etc.
- Function arguments in small, trivial functional utilities: `f`, `g`, etc.
- Standard mathematical algorithms: `x`, `y`, `a`, `b`, etc.

```js
// Good
function forEach(list, f) {
	for (var i = 0; i < list.length; i++) {
		f(list[i], i)
	}
	return list
}

// Also good
function forEach(list, func) {
	for (var index = 0; index < list.length; index++) {
		func(list[index], index)
	}
	return list
}

// Bad
function iterateArray(listOfEntries, callback) {
	for (var index = 0; index < listOfEntries.length; index++) {
		callback(listOfEntries[index], index)
	}
	return listOfEntries
}

// Also bad
function e(l, c) {
	for (var x = 0; x < l.length; x++) {
		c(l[x], x)
	}
	return l
}
```

### Multiple variable declarations

If a variable is assigned a value when it's declared, it gets its own line.

If a variable is not immediately assigned a value, it may be grouped with others that aren't first assigned values.

Do group related variables.

Variable declarations in the init block of a for loop are excluded from this rule, but the number of declarations should still be minimized.

```js
// Good
var a = 1
var b = 2
var c, d

// Also good
var foo, bar, baz, quux
var spam, eggs, ham
var shouldUpdate, initialize

// Okay, since it's within a for loop
for (var i = 0, test; (test = foo === 1); i++) {
	doSomething(i)
}

// Bad
var a = 1, b = 2, c, d

// Also bad
var foo, bar, baz, quux, spam, eggs, ham, shouldUpdate, initialize
```

## Assignment

### Native functions

Don't assign to native functions or prototypes beyond polyfills. Ever.

### Function declarations

Don't assign to a function declaration. Declarations look like static values, so they should be treated that way. There is no difference in size, either.

```js
// Bad
function foo() { return 1 }
foo = function () { return 2 }

// Also bad
function foo() { return 1 }
foo = 2
```

### Conditions

Avoid assigning directly in conditions. If you need to assign in a condition, wrap them in a new set of parentheses.

```js
// Good
var test = foo === 1
if (test) {
	doSomething()
}

var test = foo === 1
for (var i = 0; test; i++) {
	doSomething(i)
	test = foo === 1
}

if ((test = foo === 1)) {
	doSomething()
}

for (var i = 0, test; (test = foo === 1); i++) {
	doSomething(i)
}

// Bad
if (test = foo === 1) {
	doSomething()
}

for (var i = 0, test; test = foo === 1; i++) {
	doSomething(i)
}
```

## Functions

Prefer anonymous functions to named functions in expressions where possible

Prefer named function declarations to assigning a function to a declared variable where possible.

```js
// Good
setTimeout(function () { doSomething() }, 0)

function foo() {
	return 1
}

// Good, uses recursion
setTimeout(function f() {
	doSomething()
	if (shouldRepeat()) setTimeout(f, 0)
}, 0)

// Bad
requestAnimationFrame(function foo() { runNext() })

var foo = function () {
	return 1
}
```

### Anonymous functions

Anonymous functions must have a single space between `function` and the arguments and between the arguments and the opening brace.

### Named functions, function declarations

Named functions and function declarations must have no space between the function name and the arguments and a single space between the arguments and the opening brace.

## Blocks and conditionals

### Curly braces

Curly braces are required for blocks if the body takes up more than one line. This goes for functions as well. They are optional if it fits within one line, but don't be afraid to use them where you see fit.

Do put an extra space after the first brace and before the final brace in single-line functions.

```js
// Good
if (condition) doSomething()

if (condition) {
	doSomething()
}

if (condition) {
	doSomething()
} else {
	doSomethingElse()
}

if (condition) {
	doSomething()
	doSomethingElse()
}

setTimeout(function () { doSomething() }, 0)

setTimeout(function () {
	doSomething()
}, 0)

// Bad
if (condition) { doSomething(); doSomethingElse() }

if (condition)
	doSomething()

setTimeout(function () { doSomething(); doSomethingElse() }, 0)

setTimeout(function () {doSomething()}, 0)
```

### Function declarations

Function declarations should always take more than one line.

```js
// Good
function foo() {
	return bar
}

// Bad
function foo() { return bar }
```

### `if`-`else`

Be consistent with braces in `if`-`else` statements.

```js
// Good
if (condition) doSomething()
else doSomethingElse()

if (condition) {
	doSomething()
} else {
	doSomethingElse()
}

if (condition) {
	doSomething()
} else if (anotherCondition) {
	doSomethingElse()
} else {
	doAnotherThing()
}

// Okay
if (condition) doSomething()
else if (anotherCondition) doSomethingElse()
else doAnotherThing()

// Bad
if (condition) doSomething()
else {
	doSomethingElse()
}

if (condition) doSomething()
else if (anotherCondition) {
	doSomethingElse()
} else doAnotherThing()


if (condition) {
	doSomething()
} else doSomethingElse()
```

## `do`-`while` loops

Always use braces.

```js
// Good
do {
    doSomething()
} while (condition)

// Bad
do doSomething()
while (condition)
```

### Empty blocks

Mark empty blocks as intentionally empty via a comment or similar. Don't just leave an empty block and/or semicolon.

```js
// Good
for (var i = 0; i < list.length && cond(list[i]); i++) {
	// do nothing
}

// Even better
for (var i = 0; i < list.length; i++) {
	if (!cond(list[i])) break
}

// Bad
for (var i = 0; i < list.length && cond(list[i]); i++) {}

// Also bad
for (var i = 0; i < list.length && cond(list[i]); i++) {
	;
}

// Even worse
for (var i = 0; i < list.length && cond(list[i]); i++);
```

### Nesting

Don't nest `if` statements in `else` blocks if you don't need to.

```js
// Good
if (test) {
	doSomething()
} else if (otherTest) {
	doSomethingElse()
}

if (test) {
	doSomething()
} else {
	if (otherTest) {
		doSomethingElse()
	}

	doThisOtherThing()
}

// Bad
if (test) {
	doSomething()
} else {
	if (otherTest) {
		doSomethingElse()
	}
}
```

Don't nest curly braces beyond 4 levels deep. This includes blocks, loops, and functions, as well as IIFE wrappers. This also includes the tests. There's rarely a reason to go farther, as most of the time, it's a signal to refactor and/or re-organize your code.

### Brace style

Put the `else`, `catch`, and `finally` on the same line as its closing brace.
