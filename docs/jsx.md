# JSX

- [Description](#description)
- [Setup](#setup)
- [Using Babel with Webpack](#using-babel-with-webpack)
- [JSX vs hyperscript](#jsx-vs-hyperscript)
- [Converting HTML](#converting-html)

---

### Description

JSX is a syntax extension that enables you to write HTML tags interspersed with Javascript. It's not part of any Javascript standards and it's not required for building applications, but it may be more pleasing to use depending on your team's preferences.

```jsx
var MyComponent = {
  view: function() {
    return m("main", [
      m("h1", "Hello world"),
    ])
  }
}

// can be written as:
var MyComponent = {
  view: function() {
    return (
      <main>
        <h1>Hello world</h1>
      </main>
    )
  }
}
```

When using JSX, it's possible to interpolate Javascript expressions within JSX tags by using curly braces:

```jsx
var greeting = "Hello"
var url = "http://google.com"
var link = <a href={url}>{greeting + "!"}</a>
// yields <a href="http://google.com">Hello</a>
```

Components can be used by using a convention of uppercasing the first letter of the component name:

```jsx
m.render(document.body, <MyComponent />)
// equivalent to m.render(document.body, m(MyComponent))
```

---

### Setup

The simplest way to use JSX is via a [Babel](https://babeljs.io/) plugin.

Babel requires NPM, which is automatically installed when you install [Node.js](https://nodejs.org/en/). Once NPM is installed, create a project folder and run this command:

```bash
npm init -y
```

If you want to use Webpack and Babel together, [skip to the section below](#using-babel-with-webpack).

To install Babel as a standalone tool, use this command:

```bash
npm install babel-cli babel-preset-es2015 babel-plugin-transform-react-jsx --save-dev
```

Create a `.babelrc` file:

```
{
	"presets": ["es2015"],
	"plugins": [
		["transform-react-jsx", {
			"pragma": "m"
		}]
	]
}
```

To run Babel as a standalone tool, run this from the command line:

```bash
babel src --out-dir bin --source-maps
```

#### Using Babel with Webpack

If you're already using Webpack as a bundler, you can integrate Babel to Webpack by following these steps.

```bash
npm install babel-core babel-loader babel-preset-es2015 babel-plugin-transform-react-jsx --save-dev
```

Create a `.babelrc` file:

```
{
	"presets": ["es2015"],
	"plugins": [
		["transform-react-jsx", {
			"pragma": "m"
		}]
	]
}
```

Next, create a file called `webpack.config.js`

```javascript
module.exports = {
	entry: './src/index.js',
	output: {
		path: './bin',
		filename: 'app.js',
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /node_modules/,
			loader: 'babel-loader'
		}]
	}
}
```

This configuration assumes the source code file for the application entry point is in `src/index.js`, and this will output the bundle to `bin/app.js`.

To run the bundler, setup an npm script. Open `package.json` and add this entry under `"scripts"`:

```
{
	"name": "my-project",
	"scripts": {
		"start": "webpack -d --watch"
	}
}
```

You can now then run the bundler by running this from the command line:

```bash
npm start
```

#### Production build

To generate a minified file, open `package.json` and add a new npm script called `build`:

```
{
	"name": "my-project",
	"scripts": {
		"start": "webpack -d --watch",
		"build": "webpack -p",
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

### JSX vs hyperscript

JSX is essentially a trade-off: it introduces a non-standard syntax that cannot be run without appropriate tooling, in order to allow a developer to write HTML code using curly braces. The main benefit of using JSX instead of regular HTML is that the JSX specification is much stricter and yields syntax errors when appropriate, whereas HTML is far too forgiving and can make syntax issues difficult to spot.

Unlike HTML, JSX is case-sensitive. This means `<div className="test"></div>` is different from `<div classname="test"></div>` (all lower case). The former compiles to `m("div", {className: "test"})` and the latter compiles to `m("div", {classname: "test"})`, which is not a valid way of creating a class attribute. Fortunately, Mithril supports standard HTML attribute names, and thus, this example can be written like regular HTML: `<div class="test"></div>`.

JSX is useful for teams where HTML is primarily written by someone without Javascript experience, but it requires a significant amount of tooling to maintain (whereas plain HTML can, for the most part, simply be opened in a browser)

Hyperscript is the compiled representation of JSX. It's designed to be readable and can also be used as-is, instead of JSX (as is done in most of the documentation). Hyperscript tends to be terser than JSX for a couple of reasons:

- it does not require repeating the tag name in closing tags (e.g. `m("div")` vs `<div></div>`)
- static attributes can be written using CSS selector syntax (i.e. `m("a.button")` vs `<div class="button"></div>`

In addition, since hyperscript is plain Javascript, it's often more natural to indent than JSX:

```jsx
//JSX
var BigComponent = {
  activate: function() {/*...*/},
  deactivate: function() {/*...*/},
  update: function() {/*...*/},
  view: function(vnode) {
    return [
      {vnode.attrs.items.map(function(item) {
        return <div>{item.name}</div>
      })}
      <div
        ondragover={this.activate}
        ondragleave={this.deactivate}
        ondragend={this.deactivate}
        ondrop={this.update}
        onblur={this.deactivate}
      ></div>
    ]
  }
}

// hyperscript
var BigComponent = {
  activate: function() {/*...*/},
  deactivate: function() {/*...*/},
  update: function() {/*...*/},
  view: function(vnode) {
    return [
      vnode.attrs.items.map(function(item) {
        return m("div", item.name)
      }),
      m("div", {
        ondragover: this.activate,
        ondragleave: this.deactivate,
        ondragend: this.deactivate,
        ondrop: this.update,
        onblur: this.deactivate,
      })
    ]
  }
}
```

In non-trivial applications, it's possible for components to have more control flow and component configuration code than markup, making a Javascript-first approach more readable than an HTML-first approach.

Needless to say, since hyperscript is pure Javascript, there's no need to run a compilation step to produce runnable code.

---

### Converting HTML

In Mithril, well-formed HTML is valid JSX. Little effort other than copy-pasting is required to integrate an independently produced HTML file into a project using JSX.

When using hyperscript, it's necessary to convert HTML to hyperscript syntax before the code can be run. To facilitate this, you can [use the HTML-to-Mithril-template converter](http://arthurclemens.github.io/mithril-template-converter/index.html).
