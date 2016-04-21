T.time("Setup");

var request = require("../../request/request")(window, Promise, run).ajax
var m = require("../../render/hyperscript")
var trust = require("../../render/trust")
var render = require("../../render/render")(window, run).render
var router = require("../../router/router")(window, "#")

//API calls
var api = {
	home : function() {
		T.timeEnd("Setup")
		return request({
			method: "GET",
			url: T.apiUrl + "/threads/",
		})
	}, 
	thread : function(id) {
		T.timeEnd("Setup")
		return request({
			method: "GET",
			url: T.apiUrl + "/comments/" + id,
		}).then(T.transformResponse)
	},
	newThread : function(text) {
		return request({
			method: "POST", 
			url: T.apiUrl + "/threads/create",
			data: {text: text},
		});
	},
	newComment : function(text, id) {
		return request({
			url: T.apiUrl + "/comments/create", 
			method: "POST",
			data: {
				text: text,
				parent: id,
			}
		});
	}
};

var threads = [], current = null, loaded = false, error = false, notFound = false
function loadThreads() {
	loaded = false
	api.home().then(function(response) {
		document.title = "ThreaditJS: Mithril | Home"
		threads = response.data
		loaded = true
	}, function() {
		loaded = error = true
	})
	.then(run)
}

function loadThread(id) {
	loaded = false
	notFound = false
	api.thread(id).then(function(response) {
		document.title = "ThreaditJS: Mithril | " + T.trimTitle(response.root.text);
		loaded = true
		current = response
	}, function(response) {
		loaded = true
		if (response.status === 404) notFound = true
		else error = true
	})
	.then(run)
}
function unloadThread() {
	current = null
}

function createThread() {
	var threadText = document.getElementById("threadText")
	api.newThread(threadText.value).then(function(response) {
		threadText.value = "";
		threads.push(response.data);
	})
	.then(run)
	return false
}

function showReplying(node) {
	node.replying = true
	node.newComment = ""
	return false
}

function submitComment(node) {
	api.newComment(node.newComment, node.id).then(function(response) {
		node.newComment = ""
		node.replying = false
		node.children.push(response.data)
	})
	.then(run)
	return false
}

//shared
function header() {
	return [
		m("p.head_links", [
			m("a[href='https://github.com/koglerjs/threaditjs/tree/master/examples/mithril']", "Source"),
			" | ", 
			m("a[href='http://threaditjs.com']", "ThreaditJS Home"),
		]),
		m("h2", [
			m("a[href='#/']", "ThreaditJS: Mithril"),
		]),
	]
}

//home
function home() {
	return {tag: "[", key: "home", attrs: {oncreate: loadThreads}, children: [
		header(),
		m(".main", [
			loaded === false ? m("h2", "Loading") :
			error ? m("h2", "Error! Try refreshing.") :
			notFound ? m("h2", "Not found! Don't try refreshing!") :
			[
				threads.map(threadListItem),
				newThread(),
			]
		])
	]}
}
function newThread() {
	return m("form", {onsubmit: createThread}, [
		m("textarea#threadText"),
		m("input", {type:"submit", value: "Post!"}),
	])
}

function threadListItem(thread) {
	return [
		m("p", [
			m("a", {href: "#/thread/" + thread.id}, trust(T.trimTitle(thread.text))),
		]),
		m("p.comment_count", thread.comment_count + " comment(s)"),
		m("hr"),
	]
}

//thread
function thread(args) {
	if (current) T.time("Thread render")
	return {tag: "[", key: args.id, attrs: {oncreate: function() {loadThread(args.id)}, onremove: unloadThread}, children: [
		header(), 
		current ? m(".main", {oncreate: function() {T.timeEnd("Thread render")}}, [
			threadNode({node: current.root})
		]) : null
	]}
}
function threadNode(args) {
	return m(".comment", [		
		m("p", trust(args.node.text)),
		m(".reply", reply(args)),
		m(".children", [
			args.node.children.map(function(child) {
				return threadNode({node: child})
			})
		])
	])
}
function reply(args) {
	return args.node.replying
		? m("form", {onsubmit: function() {return submitComment(args.node)}}, [
			m("textarea", {
				value: args.node.newComment, //FIXME decouple UI state from data
				oninput: function(e) {
					args.node.newComment = e.target.value
				},
			}),
			m("input", {type:"submit", value: "Reply!"}),
			m(".preview", trust(T.previewComment(args.node.newComment))),
		])
		: m("a", {onclick: function() {return showReplying(args.node)}}, "Reply!")
}

//router
function run() {
	replayRoute()
}

var replayRoute = router.defineRoutes({
	"/thread/:id" : thread,
	"/" : home
}, function(view, args) {
	render(document.body, [view(args)])
}, function() {
	router.setPath("/")
})
