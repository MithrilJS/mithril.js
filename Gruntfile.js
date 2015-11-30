/* eslint-env node */
module.exports = function (grunt) { // eslint-disable-line

	var pkg = grunt.file.readJSON("package.json")
	var currentYear = grunt.template.today("yyyy")

	var inputFolder = "./docs"
	var layoutFolder = inputFolder + "/layout"
	var outputFolder = "../mithril"
	var archiveFolder = "./archive"
	var currentVersionArchiveFolder = archiveFolder + "/v" + pkg.version

	var guide = [
		"installation",
		"getting-started",
		"routing",
		"web-services",
		"components",
		"auto-redrawing",
		"integration",
		"optimizing-performance",
		"comparison",
		"benchmarks",
		"practices",
		"tools",
		"community"
	]

	var api = [
		"mithril",
		"mithril.component",
		"mithril.mount",
		"mithril.prop",
		"mithril.withAttr",
		"mithril.route",
		"mithril.request",
		"mithril.deferred",
		"mithril.sync",
		"mithril.trust",
		"mithril.render",
		"mithril.redraw",
		"mithril.computation",
		"mithril.deps",
		"roadmap",
		"change-log",
		"how-to-read-signatures"
	]

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
				src: ["test/index.html"],
				options: {
					reporter: "dot"
				}
			}
		},

		jstatic: {
			options: {
				extraContext: [
					{
						config: pkg,
						currentYear: currentYear
					}
				]
			},
			website: {
				files: [
					{
						name: "index",
						src: layoutFolder + "/index.html",
						dest: currentVersionArchiveFolder,
						generators: ["swig"]
					},
					{
						name: "api",
						src: api.map(function (file) {
							return inputFolder + "/" + file + ".md"
						}),
						dest: currentVersionArchiveFolder,
						generators: [
							"yafm",
							"markdown",
							{
								type: "swig",
								layout: layoutFolder + "/api.html"
							}
						]
					},
					{
						name: "guide",
						src: guide.map(function (file) {
							return inputFolder + "/" + file + ".md"
						}),
						dest: currentVersionArchiveFolder,
						generators: [
							"yafm",
							"markdown",
							{
								type: "swig",
								layout: layoutFolder + "/guide.html"
							}
						]
					}
				]
			},
			distribution: {
				files: [
					{
						name: "commonjs",
						src: layoutFolder + "/{bower,component,package}.json",
						dest: currentVersionArchiveFolder,
						outExt: ".json",
						generators: ["swig"]
					},
					{
						name: "cdnjs",
						src: "deploy/cdnjs-package.json",
						dest: "../cdnjs/ajax/libs/mithril/",
						generators: [
							"swig",
							{
								type: "destination",
								dest: "package.json"
							}
						]
					}

				]
			}
		},

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
				expand: true,
				cwd: currentVersionArchiveFolder,
				src: [
					"mithril.js",
					"mithril.min.js",
					"mithril.min.js.map"
				],
				dest: currentVersionArchiveFolder + "/mithril.min.zip"
			}
		},

		copy: {
			assets: {
				files: [
					{
						expand: true,
						cwd: layoutFolder,
						src: [
							"ghbtns.html",
							"style.css",
							"pages.json",
							"lib/**",
							"tools/**",
							"comparisons/**"
						],
						dest: currentVersionArchiveFolder
					},
					{
						expand: true,
						src: [
							"mithril.js",
							"mithril.min.js",
							"mithril.min.js.map",
							"mithril.d.ts",
							"README.md"
						],
						dest: currentVersionArchiveFolder
					}
				]
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
		}
	})

	grunt.loadNpmTasks("grunt-saucelabs-browsers")
	grunt.loadNpmTasks("grunt-contrib-copy")
	grunt.loadNpmTasks("grunt-contrib-uglify")
	grunt.loadNpmTasks("grunt-zip")
	grunt.loadNpmTasks("grunt-contrib-connect")
	grunt.loadNpmTasks("grunt-saucelabs")
	grunt.loadNpmTasks("grunt-eslint")
	grunt.loadNpmTasks("grunt-mocha-phantomjs")
	grunt.loadNpmTasks("jstatic")

	grunt.registerTask("test", [
		"eslint:all",
		"mocha_phantomjs"
	])

	grunt.registerTask("website", [
		"jstatic:website",
		"copy:assets"
	])

	grunt.registerTask("publish", [
		"jstatic:distribution",
		"copy:publish",
		"copy:archive"
	])

	grunt.registerTask("build", [
		"test",
		"uglify",
		"website",
		"zip",
		"publish"
	])

	grunt.registerTask("default", ["build"])

	grunt.registerTask("sauce", [
		"saucelabs-browsers:all",
		"connect",
		"saucelabs"
	])
}
