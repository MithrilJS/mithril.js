<!--meta-description
Instructions on how to install Mithril.js
-->

# Installation

- [CDN and online playground](#cdn)
- [npm](#npm)
- [Quick start with Webpack](#quick-start-with-webpack)

### CDN and online playground

If you're new to JavaScript or just want a very simple setup to get your feet wet, you can get Mithril.js from a [CDN](https://en.wikipedia.org/wiki/Content_delivery_network):

```html
<script src="https://unpkg.com/mithril/mithril.js"></script>
```

If you would like to try out Mithril.js without setting up a local environment, you can easily use an online playground at [flems.io/mithril](https://flems.io/mithril).

---

### npm

```bash
$ npm install mithril
```

TypeScript type definitions are available from DefinitelyTyped. They can be installed with:

```bash
$ npm install @types/mithril --save-dev
```

For example usage, to file issues or to discuss TypeScript related topics visit: https://github.com/MithrilJS/mithril.d.ts

Type definitions for pre-release versions of Mithril.js (on the `next` branch) align with the `next` branch of the [types development repo](https://github.com/MithrilJS/mithril.d.ts/tree/next). You can install these types with:

```bash
$ npm install -D MithrilJS/mithril.d.ts#next
```

---

### Create a project locally

You can use one of several existing Mithril.js starter templates such as
* [mithril-vite-starter](https://github.com/ArthurClemens/mithril-vite-starter)
* [mithril-esbuild-starter](https://github.com/kevinfiol/mithril-esbuild-starter)
* [mithril-rollup-starter](https://github.com/kevinfiol/mithril-rollup-starter)

For example, if you'd like to get started with `mithril-esbuild-starter`, run the following commands:
```bash
# Clone the the template to a directory of your choice
npx degit kevinfiol/mithril-esbuild-starter hello-world

# Navigate to newly scaffolded project
cd ./hello-world/

# Install dependencies
npm install

# Build the app and watch for changes
npm run dev
```

### Quick start with [esbuild](https://esbuild.github.io/)

1. Initialize the directory as an npm package.
```bash
$ npm init --yes
```

2. Install required tools.
```bash
$ npm install mithril
$ npm install esbuild --save-dev
```

3. Add a "start" entry to the scripts section in `package.json`.
	```json
	{
		"...": "...",
		"scripts": {
			"start": "esbuild index.js --bundle --outfile=bin/main.js --watch"
		}
	}
	```

	Optionally, if you'd like to use JSX, you can use the `--jsx-factory` and `--jsx-fragment` flags with esbuild.

	```json
	{
		"...": "...",
		"scripts": {
			"start": "esbuild index.js --bundle --outfile=bin/main.js --jsx-factory=m --jsx-fragment='\"[\"' --watch"
		}
	}
	```

4. Create `index.js` file.
```javascript
import m from "mithril";
m.render(document.getElementById("app"), "hello world");
```

5. Create `index.html` file.
```html
<!DOCTYPE html>
<body>
	<div id="app"></div>
	<script src="bin/main.js"></script>
</body>
```

6. Run your bundler script.
```bash
$ npm run start
```

7. Open `index.html` in a browser. You should see `hello world` rendered on your page.
