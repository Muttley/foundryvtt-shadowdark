export default class Logger {
	static DEBUG_ENABLED = null;

	static SYSTEM_ID = "shadowdark";

	static SYSTEM_NAME = "Shadowdark";

	static debug(...args) {
		if (Logger.DEBUG_ENABLED === null) {
			Logger.DEBUG_ENABLED = game.settings.get(Logger.SYSTEM_ID, "debugEnabled");
		}

		if (Logger.DEBUG_ENABLED) console.debug(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static error(...args) {
		console.error(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static log(...args) {
		console.log(`${Logger.SYSTEM_NAME} |`, ...args);
	}

	static warn(...args) {
		console.warn(`${Logger.SYSTEM_NAME} |`, ...args);
	}
}
