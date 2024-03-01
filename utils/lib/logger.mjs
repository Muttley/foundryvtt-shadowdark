import chalk from "chalk";

export default class Logger {

	static verbose = true;

	static error(message) {
		console.log(chalk.bold.red(message));
	}

	static info(message) {
		if (!this.verbose) return;
		console.log(chalk.cyan(message));
	}

	static log(message) {
		if (!this.verbose) return;
		console.log(message);
	}

	static warn(message) {
		console.log(chalk.hex("#ffa500").bold(message));
	}

}
