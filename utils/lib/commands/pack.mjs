import {globSync} from "glob";
import Datastore from "nedb-promises";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

import Logger from "../logger.mjs";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export function getCommand() {
	const systemPacksDir =  path.resolve(`${__dirname}/../../../system/packs`);
	const dataDir =  path.resolve(`${__dirname}/../../../data/packs`);

	return {
		command: "pack [options]",
		describe: "Pack Foundry VTT DB file from data in a specified directory",
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
			if (!argv.source) {
				Logger.error("You must specify a source");
				return;
			}

			if (!argv.outputDir) {
				Logger.error("You must specify an output directory");
				return;
			}

			const isDataDirectory = argv.source.endsWith(".db")
				&& fs.existsSync(argv.source)
				&& fs.lstatSync(argv.source).isDirectory();

			let dbDirectories = [argv.source];
			if (!isDataDirectory) {
				dbDirectories = globSync(`${argv.source}/*.db`);
			}

			for (const inputDbDirectory of dbDirectories) {
				const packFileName = path.basename(inputDbDirectory);

				if (!await fs.existsSync(argv.outputDir)) {
					fs.mkdirSync(argv.outputDir, {recursive: true});
				}

				const outputDbFile = path.join(argv.outputDir, packFileName);

				try {
					if (argv.nedb || argv.all) {
						await _packNeDb(inputDbDirectory, outputDbFile);
					}
					if (argv.leveldb || argv.all) {
						await _pathClassicLevelDb(inputDbDirectory, outputDbFile);
					}
				}
				catch(error) {
					Logger.error(error);
				}
			}
		},
	};

	async function _pathClassicLevelDb(inputDbDirectory, outputDbFile) {
		Logger.log(`ClassicLevelDb::Pack ${inputDbDirectory} into ${outputDbFile}`);
	}

	async function _packNeDb(inputDbDirectory, outputDbFile) {
		Logger.log(`NeDb::Pack ${inputDbDirectory} into ${outputDbFile}`);

		const dbFileExists = await fs.existsSync(outputDbFile)
			&& fs.lstatSync(outputDbFile).isFile();

		if (dbFileExists) {
			Logger.warn(`DB file ${outputDbFile} already exists and will be replaced`);
			fs.unlinkSync(outputDbFile);
		}

		const db = Datastore.create(outputDbFile);

		const files = fs.readdirSync(inputDbDirectory);
		let inserted = 0;
		for (const file of files) {
			const rawData = fs.readFileSync(path.join(inputDbDirectory, file));
			const dbEntry = file.endsWith(".yml") ? yaml.load(rawData) : JSON.parse(rawData);

			await db.insert(dbEntry);
			inserted++;
		}
		Logger.info(`Inserted ${inserted}/${files.length} records into ${outputDbFile}`);
	}
}
