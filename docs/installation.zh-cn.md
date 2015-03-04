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

### CDN 镜像加速 (Content Delivery Networks)

你也可以通过CDN使用 Mithril ，它们在 [cdnjs](http://cdnjs.com/libraries/mithril/) 和 [jsDelivr](http://www.jsdelivr.com/#!mithril).

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

NPM 是 [NodeJS](http://nodejs.org/) 默认的包管理工具.
假设你已经安装了 NodeJS 并带有 NPM,  你可以输入如下指令安装 Mithril:

```
npm install mithril
```

然后, 要使用 Mithril 用 script 标签引用下载的文件:

```markup
<script src="/node_modules/mithril/mithril.min.js"></script>
```

---

### Bower

[Bower](http://bower.io) 也可以管理 [NodeJS](http://nodejs.org/) 包.
假设你已经安装了 NodeJS 并带有 NPM,  你可以输入如下指令安装 bower:

```
npm install -g bower
```

你可以输入如下指令安装 Mithril:

```
bower install mithril
```

然后, 要使用 Mithril 用 script 标签引用下载的文件:

```markup
<script src="/bower_components/mithril/mithril.min.js"></script>
```

---

### Component

[Component](http://component.io) 是另一个 [NodeJS](http://nodejs.org/) 包管理工具.
假设你已经安装了 NodeJS 并带有 NPM,  你可以输入如下指令安装 component:

```
npm install -g component
```

你可以输入如下指令安装 Mithril:

```
component install lhorie/mithril
```

然后, 要使用 Mithril 用 script 标签引用下载的文件:

```markup
<script src="/components/lhorie/mithril/master/mithril.js"></script>
```

---

### Rails

Jordan Humphreys 创建了一个 gem 允许你把它集成到 Rails:

[Mithril-Rails](https://github.com/mrsweaters/mithril-rails)

它包含了 [MSX](https://github.com/insin/msx) HTML 模版语法，出自 Jonathan Buchanan 之手.

---

### Github

你也可以 fork 最新的项目 [directly from Github](https://github.com/lhorie/mithril).

如果你想要最前沿的版本, 你可以 [fork 开发版本库](https://github.com/lhorie/mithril.js).

注意 Mithril 使用 `next` 分支作为稳定分支, 而不是 `master`, 因为贡献者使用 `master` 分支来 pull request。 所以,  `master` 分支应被认为是不稳定的。

你要意识到尽管 Mithril 在一个持续集成环境中测试, 前沿版会偶尔崩溃。 如果你有兴趣帮助改进 Mithril, 欢迎使用前言版本并报告 bug 。

要更新一个 fork 版本的 Mithril, [请看这篇介绍](https://help.github.com/articles/syncing-a-fork).
