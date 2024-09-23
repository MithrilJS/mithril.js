"use strict"

process.on("unhandledRejection", (e) => {
	process.exitCode = 1

	if (!e.stdout || !e.stderr) throw e

	console.error(e.stack)

	if (e.stdout?.length) {
		console.error(e.stdout.toString("utf-8"))
	}

	if (e.stderr?.length) {
		console.error(e.stderr.toString("utf-8"))
	}

	// eslint-disable-next-line no-process-exit
	process.exit()
})
