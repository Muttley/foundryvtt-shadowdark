import Datastore from "nedb-promises";
import fs from "fs";
import {globSync} from "glob";
import path from "path";
import yaml from "js-yaml";

export function getCommand() {

	return {
		command: "unpack [dbFile] [options]",
		describe: "Unpack Foundry VTT DB file to specified directory",
		builder: yargs => {
			yargs.option("source", {
				alias: "s",
				describe: "The source to unpack, can be a directory or file",
				type: "string",
			});

			yargs.option("outputDir", {
				alias: "o",
				default: "./data/packs",
				describe: "The output directory to use",
				type: "string",
			});

			yargs.option("yaml", {
				describe: "Whether to use YAML instead of JSON",
				type: "boolean",
			});
		},
		handler: async argv => {
			if (!argv.source) {
				console.error("You must specify a source");
				return;
			}

			const isDirectory = fs.existsSync(argv.source)
				&& fs.lstatSync(argv.source).isDirectory();

			let dbFiles = [argv.source];
			if (isDirectory) {
				dbFiles = globSync(`${argv.source}/*.db`);
			}

			for (const dbFile of dbFiles) {
				const db = Datastore.create(dbFile);

				const basename = path.basename(dbFile);

				const outputDir = path.join(argv.outputDir, basename);

				console.log(dbFile);
				console.log(basename);
				console.log(outputDir);

				if (!fs.existsSync(outputDir)) {
					fs.mkdirSync(outputDir, {recursive: true});
				}

				const docs = await db.find({});

				for (const doc of docs) {
					const name = doc.name
						? `${doc.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
						: doc._id;

					let fileName;
					if ( argv.yaml ) {
						fileName = `${outputDir}/${name}.yml`;
						fs.writeFileSync(fileName, yaml.dump(doc));
					}
					else {
						fileName = `${outputDir}/${name}.json`;
						fs.writeFileSync(fileName, JSON.stringify(doc, null, 2));
					}
					console.log(`Wrote ${fileName}`);
				}
			}
		},
	};

}
