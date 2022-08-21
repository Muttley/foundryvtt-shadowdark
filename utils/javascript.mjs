import gulp from "gulp";
import eslint from "gulp-eslint-new";
import gulpIf from "gulp-if";
import mergeStream from "merge-stream";

const SRC_LINT_PATHS = ["./system/shadowdark.mjs", "./system/src/"];

// Use eslint to check for formatting issues
//
function lintJavascript() {
	const tasks = SRC_LINT_PATHS.map(path => {
		const src = path.endsWith("/")
			? `${path}**/*.mjs`
			: path;

		const dest = path.endsWith("/")
			? path
			: `${path.split("/").slice(0, -1).join("/")}/`;

		return gulp
			.src(src)
			.pipe(eslint({ fix: false }))
			.pipe(eslint.format())
			.pipe(gulpIf(file => file.eslint != null && file.eslint.fixed, gulp.dest(dest)));
	});

	return mergeStream(tasks);
}
export const lint = lintJavascript;

// Watch for file changes and lint when they do
//
export function watchUpdates() {
	gulp.watch(SRC_LINT_PATHS, lint);
}
