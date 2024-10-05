import render from "./render.js"

function makeMountRedraw(schedule, console) {
	var subscriptions = new Map()
	var pending = false

	function redrawSync() {
		subscriptions.forEach((view, root) => {
			try {
				render(root, view(), redraw)
			} catch (e) {
				console.error(e)
			}
		})
	}

	function redraw() {
		if (!pending) {
			pending = true
			schedule(() => {
				pending = false
				redrawSync()
			})
		}
	}

	function mount(root, view) {
		if (view != null && typeof view !== "function") {
			throw new TypeError("m.mount expects a component, not a vnode.")
		}

		if (subscriptions.delete(root)) {
			render(root, [])
		}

		if (typeof view === "function") {
			subscriptions.set(root, view)
			render(root, view(), redraw)
		}
	}

	return {mount, redraw, redrawSync}
}

export {makeMountRedraw as default}
