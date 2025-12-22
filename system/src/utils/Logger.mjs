export default class Logger {
	static DEBUG_ENABLED = null;

	static debug(...args) {
		if (Logger.DEBUG_ENABLED === null) {
			Logger.DEBUG_ENABLED = game.settings.get(SYSTEM_ID, "debugEnabled");
		}

		if (Logger.DEBUG_ENABLED) console.debug(`${SYSTEM_NAME} |`, ...args);
	}

	static error(...args) {
		console.error(`${SYSTEM_NAME} |`, ...args);
	}

	static log(...args) {
		console.log(`${SYSTEM_NAME} |`, ...args);
	}

	static warn(...args) {
		console.warn(`${SYSTEM_NAME} |`, ...args);
	}
}
