T.time("Setup");

var m = require("../../mithril")
var request = m.request

//API calls
var api = {
	home : function() {
		T.timeEnd("Setup")
		return request({method: "GET", url: T.apiUrl + "/threads/"})
	},
	thread : function(id) {
		T.timeEnd("Setup")
		return request({method: "GET", url: T.apiUrl + "/comments/" + id}).map(T.transformResponse)
	},
	newThread : function(text) {
		return request({method: "POST", url: T.apiUrl + "/threads/create",data: {text: text}})
	},
	newComment : function(text, id) {
		return request({method: "POST", url: T.apiUrl + "/comments/create", data: {text: text, parent: id}});
	}
};

var threads = [], current = null, loaded = false, error = false, notFound = false
function loadThreads() {
	loaded = false
	api.home().map(function(response) {
		document.title = "ThreaditJS: Mithril | Home"
		threads = response.data
		loaded = true
	}, function() {
		loaded = error = true
	})
}

function loadThread(id) {
	loaded = false
	notFound = false
	api.thread(id).map(function(response) {
		document.title = "ThreaditJS: Mithril | " + T.trimTitle(response.root.text);
		loaded = true
		current = response
	}, function(response) {
		loaded = true
		if (response.status === 404) notFound = true
		else error = true
	})
}
function unloadThread() {
	current = null
}

function createThread() {
	var threadText = document.getElementById("threadText")
	api.newThread(threadText.value).map(function(response) {
		threadText.value = "";
		threads.push(response.data);
	})
	return false
}

function showReplying(vnode) {
	vnode.state.replying = true
	vnode.state.newComment = ""
	return false
}

function submitComment(vnode) {
	api.newComment(vnode.state.newComment, vnode.attrs.node.id).map(function(response) {
		vnode.state.newComment = ""
		vnode.state.replying = false
		vnode.attrs.node.children.push(response.data)
	})
	return false
}

//shared
var Header = {
	view: function() {
		return [
			m("p.head_links", [
				m("a[href='https://github.com/koglerjs/threaditjs/tree/master/examples/mithril']", "Source"),
				" | ",
				m("a[href='http://threaditjs.com']", "ThreaditJS Home"),
			]),
			m("h2", [
				m("a[href='/']", {oncreate: m.route.link}, "ThreaditJS: Mithril"),
			]),
		]
	}
}

//home
var Home = {
	oninit: loadThreads,
	view: function() {
		return [
			m(Header),
			m(".main", [
				loaded === false ? m("h2", "Loading") :
				error ? m("h2", "Error! Try refreshing.") :
				notFound ? m("h2", "Not found! Don't try refreshing!") : [
					threads.map(function(thread) {
						return [
							m("p", [
								m("a", {href: "/thread/" + thread.id, oncreate: m.route.link}, m.trust(T.trimTitle(thread.text))),
							]),
							m("p.comment_count", thread.comment_count + " comment(s)"),
							m("hr"),
						]
					}),
					m(NewThread),
				]
			])
		]
	}
}
var NewThread = {
	view: function() {
		return m("form", {onsubmit: createThread}, [
			m("textarea#threadText"),
			m("input", {type:"submit", value: "Post!"}),
		])
	}
}

//thread
var Thread = {
	oninit: function(vnode) {
		loadThread(vnode.attrs.id)
	},
	onremove: unloadThread,
	view: function() {
		if (current) T.time("Thread render")
		return [
			m(Header),
			current ? m(".main", {oncreate: function() {T.timeEnd("Thread render")}}, [
				m(ThreadNode, {node: current.root})
			]) : null
		]
	}
}
var ThreadNode = {
	view: function(vnode) {
		return m(".comment", [
			m("p", m.trust(vnode.attrs.node.text)),
			m(".reply", m(Reply, vnode.attrs)),
			m(".children", [
				vnode.attrs.node.children.map(function(child) {
					return m(ThreadNode, {node: child})
				})
			])
		])
	}
}
var Reply = {
	view: function(vnode) {
		return vnode.state.replying
			? m("form", {onsubmit: function() {return submitComment(vnode)}}, [
				m("textarea", {
					value: vnode.state.newComment,
					oninput: function(e) {
						vnode.state.newComment = e.target.value
					},
				}),
				m("input", {type:"submit", value: "Reply!"}),
				m(".preview", m.trust(T.previewComment(vnode.state.newComment))),
			])
			: m("a", {onclick: function() {return showReplying(vnode)}}, "Reply!")
	}
}

//router
m.route(document.getElementById("app"), "/", {
	"/thread/:id" : Thread,
	"/" : Home,
})
