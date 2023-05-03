import Datastore from "nedb-promises";
import {globSync} from "glob";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

import Logger from "./logger.mjs";

export default class PackHandler {

	constructor(options) {
		this.destination = options.destination;
		this.inputFormat = options.inputFormat;
		this.outputFormat = options.outputFormat;
		this.source = options.source;
	}

	async pack() {
		switch (this.outputFormat) {
			case "leveldb":
				return await this._packLevelDb();
			case "nedb":
				return await this._packNeDb();
			default:
				Logger.error(`Unknown output format ${this.inputFormat}`);
		}
	}

	async unpack() {
		switch (this.inputFormat) {
			case "leveldb":
				return await this._unpackLevelDb();
			case "nedb":
				return await this._unpackNeDb();
			default:
				Logger.error(`Unknown input format ${this.inputFormat}`);
		}
	}

	async _packLevelDb() {
		throw new Error("Implement Me!");
	}

	async _packNeDb() {
		throw new Error("Implement Me!");
	}

	async _unpackLevelDb() {
		throw new Error("Implement Me!");
	}

	async _unpackNeDb() {
		if (!this.source) {
			Logger.error("You must specify a source");
			return;
		}

		if (!["json", "yaml"].includes(this.outputFormat)) {
			Logger.error(`Unknown output format: ${this.outputFormat}`);
			return;
		}

		const isDirectory = fs.existsSync(this.source)
			&& fs.lstatSync(this.source).isDirectory();

		let dbFiles = [this.source];
		if (isDirectory) {
			dbFiles = globSync(`${this.source}/*.db`);
		}

		for (const dbFile of dbFiles) {
			const db = Datastore.create(dbFile);

			const basename = path.basename(dbFile);

			const outputDir = path.join(this.destination, basename);

			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, {recursive: true});
			}

			const docs = await db.find({});

			for (const doc of docs) {
				const name = doc.name
					? `${doc.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`
					: doc._id;

				let fileName;
				switch (this.outputFormat) {
					case "yaml":
						fileName = `${outputDir}/${name}.yml`;
						fs.writeFileSync(fileName, yaml.dump(doc));
					case "json":
						fileName = `${outputDir}/${name}.json`;
						fs.writeFileSync(fileName, JSON.stringify(doc, null, 2));
				}
				Logger.log(`${fileName} written`);
			}
		}
	}
}
