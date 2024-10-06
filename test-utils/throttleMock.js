export default function throttleMocker() {
	let queue = new Map()
	let id = 0
	return {
		schedule(fn) {
			queue.set(++id, fn)
			return id
		},
		clear(id) {
			queue.delete(id)
		},
		fire() {
			const tasks = queue
			queue = new Map()
			for (const fn of tasks.values()) fn()
		},
		queueLength() {
			return queue.size
		}
	}
}
