import gulp from "gulp";
import {deleteAsync} from "del";

const PACKS_DST_PATH = "./system/packs";
const PACKS_SRC_PATHS = ["packs/*.db"];

function cleanupPacksFiles() {
	return deleteAsync(PACKS_DST_PATH);
}
export const clean = cleanupPacksFiles;

// Transform all the i18n language YAML files into JSON within the main system
// directory
//
function compilePacks() {
	const taskStream = gulp.src(PACKS_SRC_PATHS)
		.pipe(gulp.dest(PACKS_DST_PATH));

	return taskStream;
}
export const compile = compilePacks;

export function watchPacksUpdates() {
	gulp.watch(PACKS_SRC_PATHS, compile);
}
export const watchUpdates = watchPacksUpdates;
