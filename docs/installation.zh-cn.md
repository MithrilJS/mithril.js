## 安装

Mithril 可以从很多地方获得:

---

### 直接下载

你可以 [下载最新版的 zip 文件](http://lhorie.github.io/mithril/mithril.min.zip).

旧版在这里可以找到 [change log](change-log.html).

要使用 Mithril, 从 zip 文件解压 然后使用 script 标签引用 `.js` 文件:

```markup
<script src="mithril.min.js"></script>
```

注意 为了支持旧版 IE, 你需要引入 [一些 shims](tools.md#internet-explorer-compatibility).

---

### CDNs (Content Delivery Networks)

You can also find Mithril in [cdnjs](http://cdnjs.com/libraries/mithril/) and [jsDelivr](http://www.jsdelivr.com/#!mithril).

Content delivery networks allow the library to be cached across different websites that use the same version of the framework, and help reduce latency by serving the files from a server that is physically near the user's location.

#### cdnjs

```markup
<script src="//cdnjs.cloudflare.com/ajax/libs/mithril/$version/mithril.min.js"></script>
```

#### jsDelivr

```markup
<script src="//cdn.jsdelivr.net/mithril/$version/mithril.min.js"></script>
```

---

### NPM

NPM is the default package manager for [NodeJS](http://nodejs.org/). If you're using NodeJS already or planning on using [Grunt](http://gruntjs.com/) to create a build system, you can use NPM to conveniently keep up-to-date with Mithril versions.

Assuming you have NodeJS installed,  you can download Mithril by typing this:

```
npm install mithril
```

Then, to use Mithril, point a script tag to the downloaded file:

```markup
<script src="/node_modules/mithril/mithril.min.js"></script>
```

---

### Bower

[Bower](http://bower.io) is a package manager for [NodeJS](http://nodejs.org/). If you're using NodeJS already or planning on using [Grunt](http://gruntjs.com/) to create a build system, you can use Bower to conveniently keep up-to-date with Mithril versions.

Assuming you have NodeJS installed, you can install Bower by typing this in the command line:

```
npm install -g bower
```

And you can download Mithril by typing this:

```
bower install mithril
```

Then, to use Mithril, point a script tag to the downloaded file:

```markup
<script src="/bower_components/mithril/mithril.min.js"></script>
```

---

### Component

[Component](http://component.io) is another package manager for [NodeJS](http://nodejs.org/). If you're using NodeJS already or planning on using [Grunt](http://gruntjs.com/) to create a build system, you can use Component to conveniently keep up-to-date with Mithril versions.

Assuming you have NodeJS installed, you can install Component by typing this in the command line:

```
npm install -g component
```

And you can download Mithril by typing this:

```
component install lhorie/mithril
```

Then, to use Mithril, point a script tag to the downloaded file:

```markup
<script src="/components/lhorie/mithril/master/mithril.js"></script>
```

---

### Rails

Jordan Humphreys created a gem to allow integration with Rails:

[Mithril-Rails](https://github.com/mrsweaters/mithril-rails)

It includes support for the [MSX](https://github.com/insin/msx) HTML templating syntax from Jonathan Buchanan.

---

### Github

You can also fork the latest stable project [directly from Github](https://github.com/lhorie/mithril).

If you want to use the bleeding edge version, you can [fork the development repository](https://github.com/lhorie/mithril).

Note that Mithril uses the `next` branch as the stable branch, instead of `master`, because contributors usually use `master` for pull requests. Therefore, the `master` branch should be considered unstable, and should not be used.

Be aware that even though Mithril has tests running in a continuous integration environment, the bleeding edge version might occasionally break. If you're interested in helping improve Mithril, you're welcome to use the bleeding edge version and report any bugs that you find.

In order to update a forked version of Mithril, [follow the instructions on this page](https://help.github.com/articles/syncing-a-fork).
