"use strict"

process.on("unhandledRejection", (e) => { throw e })

function reportExec(e) {
	if (!e.stdout || !e.stderr) return false
	console.error(e.stack)

	if (e.stdout && e.stdout.length) {
		console.error(e.stdout.toString("utf-8"))
	}
	if (e.stderr && e.stderr.length) {
		console.error(e.stderr.toString("utf-8"))
	}

	return true
}

exports.exec = (mod, init) => {
	if (require.main === mod) {
		// Skip the first tick.
		Promise.resolve().then(init).catch((e) => {
			// eslint-disable-next-line no-process-exit
			if (reportExec(e)) process.exit(1)
			else throw e
		})
	}
}

exports.run = async (init) => {
	try {
		await init()
	} catch (e) {
		if (!reportExec(e)) console.error(e)
	}
}
