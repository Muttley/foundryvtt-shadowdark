import gulp from "gulp";
import yaml from "gulp-yaml";
import {deleteAsync} from "del";

const LANG_DST_PATH = "./system/i18n";
const LANG_SRC_PATHS = ["i18n/*.yaml"];

function cleanupLangFiles() {
	return deleteAsync(LANG_DST_PATH);
}
export const clean = cleanupLangFiles;

// Transform all the i18n language YAML files into JSON within the main system
// directory
//
function compileLangs(cb) {
	const emptyYamlMatch = /YAML loader cannot load empty content/;

	const taskStream = gulp.src(LANG_SRC_PATHS)
		.pipe(yaml({ space: 2 })
			.on("error", e => {
				if (!emptyYamlMatch.exec(e.message)) {
					const message = e.message.split(/\r?\n/)[0];
					console.error(message);
					taskStream.emit("end");
				}
				cb();
			})
		)
		.pipe(gulp.dest(LANG_DST_PATH));

	return taskStream;
}
export const compile = compileLangs;

export function watchLangUpdates() {
	gulp.watch(LANG_SRC_PATHS, compile);
}
export const watchUpdates = watchLangUpdates;
