import chalk from "chalk";

export default class Logger {

	static error(message) {
		console.log(chalk.bold.red(message));
	}

	static info(message) {
		console.log(chalk.cyan(message));
	}

	static log(message) {
		console.log(message);
	}

	static warn(message) {
		console.log(chalk.hex("#ffa500").bold(message));
	}

}
