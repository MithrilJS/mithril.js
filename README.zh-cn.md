[![Build Status](https://travis-ci.org/lhorie/mithril.js.svg?branch=master)](https://travis-ci.org/lhorie/mithril.js)

# Mithril

可以创建杰出应用的 Javascript 框架

浏览 [网站](http://lhorie.github.io/mithril) 获取更多信息

或者 [blog](http://lhorie.github.io/mithril-blog) 和 [mailing list](https://groups.google.com/forum/#!forum/mithriljs)

---

## Mithril是?

Mithril 是一个客户端 MVC 框架 —— 以一个易于理解和维护的方式来组织代码的工具。

### 轻量

- gzip压缩后只有 5kb , 没有依赖
- 少量 API, 学习难度小

### 健壮

- 默认拥有安全模版
- 通过组件实现分层 MVC

### 快速

- VDOM DOM 虚拟化，自动计算差异 和 可编译模板
- 智能 自动重绘 系统

---

## 示例代码

```javascript
//namespace
var app = {};

//model
app.PageList = function() {
	return m.request({method: "GET", url: "pages.json"});
};

//controller
app.controller = function() {
	var pages = app.PageList();
	return {
		pages: pages,
		rotate: function() {
			pages().push(pages().shift());
		}
	}
};

//view
app.view = function(ctrl) {
	return [
		ctrl.pages().map(function(page) {
			return m("a", {href: page.url}, page.title);
		}),
		m("button", {onclick: ctrl.rotate}, "Rotate links")
	];
};


//initialize
m.module(document.getElementById("example"), app);
```

---

### 更多

- [教程](http://lhorie.github.io/mithril/getting-started.html)
- [与其他框架比较](http://lhorie.github.io/mithril/comparison.html)
- [基准测试](http://lhorie.github.io/mithril/benchmarks.html)
