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
			catch (e) {}
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
		new Function("console,fetch", code).call(this, silentConsole, fetch)
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

//init mocks
var domMock = require("../test-utils/domMock")()
var xhrMock = require("../test-utils/xhrMock")()
var pushStateMock = require("../test-utils/pushStateMock")()

global.window = {}
for (var key in domMock) if (!window[key]) window[key] = domMock[key]
for (var key in xhrMock) if (!window[key]) window[key] = xhrMock[key]
for (var key in pushStateMock) if (!window[key]) window[key] = pushStateMock[key]

global.document = window.document
global.m = require("../index")

//run
traverseDirectory("./docs", function(pathname, stat, children) {
	if (pathname.indexOf(".md") > -1 && pathname.indexOf("migration") < 0) {
		fs.readFile(pathname, "utf8", function(err, data) {
			if (err) console.log(err)
			else lint(pathname, data)
		})
	}
})

