# Installation

### CDN

If you're new to Javascript or just want a very simple setup to get your feet wet, you can get Mithril from a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network):

```markup
<script src="http://cdn.rawgit.com/lhorie/mithril.js/rewrite/mithril.js"></script>
```

---

### NPM

#### Quick start

```bash
# 1) install
npm install mithril@rewrite --save
npm install webpack --save

# 2) add this line into the scripts section in package.json
#	"scripts": {
#		"build": "webpack index.js app.js --watch"
#	}

# 3) create an `index.js` file

# 4) run bundler
npm run build
```

#### Step by step

For production-level projects, the recommended way of installing Mithril is to use NPM.

NPM (Node package manager) is the default package manager that is bundled w/ Node.js. It is widely used as the package manager for both client-side and server-side libraries in the Javascript ecosystem. Download and install [Node.js](https://nodejs.org); NPM will be automatically installed as well.

To use Mithril via NPM, go to your project folder, and run `npm init --yes` from the command line. This will create a file called `package.json`.

```bash
npm init --yes
# creates a file called package.json
```

Then, run `npm install mithril@rewrite --save` to install Mithril. This will create a folder called `node_modules`, and a `mithril` folder inside of it. It will also add an entry under `dependencies` in the `package.json` file

```bash
npm install mithril@rewrite --save
```

You are now ready to start using Mithril. The recommended way to structure code is to modularize it via CommonJS modules:

```javascript
// index.js
var m = require("mithril")

m.render(document.body, "hello world")
```

Modularization is the practice of separating the code into files. Doing so makes it easier to find code, understand what code relies on what code, and test.

CommonJS is a de-facto standard for modularizing Javascript code, and it's used by Node.js, as well as tools like Browserify and Webpack. It's a robust, battle-tested precursor to ES6 modules. Although the syntax for ES6 modules is specified in Ecmascript 6, the actual module loading mechanism is not. If you wish to use ES6 modules despite the non-standardized status of module loading, you can use tools like [Rollup](http://rollupjs.org/), [Babel](https://babeljs.io/) or [Traceur](https://github.com/google/traceur-compiler).

Most browser today do not natively support modularization systems (CommonJS or ES6), so modularized code must be bundled into a single Javascript file before running in a client-side application.

The easiest way to create a bundle is to setup an NPM script for Webpack. To install webpack, run this from the command line:

```bash
npm install webpack
```

Open the `package.json` that you created earlier, and add an entry to the `scripts` section:

```
{
	"name": "my-project",
	"scripts": {
		"build": "webpack index.js app.js --watch"
	}
}
```

Remember this is a JSON file, so object key names such as `"scripts"` and `"build"` must be inside of double quotes.

Now you can run the script via `npm run build` in your command line window. This looks up the `bundle` command in the NPM path, reads `index.js` and creates a file called `app.js` which includes both Mithril and the `hello world` code above.

```
npm run build
```

The `--watch` flag tells the `bundle` command to watch the file system and automatically recreate `app.js` if file changes are detected.

Now that you have created a bundle, you can then reference the `app.js` file from an HTML file:

```markup
<html>
  <head>
    <title>Hello world</title>
  </head>
  <body>
    <script src="app.js"></script>
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

#### Alternate ways to use Mithril

##### Mithril bundler

Mithril comes with a bundler tool of its own. It is sufficient for projects that have no other dependencies other than Mithril, but it's currently considered experimental for projects that require other NPM dependencies. It produces smaller bundles than webpack, but you should not use it in production yet.

If you want to try it and give feedback, you can open `package.json` and change the npm script for webpack to this:

```
{
	"name": "my-project",
	"scripts": {
		"build": "bundle index.js --output app.js --watch"
	}
}
```

##### Vanilla

If you don't have the ability to run a bundler script due to company security policies, there's an options to not use a module system at all:

```markup
<html>
  <head>
    <title>Hello world</title>
  </head>
  <body>
    <script src="node_modules/mithril/mithril.js"></script>
    <script src="index.js"></script>
  </body>
</html>
```

```javascript
// index.js

// if a CommonJS environment is not detected, Mithril will be created in the global scope
m.render(document.body, "hello world")
```
