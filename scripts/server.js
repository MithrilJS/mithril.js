import * as fs from "node:fs"
import * as http from "node:http"
import * as path from "node:path"
import {fileURLToPath} from "node:url"

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const port = process.argv[2] || "8080"

if (!(/^[1-9][0-9]*$/).test(port) || Number(port) > 65535) {
	console.error("Port must be a non-zero integer at most 65535 if provided")
	// eslint-disable-next-line no-process-exit
	process.exit(1)
}

const url = "http://localhost:8080/"
const headers = {
	"cache-control": "no-cache, no-store, must-revalidate",
	"access-control-allow-origin": url,
	"access-control-allow-headers": "origin, x-requested-with, content-type, accept, range",
	"cross-origin-opener-policy": "same-origin",
	"cross-origin-embedder-policy": "require-corp",
}

function isDisconnectError(e) {
	return (/^EPIPE$|^ECONN(?:RESET|ABORT|REFUSED)$/).test(e)
}

const server = http.createServer((req, res) => {
	const receivedDate = new Date()

	let parsedUrl

	try {
		parsedUrl = new URL(req.url, url)
	} catch {
		res.writeHead(400, headers).end()

		console.log(`[${receivedDate.toISOString()}] ${res.statusCode} - ${req.method} ${req.url} "${req.headers["user-agent"] || ""}"`)
		return
	}

	const file = path.resolve(root, "." + path.posix.resolve("/", parsedUrl.pathname))

	let contentType

	if (file.endsWith(".js")) {
		contentType = "application/javascript;charset=utf-8"
	} else if (file.endsWith(".html")) {
		contentType = "text/html;charset=utf-8"
	}

	fs.readFile(file, (err, buf) => {
		if (!err) {
			res.writeHead(200, contentType ? {...headers, "content-type": contentType} : headers).end(buf)
		} else if (err.code === "ENOENT") {
			res.writeHead(404, headers).end()
		} else {
			res.writeHead(500, headers).end()
		}

		console.log(`[${receivedDate.toISOString()}] ${res.statusCode} - ${req.method} ${req.url} "${req.headers["user-agent"] || ""}"`)
	})
})

server.on("error", (e) => {
	if (!isDisconnectError(e)) {
		console.error(e)
		process.exitCode = 1
	}
})

server.on("listening", () => {
	console.log(`Listening at ${url}`)
})

server.listen(Number(port))
