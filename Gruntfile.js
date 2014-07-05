module.exports = function(grunt) {

	var version = "0.1.19"

	var inputFolder = "./docs"
	var tempFolder = "./temp"
	var archiveFolder = "./archive"
	var outputFolder = "../mithril"

	var guideLayout = "guide"
	var guide = [
		"auto-redrawing",
		"benchmarks",
		"community",
		"compiling-templates",
		"comparison",
		"components",
		"getting-started",
		"installation",
		"integration",
		"practices",
		"refactoring",
		"routing",
		"tools",
		"web-services",
	]
	var apiLayout = "api"
	var api = [
		"change-log",
		"roadmap",
		"how-to-read-signatures",
		"mithril",
		"mithril.computation",
		"mithril.deferred",
		"mithril.module",
		"mithril.prop",
		"mithril.redraw",
		"mithril.render",
		"mithril.request",
		"mithril.route",
		"mithril.sync",
		"mithril.trust",
		"mithril.withAttr",
		"mithril.xhr"
	]



	var md2htmlTasks = {}
	var makeTasks = function(layout, pages) {
		pages.map(function(name) {
			md2htmlTasks[name] = {
				options: {layout: inputFolder + "/layout/" + layout + ".html"},
				files: [{src: [inputFolder + "/" + name + ".md"], dest: tempFolder + "/" + name + ".html"}]
			}
		})
	}
	makeTasks("guide", guide)
	makeTasks("api", api)

	var currentVersionArchiveFolder = archiveFolder + "/v" + version
	grunt.initConfig({
		md2html: md2htmlTasks,
		uglify: {
			options: {banner: "/*\nMithril v" + version + "\nhttp://github.com/lhorie/mithril.js\n(c) Leo Horie\nLicense: MIT\n*/", sourceMap: true},
			mithril: {src: "mithril.js", dest: currentVersionArchiveFolder + "/mithril.min.js"}
		},
		concat: {
			test: {src: ["mithril.js", "./tests/test.js", "./tests/mock.js", "./tests/mithril-tests.js"], dest: currentVersionArchiveFolder + "/mithril-tests.js"}
		},
		zip: {
			distribution: {
				cwd: currentVersionArchiveFolder + "/",
				src: [currentVersionArchiveFolder + "/mithril.min.js", currentVersionArchiveFolder + "/mithril.min.map", currentVersionArchiveFolder + "/mithril.js"],
				dest: currentVersionArchiveFolder + "/mithril.min.zip"
			}
		},
		replace: {
			options: {force: true, patterns: [{match: /\.md/g, replacement: ".html"}, {match: /\$version/g, replacement: version}]},
			links: {expand: true, flatten: true, src: [tempFolder + "/**/*.html"], dest: currentVersionArchiveFolder + "/"},
			index: {src: inputFolder + "/layout/index.html", dest: currentVersionArchiveFolder + "/index.html"},
			commonjs: {expand: true, flatten: true, src: [inputFolder + "/layout/*.json"], dest: currentVersionArchiveFolder},
			cdnjs: {src: "deploy/cdnjs-package.json", dest: "../cdnjs/ajax/libs/mithril/package.json"}
		},
		copy: {
			style: {src: inputFolder + "/layout/style.css", dest: currentVersionArchiveFolder + "/style.css"},
			pages: {src: inputFolder + "/layout/pages.json", dest: currentVersionArchiveFolder + "/pages.json"},
			lib: {expand: true, cwd: inputFolder + "/layout/lib/", src: "./**", dest: currentVersionArchiveFolder + "/lib/"},
			tools: {expand: true, cwd: inputFolder + "/layout/tools/", src: "./**", dest: currentVersionArchiveFolder + "/tools/"},
			comparisons: {expand: true, cwd: inputFolder + "/layout/comparisons/", src: "./**", dest: currentVersionArchiveFolder + "/comparisons/"},
			unminified: {src: "mithril.js", dest: currentVersionArchiveFolder + "/mithril.js"},
			typescript: {src: "mithril.d.ts", dest: currentVersionArchiveFolder + "/mithril.d.ts"},
			publish: {expand: true, cwd: currentVersionArchiveFolder, src: "./**", dest: outputFolder},
			archive: {expand: true, cwd: currentVersionArchiveFolder, src: "./**", dest: outputFolder + "/archive/v" + version},
			cdnjs1: {src: currentVersionArchiveFolder + "/mithril.js", dest: "../cdnjs/ajax/libs/mithril/" + version + "/mithril.js"},
			cdnjs2: {src: currentVersionArchiveFolder + "/mithril.min.js", dest: "../cdnjs/ajax/libs/mithril/" + version + "/mithril.min.js"},
			cdnjs3: {src: currentVersionArchiveFolder + "/mithril.min.map", dest: "../cdnjs/ajax/libs/mithril/" + version + "/mithril.min.map"},
			jsdelivr1: {src: currentVersionArchiveFolder + "/mithril.js", dest: "../jsdelivr/files/mithril/" + version + "/mithril.js"},
			jsdelivr2: {src: currentVersionArchiveFolder + "/mithril.min.js", dest: "../jsdelivr/files/mithril/" + version + "/mithril.min.js"},
			jsdelivr3: {src: currentVersionArchiveFolder + "/mithril.min.map", dest: "../jsdelivr/files/mithril/" + version + "/mithril.min.map"}
		},
		execute: {
			tests: {src: [currentVersionArchiveFolder + "/mithril-tests.js"]}
		},
		qunit: {
			all: ['tests/e2e/**/*.html']
  		},
		connect: {
			server: {
				options: {
					port: 8000,
					base: '.'
				}
			}
		},
		clean: {
			options: {force: true},
			generated: [tempFolder]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks('grunt-execute');
	grunt.loadNpmTasks("grunt-md2html");
	grunt.loadNpmTasks("grunt-replace");
	grunt.loadNpmTasks('grunt-zip');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-connect');

	grunt.registerTask("build", ["test", "uglify", "zip", "md2html", "replace", "copy", "clean"]);
	grunt.registerTask("test", ["concat", "execute"]);
	grunt.registerTask('teste2e', ['connect', 'qunit']);
	grunt.registerTask("default", ["build"]);

};
