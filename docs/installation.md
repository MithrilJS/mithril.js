# Installation

- [CDN](#cdn)
- [NPM](#npm)

### CDN

If you're new to Javascript or just want a very simple setup to get your feet wet, you can get Mithril from a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network):

```markup
<script src="https://unpkg.com/mithril/mithril.js"></script>
```

---

### NPM

#### Quick start with Webpack

```bash
# 1) install
npm install mithril --save

npm install webpack --save

# 2) add this line into the scripts section in package.json
#	"scripts": {
#		"start": "webpack src/index.js bin/app.js --watch"
#	}

# 3) create an `src/index.js` file

# 4) create an `index.html` file containing `<script src="bin/app.js"></script>`

# 5) run bundler
npm start

# 6) open `index.html` in the (default) browser
open index.html
```

#### Step by step

For production-level projects, the recommended way of installing Mithril is to use NPM.

NPM (Node package manager) is the default package manager that is bundled w/ Node.js. It is widely used as the package manager for both client-side and server-side libraries in the Javascript ecosystem. Download and install [Node.js](https://nodejs.org); NPM will be automatically installed as well.

To use Mithril via NPM, go to your project folder, and run `npm init --yes` from the command line. This will create a file called `package.json`.

```bash
npm init --yes
# creates a file called package.json
```

Then, to install Mithril, run:

```bash
npm install mithril --save
```

This will create a folder called `node_modules`, and a `mithril` folder inside of it. It will also add an entry under `dependencies` in the `package.json` file

You are now ready to start using Mithril. The recommended way to structure code is to modularize it via CommonJS modules:

```javascript
// index.js
var m = require("mithril")

m.render(document.body, "hello world")
```

Modularization is the practice of separating the code into files. Doing so makes it easier to find code, understand what code relies on what code, and test.

CommonJS is a de-facto standard for modularizing Javascript code, and it's used by Node.js, as well as tools like [Browserify](http://browserify.org/) and [Webpack](https://webpack.js.org/). It's a robust, battle-tested precursor to ES6 modules. Although the syntax for ES6 modules is specified in Ecmascript 6, the actual module loading mechanism is not. If you wish to use ES6 modules despite the non-standardized status of module loading, you can use tools like [Rollup](http://rollupjs.org/), [Babel](https://babeljs.io/) or [Traceur](https://github.com/google/traceur-compiler).

Most browser today do not natively support modularization systems (CommonJS or ES6), so modularized code must be bundled into a single Javascript file before running in a client-side application.

A popular way for creating a bundle is to setup an NPM script for [Webpack](https://webpack.js.org/). To install Webpack, run this from the command line:

```bash
npm install webpack --save-dev
```

Open the `package.json` that you created earlier, and add an entry to the `scripts` section:

```
{
	"name": "my-project",
	"scripts": {
		"start": "webpack src/index.js bin/app.js -d --watch"
	}
}
```

Remember this is a JSON file, so object key names such as `"scripts"` and `"start"` must be inside of double quotes.

The `-d` flag tells webpack to use development mode, which produces source maps for a better debugging experience.

The `--watch` flag tells webpack to watch the file system and automatically recreate `app.js` if file changes are detected.

Now you can run the script via `npm start` in your command line window. This looks up the `webpack` command in the NPM path, reads `index.js` and creates a file called `app.js` which includes both Mithril and the `hello world` code above. If you want to run the `webpack` command directly from the command line, you need to either add `node_modules/.bin` to your PATH, or install webpack globally via `npm install webpack -g`. It's, however, recommended that you always install webpack locally and use npm scripts, to ensure builds are reproducible in different computers.

```
npm start
```

Now that you have created a bundle, you can then reference the `bin/app.js` file from an HTML file:

```markup
<html>
  <head>
    <title>Hello world</title>
  </head>
  <body>
    <script src="bin/app.js"></script>
  </body>
</html>
```

As you've seen above, importing a module in CommonJS is done via the `require` function. You can reference NPM modules by their library names (e.g. `require("mithril")` or `require("jquery")`), and you can reference your own modules via relative paths minus the file extension (e.g. if you have a file called `mycomponent.js` in the same folder as the file you're importing to, you can import it by calling `require("./mycomponent")`).

To export a module, assign what you want to export to the special `module.exports` object:

```javascript
// mycomponent.js
module.exports = {
	view: function() {return "hello from a module"}
}
```

In the `index.js`, you would then write this code to import that module:

```javascript
// index.js
var m = require("mithril")

var MyComponent = require("./mycomponent")

m.mount(document.body, MyComponent)
```

Note that in this example, we're using `m.mount`, which wires up the component to Mithril's autoredraw system. In most applications, you will want to use `m.mount` (or `m.route` if your application has multiple screens) instead of `m.render` to take advantage of the autoredraw system, rather than re-rendering manually every time a change occurs.

#### Production build

If you open bin/app.js, you'll notice that the Webpack bundle is not minified, so this file is not ideal for a live application. To generate a minified file, open `package.json` and add a new npm script:

```
{
	"name": "my-project",
	"scripts": {
		"start": "webpack src/index.js bin/app.js -d --watch",
		"build": "webpack src/index.js bin/app.js -p",
	}
}
```

You can use hooks in your production environment to run the production build script automatically. Here's an example for [Heroku](https://www.heroku.com/):

```
{
	"name": "my-project",
	"scripts": {
		"start": "webpack -d --watch",
		"build": "webpack -p",
		"heroku-postbuild": "webpack -p"
	}
}
```

---

### Alternate ways to use Mithril

#### Live reload development environment

Live reload is a feature where code changes automatically trigger the page to reload. [Budo](https://github.com/mattdesl/budo) is one tool that enables live reloading.

```bash
# 1) install
npm install mithril --save
npm install budo -g

# 2) add this line into the scripts section in package.json
#	"scripts": {
#		"start": "budo --live --open index.js"
#	}

# 3) create an `index.js` file

# 4) run budo
npm start
```

The source file `index.js` will be compiled (bundled) and a browser window opens showing the result. Any changes in the source files will instantly get recompiled and the browser will refresh reflecting the changes.

#### Mithril bundler

Mithril comes with a bundler tool of its own. It is sufficient for ES5-based projects that have no other dependencies other than Mithril, but it's currently considered experimental for projects that require other NPM dependencies. It produces smaller bundles than webpack, but you should not use it in production yet.

If you want to try it and give feedback, you can open `package.json` and change the npm script for webpack to this:

```
{
	"name": "my-project",
	"scripts": {
		"build": "bundle index.js --output app.js --watch"
	}
}
```

#### Vanilla

If you don't have the ability to run a bundler script due to company security policies, there's an options to not use a module system at all:

```markup
<html>
  <head>
    <title>Hello world</title>
  </head>
  <body>
    <script src="https://cdn.rawgit.com/lhorie/mithril.js/rewrite/mithril.js"></script>
    <script src="index.js"></script>
  </body>
</html>
```

```javascript
// index.js

// if a CommonJS environment is not detected, Mithril will be created in the global scope
m.render(document.body, "hello world")
```
