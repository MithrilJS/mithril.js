#!/usr/bin/env node
"use strict"

var fs = require("fs")
var path = require("path")
var http = require("http")
var url = require("url")

//lint rules
function lint(file, data) {
	ensureCodeIsHighlightable(file, data)
	ensureCodeIsSyntaticallyValid(file, data)
	ensureCodeIsRunnable(file, data)
	ensureCommentStyle(file, data)
	ensureLinkIsValid(file, data)
}

function ensureCodeIsHighlightable(file, data) {
	var codeBlocks = data.match(/```(.|\n|\r)*?```/gim) || []
	codeBlocks.forEach(function(block) {
		block = block.slice(3, -3)
		if (block.indexOf("javascript") !== 0) {
			try {if (new Function(block)) console.log(file + " - javascript block missing language tag after triple backtick\n\n" + block + "\n\n---\n\n")}
			catch (e) {/*not a js block, ignore*/}
		}
	})
}

function ensureCodeIsSyntaticallyValid(file, data) {
	var codeBlocks = data.match(/```javascript(.|\n|\r)*?```/gim) || []
	codeBlocks.forEach(function(block) {
		block = block.slice(13, -3)
		try {new Function(block)}
		catch (e) {console.log(file + " - javascript block has wrong syntax\n\n" + e.message + "\n\n" + block + "\n\n---\n\n")}
	})
}

function ensureCodeIsRunnable(file, data) {
	var codeBlocks = data.match(/```javascript(.|\n|\r)*?```/gim) || []
	var code = codeBlocks.map(function(block) {return block.slice(13, -3)}).join(";")

	//stubs
	var silentConsole = {log: function() {}}
	var fetch = function() {
		return Promise.resolve({
			json: function() {}
		})
	}

	try {
		initMocks()
		var module = {exports: {}}
		new Function("console,fetch,module,require", code).call(this, silentConsole, fetch, module, function(dep) {
			if (dep.indexOf("./mycomponent") === 0) return {view: function() {}}
			if (dep.indexOf("mithril/ospec/ospec") === 0) return global.o
			if (dep.indexOf("mithril/stream") === 0) return global.stream
			if (dep === "mithril") return global.m

			if (dep === "../model/User") return {
				list: [],
				current: {},
				loadList: function() {
					return Promise.resolve({data: []})
				},
				load: function() {
					return Promise.resolve({firstName: "", lastName: ""})
				},
				save: function() {
					return Promise.resolve()
				},
			}
			if (dep === "./view/UserList") return {view: function() {}}
			if (dep === "./view/UserForm") return {view: function() {}}
			if (dep === "./view/Layout") return {view: function() {}}
		})
	}
	catch (e) {console.log(file + " - javascript code cannot run\n\n" + e.stack + "\n\n" + code + "\n\n---\n\n")}
}

function ensureCommentStyle(file, data) {
	var codeBlocks = data.match(/```javascript(.|\n|\r)*?```/gim) || []
	codeBlocks.forEach(function(block) {
		block = block.slice(13, -3)
		if (block.match(/(^|\s)\/\/[\S]/)) console.log(file + " - comment missing space\n\n" + block + "\n\n---\n\n")
	})
}

function ensureLinkIsValid(file, data) {
	var links = data.match(/\]\(([^\)]+?)\)/gim) || []
	links.forEach(function(match) {
		var link = match.slice(2, -1)
		var path = (link.match(/[\w-#]+\.md/) || [])[0]
		if (link.match(/http/)) {
			var u = url.parse(link)
			http.request({method: "HEAD", host: u.host, path: u.pathname, port: 80}).on("error", function() {
				console.log(file + " - broken external link: " + link)
			})
		}
		else if (path && !fs.existsSync("docs/" + path)) console.log(file + " - broken link: " + link)
	})
}

function initMocks() {
	global.window = require("../test-utils/browserMock")() // eslint-disable-line global-require
	global.document = window.document
	global.m = require("../index") // eslint-disable-line global-require
	global.o = require("../ospec/ospec") // eslint-disable-line global-require
	global.stream = require("../stream") // eslint-disable-line global-require
	global.alert = function() {}

	//routes consumed by request.md
	global.window.$defineRoutes({
		"GET /api/v1/users": function() {
			return {status: 200, responseText: JSON.stringify([{name: ""}])}
		},
		"GET /api/v1/users/search": function() {
			return {status: 200, responseText: JSON.stringify([{id: 1, name: ""}])}
		},
		"GET /api/v1/users/1/projects": function() {
			return {status: 200, responseText: JSON.stringify([{id: 1, name: ""}])}
		},
		"GET /api/v1/todos": function() {
			return {status: 200, responseText: JSON.stringify([])}
		},
		"PUT /api/v1/users/1": function(request) {
			return {status: 200, responseText: request.query.callback ? request.query.callback + "([])" : "[]"}
		},
		"POST /api/v1/upload": function() {
			return {status: 200, responseText: JSON.stringify([])}
		},
		"GET /files/icon.svg": function() {
			return {status: 200, responseText: "<svg></svg>"}
		},
		"GET /files/data.csv": function() {
			return {status: 200, responseText: "a,b,c"}
		},
		"GET /api/v1/users/123": function() {
			return {status: 200, responseText: JSON.stringify({id: 123})}
		},
		"GET /api/v1/users/foo:bar": function() {
			return {status: 200, responseText: JSON.stringify({id: 123})}
		},
		"GET /files/image.svg": function() {
			return {status: 200, responseText: "<svg></svg>"}
		},
	})
}

//runner
function traverseDirectory(pathname, callback) {
	pathname = pathname.replace(/\\/g, "/")
	return new Promise(function(resolve, reject) {
		fs.lstat(pathname, function(err, stat) {
			if (err) reject(err)
			if (stat.isDirectory()) {
				fs.readdir(pathname, function(err, pathnames) {
					if (err) reject(err)
					var promises = []
					for (var i = 0; i < pathnames.length; i++) {
						pathnames[i] = path.join(pathname, pathnames[i])
						promises.push(traverseDirectory(pathnames[i], callback))
					}
					callback(pathname, stat, pathnames)
					resolve(Promise.all(promises))
				})
			}
			else {
				callback(pathname, stat)
				resolve(pathname)
			}
		})
	})
}

//run
traverseDirectory("./docs", function(pathname) {
	if (pathname.indexOf(".md") > -1 && !pathname.match(/change-log|node_modules/)) {
		fs.readFile(pathname, "utf8", function(err, data) {
			if (err) console.log(err)
			else lint(pathname, data)
		})
	}
})
.then(process.exit)
