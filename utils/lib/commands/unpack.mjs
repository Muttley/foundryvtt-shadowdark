import path from "path";
import * as url from "url";

import PackHandler from "../pack-handler.mjs";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export function getCommand() {
	const systemPacksDir = path.resolve(`${__dirname}/../../../system/packs`);
	const dataDir = path.resolve(`${__dirname}/../../../data/packs`);

	return {
		command: "unpack [options]",
		describe: "Unpack Foundry VTT DB file to specified directory",
		builder: yargs => {
			yargs.option("source", {
				alias: "s",
				default: systemPacksDir,
				describe: "The source to unpack, can be a directory or file",
				type: "string",
			});

			yargs.option("destination", {
				alias: "d",
				default: dataDir,
				describe: "The output directory to use",
				type: "string",
			});

			yargs.option("outputFormat", {
				alias: "o",
				default: "json",
				describe: "Either 'yaml' or 'json'",
				type: "string",
			});

			yargs.option("inputFormat", {
				alias: "i",
				default: "nedb",
				describe: "Either 'nedb' or 'leveldb'",
				type: "string",
			});
		},
		handler: async argv => {
			const packer = new PackHandler(argv);
			return await packer.unpack();
		},
	};
}
