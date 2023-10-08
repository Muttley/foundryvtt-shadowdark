import gulp from "gulp";

import * as css from "./utils/css.mjs";
import * as lang from "./utils/lang.mjs";
import * as javascript from "./utils/javascript.mjs";
import * as packs from "./utils/packs.mjs";

export default gulp.series(
	gulp.parallel(
		css.compile,
		lang.compile,
		javascript.lint,
		javascript.compile
	),

	gulp.parallel(
		css.watchUpdates,
		lang.watchUpdates,
		javascript.watchUpdates
	)
);

export const build = gulp.parallel(
	css.compile,
	lang.compile,
	javascript.lint,
	javascript.compile,
	packs.compile
);

export const clean = gulp.parallel(css.clean, lang.clean, packs.clean);
export const compileCss = gulp.series(css.compile);
export const compileLang = gulp.series(lang.compile);
export const compilePacks = gulp.series(packs.compile);
export const lintJs = gulp.series(javascript.lint);
