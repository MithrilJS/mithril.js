# ES6

- [Setup](#setup)
- [Using Babel with Webpack](#using-babel-with-webpack)

---

Mithril is written in ES5, and is fully compatible with ES6 as well. ES6 is a recent update to Javascript that introduces new syntax sugar for various common cases. It's not yet fully supported by all major browsers and it's not a requirement for writing an application, but it may be pleasing to use depending on your team's preferences.

In some limited environments, it's possible to use a significant subset of ES6 directly without extra tooling (for example, in internal applications that do not support IE). However, for the vast majority of use cases, a compiler toolchain like [Babel](https://babeljs.io) is required to compile ES6 features down to ES5.

### Setup

The simplest way to setup an ES6 compilation toolchain is via [Babel](https://babeljs.io/).

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

```json
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

```json
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
const path = require('path')

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, './bin'),
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

```json
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

```json
{
	"name": "my-project",
	"scripts": {
		"start": "webpack -d --watch",
		"build": "webpack -p"
	}
}
```

You can use hooks in your production environment to run the production build script automatically. Here's an example for [Heroku](https://www.heroku.com/):

```json
{
	"name": "my-project",
	"scripts": {
		"start": "webpack -d --watch",
		"build": "webpack -p",
		"heroku-postbuild": "webpack -p"
	}
}
```
