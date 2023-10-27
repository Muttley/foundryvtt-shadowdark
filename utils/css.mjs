import gulp from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import {deleteAsync} from "del";

const sass = gulpSass(dartSass);

const CSS_DST_PATH  = ["./system/css"];
const SCSS_SRC_PATH = ["./scss/shadowdark.scss"];
const SCSS_WATCH_PATHS = ["./scss/**/*.scss"];

function cleanupCssFiles() {
	return deleteAsync(CSS_DST_PATH);
}
export const clean = cleanupCssFiles;

function compileSass() {
	return gulp.src(SCSS_SRC_PATH)
		.pipe(sass.sync().on("error", sass.logError))
		.pipe(gulp.dest(CSS_DST_PATH));
}
export const compile = compileSass;

export function watchScssUpdates() {
	gulp.watch(SCSS_WATCH_PATHS, compile);
}
export const watchUpdates = watchScssUpdates;
