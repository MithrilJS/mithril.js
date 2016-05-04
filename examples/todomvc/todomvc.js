var m = require("../../render/hyperscript")
var render = require("../../render/render")(window, run).render
var router = require("../../router/router")(window, "#")

//model
var todos = loadData()
var editing = null
var showing = "all"

function loadData() {
	return JSON.parse(localStorage["todos-mithril"] || "[]")
}
function saveData() {
	localStorage["todos-mithril"] = JSON.stringify(todos)
}

function createTodo(title) {
	todos.push({title: title.trim(), completed: false})
}
function setStatuses(completed) {
	for (var i = 0; i < todos.length; i++) todos[i].completed = completed
}
function setStatus(todo, completed) {
	todo.completed = completed
}
function todosByStatus(todo) {
	switch (showing) {
		case "all": return true
		case "active": return !todo.completed
		case "completed": return todo.completed
	}
}
function destroy(todo) {
	var index = todos.indexOf(todo)
	if (index > -1) todos.splice(index, 1)
}
function countRemaining() {
	return todos.filter(function(todo) {return !todo.completed}).length
}
function clear() {
	for (var i = 0; i < todos.length; i++) {
		if (todos[i].completed) destroy(todos[i--])
	}
}

function edit(todo) {
	editing = todo
}
function update(title) {
	editing.title = title.trim()
	if (editing.title === "") destroy(editing)
	editing = null
}
function reset() {
	editing = null
}

function setFilter(filter) {
	showing = filter
}

//view
function add(e) {
	if (e.keyCode === 13) {
		createTodo(this.value)
		this.value = ""
	}
}
function toggleAll() {
	setStatuses(document.getElementById("toggle-all").checked)
}
function toggle(todo) {
	setStatus(todo, !todo.completed)
}
function focus(vnode, todo) {
	if (todo === editing && vnode.dom !== document.activeElement) {
		vnode.dom.value = todo.title
		vnode.dom.focus()
		vnode.dom.selectionStart = vnode.dom.selectionEnd = todo.title.length
	}
}
function save(e) {
	if (e.keyCode === 13 || e.type === "blur") update(this.value)
	else if (e.keyCode === 27) reset()
}

function view() {
	var remaining = countRemaining()
	return [
		m("header.header", [
			m("h1", "todos"),
			m("input#new-todo[placeholder='What needs to be done?'][autofocus]", {onkeypress: add}),
		]),
		m("section#main", {style: {display: todos.length > 0 ? "" : "none"}}, [
			m("input#toggle-all[type='checkbox']", {checked: remaining === 0, onclick: toggleAll}),
			m("label[for='toggle-all']", {onclick: toggleAll}, "Mark all as complete"),
			m("ul#todo-list", [
				todos.filter(todosByStatus).map(function(todo) {
					return m("li", {class: (todo.completed ? "completed" : "") + " " + (todo === editing ? "editing" : "")}, [
						m(".view", [
							m("input.toggle[type='checkbox']", {checked: todo.completed, onclick: function() {toggle(todo)}}),
							m("label", {ondblclick: function() {edit(todo)}}, todo.title),
							m("button.destroy", {onclick: function() {destroy(todo)}}),
						]),
						m("input.edit", {onupdate: function(vnode) {focus(vnode, todo)}, onkeypress: save, onblur: save})
					])
				}),
			]),
		]),
		todos.length ? m("footer#footer", [
			m("span#todo-count", [
				m("strong", remaining),
				remaining === 1 ? " item left" : " items left",
			]),
			m("ul#filters", [
				m("li", m("a[href='#/']", {class: showing === "all" ? "selected" : ""}, "All")),
				m("li", m("a[href='#/active']", {class: showing === "active" ? "selected" : ""}, "Active")),
				m("li", m("a[href='#/completed']", {class: showing === "completed" ? "selected" : ""}, "Completed")),
			]),
			m("button#clear-completed", {onclick: clear}, "Clear completed"),
		]) : null,
	]
}

var root = document.getElementById("todoapp")
var raf
function run() {
	cancelAnimationFrame(raf)
	raf = requestAnimationFrame(function() {
		saveData()
		render(root, view())
	})
}

router.defineRoutes({
	"/": "all",
	"/active": "active",
	"/completed": "completed",
}, function(filter) {
	setFilter(filter)
	run()
}, function() {
	router.setPath("/")
})
