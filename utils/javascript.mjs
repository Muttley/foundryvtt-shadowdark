import gulp from "gulp";
import eslint from "gulp-eslint-new";
import gulpIf from "gulp-if";
import mergeStream from "merge-stream";
import nodeResolve from "@rollup/plugin-node-resolve";
import { rollup } from "rollup";
import del from "del";

const SRC_LINT_PATHS = ["./system/shadowdark.mjs", "./system/src/"];

function cleanupJavascriptFiles() {
	return del("./system/shadowdark-compiled.mjs*");
}
export const clean = cleanupJavascriptFiles;

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

export function watchUpdates() {
	gulp.watch(SRC_LINT_PATHS, lint);
}
