const args   = require("yargs").argv;
const del    = require("del");
const eslint = require("gulp-eslint-new");
const gulp   = require("gulp");
const gulpIf = require("gulp-if");
const log    = require("fancy-log");
const sass   = require("gulp-sass")(require("sass"));
const yaml   = require("gulp-yaml");

const mergeStream = require("merge-stream");

const DST_CSS_PATHS  = ["./system/css"];
const DST_LANG_PATHS = ["./system/i18n"];

const ALL_DST_PATHS = [...DST_CSS_PATHS, ...DST_LANG_PATHS];

const SRC_LANG_PATHS = ["i18n/*.yaml"];
const SRC_LINT_PATHS = ["./system/shadowdark.js", "./shadowdark/module/"];
const SRC_SCSS_PATHS = ["./scss/**/*.scss"];

// Builds everything
//
const build = gulp.series(langs, linter, scss);

// Clean up all generated files
//
function clean() {
	return del(ALL_DST_PATHS);
}

// Transform all the i18n language YAML files into JSON within the main system
// directory
//
function langs(cb) {
	const emptyYamlMatch = /YAML loader cannot load empty content/;

	const taskStream = gulp.src(SRC_LANG_PATHS)
		.pipe(yaml({ space: 2 })
			.on("error", e => {
				if (!emptyYamlMatch.exec(e.message)) {
					const message = e.message.split(/\r?\n/)[0];
					log.error(message);
					taskStream.emit("end");
				}
				cb();
			})
		)
		.pipe(gulp.dest(DST_LANG_PATHS));

	return taskStream;
}

// Check for formatting/syntactical errors in the system source code
//
function linter() {
	const applyFixes = !!args.fix;

	const tasks = SRC_LINT_PATHS.map(path => {
		const src = path.endsWith("/")
			? `${path}**/*.js`
			: path;

		const dest = path.endsWith("/")
			? path
			: `${path.split("/").slice(0, -1).join("/")}/`;

		return gulp
			.src(src)
			.pipe(eslint({ fix: applyFixes }))
			.pipe(eslint.format())
			.pipe(gulpIf(file => file.eslint != null && file.eslint.fixed, gulp.dest(dest)));
	});

	return mergeStream(tasks);
}

// Compile the SCSS into CSS within the main system directory
//
function scss() {
	return gulp.src(SRC_SCSS_PATHS)
		.pipe(sass.sync().on("error", sass.logError))
		.pipe(gulp.dest(DST_CSS_PATHS));
}

// Watches everything and rebuilds on file changes / additions
//
function watch() {
	gulp.watch(SRC_LANG_PATHS, langs);
	gulp.watch(SRC_SCSS_PATHS, scss);
	gulp.watch(SRC_LINT_PATHS, linter);
}

exports.build   = build;
exports.clean   = clean;
exports.css     = gulp.series(scss);
exports.default = build;
exports.lang    = gulp.series(langs);
exports.lint    = gulp.series(linter);
exports.watch   = gulp.series(build, watch);
