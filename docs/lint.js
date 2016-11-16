#!/usr/bin/env node

var fs = require("fs")
var path = require("path")

//lint rules
function lint(file, data) {
	ensureCodeIsHighlightable(file, data)
	ensureCodeIsSyntaticallyValid(file, data)
	ensureCodeIsRunnable(file, data)
	ensureCommentStyle(file, data)
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
		new Function("console,fetch,module,require", code).call(this, silentConsole, fetch, {exports: {}}, function(dep) {
			if (dep.indexOf("./mycomponent") === 0) return {view: function() {}}
			if (dep.indexOf("mithril/ospec/ospec") === 0) return global.o
			if (dep.indexOf("mithril/stream") === 0) return global.stream
			if (dep === "mithril") return global.m
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

function initMocks() {
	global.window = require("../test-utils/browserMock")()
	global.document = window.document
	global.m = require("../index")
	global.o = require("../ospec/ospec")
	global.stream = require("../stream")

	//routes consumed by request.md
	global.window.$defineRoutes({
		"GET /api/v1/users": function(request) {
			return {status: 200, responseText: JSON.stringify([{name: ""}])}
		},
		"GET /api/v1/todos": function(request) {
			return {status: 200, responseText: JSON.stringify([])}
		},
		"POST /api/v1/upload": function(request) {
			return {status: 200, responseText: JSON.stringify([])}
		},
		"GET /files/icon.svg": function(request) {
			return {status: 200, responseText: "<svg></svg>"}
		},
		"GET /files/data.csv": function(request) {
			return {status: 200, responseText: "a,b,c"}
		},
		"GET /api/v1/users/123": function(request) {
			return {status: 200, responseText: JSON.stringify({id: 123})}
		},
		"GET /api/v1/users/foo:bar": function(request) {
			return {status: 200, responseText: JSON.stringify({id: 123})}
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
	if (pathname.indexOf(".md") > -1 && pathname.indexOf("migration") < 0 && pathname.indexOf("tutorial") < 0) {
		fs.readFile(pathname, "utf8", function(err, data) {
			if (err) console.log(err)
			else lint(pathname, data)
		})
	}
})

