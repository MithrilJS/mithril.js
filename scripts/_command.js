"use strict"

process.on("unhandledRejection", function (e) {
	process.exitCode = 1
	if (!e.stdout || !e.stderr) throw e
	console.error(e.stack)

	if (e.stdout && e.stdout.length) {
		console.error(e.stdout.toString("utf-8"))
	}
	if (e.stderr && e.stderr.length) {
		console.error(e.stderr.toString("utf-8"))
	}

	// eslint-disable-next-line no-process-exit
	process.exit()
})

module.exports = ({exec, watch}) => {
	const index = process.argv.indexOf("--watch")
	if (index >= 0) {
		process.argv.splice(index, 1)

		if (watch == null) {
			console.error("Watching this script is not supported!")
			// eslint-disable-next-line no-process-exit
			process.exit(1)
		}

		watch()
	} else {
		Promise.resolve(exec()).then((code) => {
			if (code != null) process.exitCode = code
		})
	}
}
