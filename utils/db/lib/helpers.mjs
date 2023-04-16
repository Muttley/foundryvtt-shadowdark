export const PackError = message => {
	console.error(`Error: ${message}`);
	process.exit(1);
};
