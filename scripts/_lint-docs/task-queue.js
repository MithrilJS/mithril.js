"use strict"

// CI needs a much lower limit so it doesn't hang.
const maxConcurrency = process.env.CI === "true" ? 5 : 20

const queue = []
let running = 0

function runTask(task, callback) {
	process.nextTick(task, (...args) => {
		process.nextTick(callback, ...args)
		if (running === maxConcurrency) {
			const [nextTask, nextCallback] = queue.splice(0, 2)
			runTask(nextTask, nextCallback)
		}
	})
}

/**
 * @template {any[]} A
 * @param {(callback: (...args: A) => void) => void} task
 * @param {(...args: A) => void} callback
 */
function submitTask(task, callback) {
	if (running < maxConcurrency) {
		running++
		runTask(task, callback)
	} else {
		queue.push(task, callback)
	}
}

module.exports = {
	submitTask,
}
