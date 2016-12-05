/* eslint-env node */
module.exports = function (grunt) { // eslint-disable-line

	var pkg = grunt.file.readJSON("package.json")
	var currentYear = grunt.template.today("yyyy")
	var inputFolder = "./docs"
	var tempFolder = "./temp"
	var archiveFolder = "./archive"
	var outputFolder = "../mithril"

	var guide = [
		"auto-redrawing",
		"benchmarks",
		"community",
		"optimizing-performance",
		"comparison",
		"components",
		"getting-started",
		"installation",
		"integration",
		"practices",
		"refactoring",
		"routing",
		"tools",
		"web-services"
	]

	var api = [
		"change-log",
		"roadmap",
		"how-to-read-signatures",
		"mithril",
		"mithril.computation",
		"mithril.deferred",
		"mithril.mount",
		"mithril.component",
		"mithril.prop",
		"mithril.redraw",
		"mithril.render",
		"mithril.deps",
		"mithril.request",
		"mithril.route",
		"mithril.sync",
		"mithril.trust",
		"mithril.withAttr",
		"mithril.xhr"
	]

	var md2htmlTasks = {}
	function makeTasks(layout, pages) {
		pages.forEach(function (name) {
			var src = inputFolder + "/" + name + ".md"
			var title = ""

			if (grunt.file.exists(src)) {
				title = grunt.file.read(src).split(/\n/)[0].substring(3) +
					" - "
			}

			md2htmlTasks[name] = {
				options: {
					layout: inputFolder + "/layout/" + layout + ".html",
					templateData: {topic: title}
				},
				files: [{
					src: [src],
					dest: tempFolder + "/" + name + ".html"
				}]
			}
		})
	}

	makeTasks("guide", guide)
	makeTasks("api", api)

	var currentVersionArchiveFolder = archiveFolder + "/v" + pkg.version

	grunt.initConfig({
		// Keep this in sync with the .eslintignore
		eslint: {
			options: {
				extensions: [".js"],
				fix: true
			},
			all: [
				"**/*.js",
				"!node_modules/**",
				"!**/*.min.js",
				"!archive/**",
				"!deploy/**",
				"!mithril.closure-compiler-externs.js",
				"!docs/layout/lib/**"
			]
		},

		mocha_phantomjs: { // eslint-disable-line camelcase
			test: {
				src: ["test/index.html", "tests/index.html"],
				options: {
					reporter: "dot"
				}
			}
		},

		md2html: md2htmlTasks,

		uglify: {
			options: {
				banner: [
					"/*",
					"Mithril v" + pkg.version,
					pkg.homepage,
					"(c) 2014-" + currentYear + " " + pkg.author.name,
					"License: " + pkg.license,
					"*/"
				].join("\n"),
				sourceMap: true
			},
			mithril: {src: "mithril.js", dest: "mithril.min.js"}
		},

		zip: {
			distribution: {
				cwd: currentVersionArchiveFolder + "/",
				src: [
					currentVersionArchiveFolder + "/mithril.min.js",
					currentVersionArchiveFolder + "/mithril.min.js.map",
					currentVersionArchiveFolder + "/mithril.js"
				],
				dest: currentVersionArchiveFolder + "/mithril.min.zip"
			}
		},

		replace: {
			options: {
				force: true,
				patterns: [
					{match: /\.md/g, replacement: ".html"},
					{match: /\$version/g, replacement: pkg.version}
				]
			},

			links: {
				expand: true,
				flatten: true,
				src: [tempFolder + "/**/*.html"],
				dest: currentVersionArchiveFolder + "/"
			},

			index: {
				src: inputFolder + "/layout/index.html",
				dest: currentVersionArchiveFolder + "/index.html"
			},

			commonjs: {
				expand: true,
				flatten: true,
				src: [inputFolder + "/layout/*.json"],
				dest: currentVersionArchiveFolder
			},

			cdnjs: {
				src: "deploy/cdnjs-package.json",
				dest: "../cdnjs/ajax/libs/mithril/package.json"
			}
		},

		copy: {
			style: {
				src: inputFolder + "/layout/style.css",
				dest: currentVersionArchiveFolder + "/style.css"
			},

			pages: {
				src: inputFolder + "/layout/pages.json",
				dest: currentVersionArchiveFolder + "/pages.json"
			},

			lib: {
				expand: true,
				cwd: inputFolder + "/layout/lib/",
				src: "./**",
				dest: currentVersionArchiveFolder + "/lib/"
			},

			tools: {
				expand: true,
				cwd: inputFolder + "/layout/tools/",
				src: "./**",
				dest: currentVersionArchiveFolder + "/tools/"
			},

			comparisons: {
				expand: true,
				cwd: inputFolder + "/layout/comparisons/",
				src: "./**",
				dest: currentVersionArchiveFolder + "/comparisons/"
			},

			unminified: {
				src: "mithril.js",
				dest: currentVersionArchiveFolder + "/mithril.js"
			},

			minified: {
				src: "mithril.min.js",
				dest: currentVersionArchiveFolder + "/mithril.min.js"
			},

			readme: {
				src: "README.md",
				dest: currentVersionArchiveFolder + "/README.md"
			},

			map: {
				src: "mithril.min.js.map",
				dest: currentVersionArchiveFolder + "/mithril.min.js.map"
			},

			typescript: {
				src: "mithril.d.ts",
				dest: currentVersionArchiveFolder + "/mithril.d.ts"
			},

			publish: {
				expand: true,
				cwd: currentVersionArchiveFolder,
				src: "./**",
				dest: outputFolder
			},

			archive: {
				expand: true,
				cwd: currentVersionArchiveFolder,
				src: "./**",
				dest: outputFolder + "/archive/v" + pkg.version
			}
		},

		"saucelabs-browsers": {
			firefox: {
				filter: function (browsers) {
					return browsers.filter(function (browser) {
						if (browser.browserName !== "firefox") return false
						var version = browser.version
						return version === "dev" || version === "beta" ||
							+version >= 38 // The latest ESR version
					})
				}
			},

			chrome: {
				filter: function (browsers) {
					return browsers.filter(function (browser) {
						if (browser.browserName !== "chrome") return false
						var version = browser.version
						return version === "dev" || version === "beta" ||
							+version >= 41
					})
				}
			},

			ie: {
				filter: function (browsers) {
					return browsers.filter(function (browser) {
						return browser.browserName === "internet explorer" &&
							!/2003/.test(browser.platform)
					})
				}
			},

			edge: {
				filter: function (browsers) {
					return browsers.filter(function (browser) {
						return browser.browserName === "microsoftedge"
					})
				}
			},

			safari: {
				filter: function (browsers) {
					return browsers.filter(function (browser) {
						return browser.browserName === "safari"
					})
				}
			},

			opera: {
				filter: function (browsers) {
					return browsers.filter(function (browser) {
						return browser.browserName === "opera"
					})
				}
			}
		},

		saucelabs: {
			all: {
				options: {
					username: process.env.SAUCE_USERNAME,
					key: process.env.SAUCE_ACCESS_KEY,
					testname: "Mithril Tests " + new Date().toJSON(),
					browsers: "<%= saucelabs.browsers %>",
					urls: ["http://localhost:8000/test/index.html"],
					sauceConfig: {
						"record-video": false,
						"record-screenshots": false
					},
					build: process.env.TRAVIS_JOB_ID,
					onTestComplete: function (result, callback) {
						var user = process.env.SAUCE_USERNAME
						var pass = process.env.SAUCE_ACCESS_KEY

						var url = [
							"https://saucelabs.com/rest/v1", user, "jobs",
							result.job_id
						].join("/")

						require("request").put({
							url: url,
							auth: {user: user, pass: pass},
							json: {passed: result.passed}
						}, function (error, response) {
							if (error) {
								return callback(error)
							} else if (response.statusCode !== 200) {
								return callback(new Error(
									"Unexpected response status: " +
									response.statusCode + "\n "))
							} else {
								return callback(null, result.passed)
							}
						})
					},
					tunnelTimeout: 5
				}
			}
		},

		connect: {
			server: {
				options: {
					port: 8888,
					base: "."
				}
			}
		},

		clean: {
			options: {force: true},
			generated: [tempFolder]
		}
	})

	grunt.loadNpmTasks("grunt-saucelabs-browsers")
	grunt.loadNpmTasks("grunt-contrib-clean")
	grunt.loadNpmTasks("grunt-contrib-copy")
	grunt.loadNpmTasks("grunt-contrib-uglify")
	grunt.loadNpmTasks("grunt-md2html")
	grunt.loadNpmTasks("grunt-replace")
	grunt.loadNpmTasks("grunt-zip")
	grunt.loadNpmTasks("grunt-contrib-connect")
	grunt.loadNpmTasks("grunt-saucelabs")
	grunt.loadNpmTasks("grunt-eslint")
	grunt.loadNpmTasks("grunt-mocha-phantomjs")

	grunt.registerTask("build", [
		// "lint",
		"test",
		"uglify",
		"zip",
		"md2html",
		"replace",
		"copy",
		"clean"
	])

	grunt.registerTask("lint", ["eslint:all"])
	grunt.registerTask("test", ["mocha_phantomjs"])
	grunt.registerTask("default", ["build"])

	grunt.registerTask("sauce", [
		"saucelabs-browsers:all",
		"connect",
		"saucelabs"
	])
}
