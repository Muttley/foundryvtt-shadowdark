import { rollup } from "rollup";
import eslint from "gulp-eslint-new";
import gulp from "gulp";
import livereload from "gulp-livereload";
import gulpIf from "gulp-if";
import mergeStream from "merge-stream";
import nodeResolve from "@rollup/plugin-node-resolve";
import { delay } from "../system/src/testing/testUtils.mjs";

const SRC_LINT_PATHS = ["./system/shadowdark.mjs", "./system/src/"];

// Compile javascript source files into a single output file.
//
async function compileJavascript() {
	const bundle = await rollup({
		input: "./system/shadowdark.mjs",
		plugins: [nodeResolve()],
	});
	await bundle.write({
		file: "./system/shadowdark-compiled.mjs",
		format: "es",
		sourcemap: true,
		sourcemapFile: "./system/shadowdark.mjs",
	});
}
export const compile = compileJavascript;

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
			.pipe(
				gulpIf(
					file => file.eslint != null && file.eslint.fixed,
					gulp.dest(dest)
				)
			);
	});

	return mergeStream(tasks);
}
export const lint = lintJavascript;

// Wait
//
export const wait = async () => {
	await delay(1000);
	livereload.reload();
};

// Watch for file changes and lint when they do
//
export async function watchJavascriptUpdates() {
	livereload.listen();
	gulp.watch(SRC_LINT_PATHS, gulp.parallel(lint, compile, wait));
}
export const watchUpdates = watchJavascriptUpdates;
