# JSX

- [Description](#description)
- [Setup](#setup)
- [JSX vs hyperscript](#jsx-vs-hyperscript)
- [Converting HTML](#converting-html)

---

### Description

JSX is a syntax extension that enables you to write HTML tags interspersed with Javascript.

```
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

```
var greeting = "Hello"
var url = "http://google.com"
var div = <a href={url}>{greeting + "!"}</a>
```

Components can be used by using a convention of uppercasing the first letter of the component name:

```javascript
m.mount(document.body, <MyComponent />)
// equivalent to m.mount(document.body, m(MyComponent))
```

---

### Setup

The simplest way to use JSX is via a [Babel](https://babeljs.io/) plugin. To install, use this command:

```bash
npm install babel-cli babel-preset-es2015 transform-react-jsx --save-dev
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
babel src --out-dir lib --source-maps
```

#### Using Babel with Webpack

If you're using Webpack as a bundler, you can integrate Babel to Webpack, however this requires some additional dependencies, in addition to the steps above.

```bash
npm install babel-core babel-loader --save-dev
```

Create a file called `.webpack.config`

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

---

### JSX vs hyperscript

JSX is essentially a trade-off: it introduces a non-standard syntax that cannot be run without appropriate tooling, in order to allow a developer to write HTML code using curly braces. The main benefit of using JSX instead of regular HTML is that the JSX specification is much stricter and yields syntax errors when appropriate, whereas HTML is far too forgiving and makes syntax issues difficult to spot.

Unlike HTML, JSX is case-sensitive. This means `<div className="test"></div>` is different from `<div classname="test"></div>` (all lower case). The former compiles to `m("div", {className: "test"})` and the latter compiles to `m("div", {classname: "test"})`, which is not a valid way of creating a class attribute). Fortunately, Mithril supports standard HTML attribute names, and thus, this example can be written like regular HTML: `<div class="test"></div>`.

JSX is useful for teams where HTML is primarily written by someone without Javascript experience, but it requires a significant amount of tooling to maintain (whereas plain HTML can, for the most part, simply be opened in a browser)

Hyperscript is the compiled representation of JSX. It's designed to be readable and can also be used as-is, instead of JSX (as is done in most of the documentation). Hyperscript tends to be terser than JSX for a couple of reasons:

1 - it does not require repeating the tag name in closing tags (e.g. `m("div")` vs `<div></div>`)
2 - static attributes can be written using CSS selector syntax (i.e. `m("a.button")` vs `<div class="button"></div>`

In addition, since hyperscript is plain Javascript, it's often more natural to indent than JSX:

```
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
