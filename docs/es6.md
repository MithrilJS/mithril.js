# ES6

Mithril is written in ES5, and is fully compatible with ES6 as well.

In some limited environments, it's possible to use a significant subset of ES6 directly without extra tooling (for example, in internal applications that do not support IE). However, for the vast majority of use cases, a compiler toolchain like [Babel](https://babeljs.io) is required to compile ES6 features down to ES5.

### Setup

The simplest way to setup an ES6 compilation toolchain is via [Babel](https://babeljs.io/). To install, use this command:

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

### Custom setups

If you're using Webpack, you can [follow its excellent guide to add support for ES6](https://webpack.github.io/docs/usage.html#transpiling-es2015-using-babel-loader)

If you want to use Babel as a standalone tool, [here's the instructions for how to set it up](https://babeljs.io/docs/setup/#installation).

[Google closure compiler](https://www.npmjs.com/package/google-closure-compiler) is another tool that supports ES6 to ES5 compilation.
