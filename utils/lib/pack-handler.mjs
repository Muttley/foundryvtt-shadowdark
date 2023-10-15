import {ClassicLevel} from "classic-level";
import {globSync} from "glob";
import Datastore from "nedb-promises";
import fs, { readdirSync } from "fs";
import path from "path";
import yaml from "js-yaml";

import Logger from "./logger.mjs";

import stringify from "json-stable-stringify-pretty";

export default class PackHandler {

	constructor(options) {
		this.destination = options.destination;
		this.inputFormat = options.inputFormat;
		this.outputFormat = options.outputFormat;
		this.source = options.source;
		Logger.verbose = options.verbose ?? false;
	}

	async pack() {
		if (!this._settingsOk("pack")) return;

		switch (this.outputFormat) {
			case "leveldb":
				return await this._packLevelDb();
			case "nedb":
				return await this._packNeDb();
		}
	}

	async unpack() {
		if (!this._settingsOk("unpack")) return;

		switch (this.inputFormat) {
			case "leveldb":
				return await this._unpackLevelDb();
			case "nedb":
				return await this._unpackNeDb();
		}
	}

	_isFileLocked(filepath) {
		try {
			// Try to open the file for writing
			const fd = fs.openSync(filepath, "w");

			// If the file was successfully opened, it is not locked
			fs.closeSync(fd);
			return false;
		}
		catch(error) {
			// If the file could not be opened, it is locked
			if (error.code === "EBUSY") {
				return true;
			}
			else {
				throw error;
			}
		}
	}

	_settingsOk(task) {
		let ok = true;

		if (!this.source) {
			Logger.error("You must specify a source");
			ok = false;
		}

		if (!this.source) {
			Logger.error("You must specify a source");
			ok = false;
		}

		let inputFormats = [];
		let outputFormats = [];

		if (task === "pack") {
			inputFormats = ["json", "yaml"];
			outputFormats = ["leveldb", "nedb"];
		}
		else if (task === "unpack") {
			inputFormats = ["leveldb", "nedb"];
			outputFormats = ["json", "yaml"];
		}

		if (!outputFormats.includes(this.outputFormat)) {
			Logger.error(`Unknown output format: ${this.outputFormat}`);
			ok = false;
		}

		if (!inputFormats.includes(this.inputFormat)) {
			Logger.error(`Unknown input format: ${this.inputFormat}`);
			ok = false;
		}

		return ok;
	}

	async _packLevelDb() {
		const isDataDirectory = this.source.endsWith(".db")
			&& fs.existsSync(this.source)
			&& fs.lstatSync(this.source).isDirectory();

		let dbDirectories = [this.source];
		if (!isDataDirectory) {
			dbDirectories = globSync(`${this.source}/*.db`);
		}

		for (const inputDbDirectory of dbDirectories) {
			const packFileName = path.basename(inputDbDirectory).replace(".db", "");

			if (!await fs.existsSync(this.destination)) {
				fs.mkdirSync(this.destination, {recursive: true});
			}

			const outputDbFile = path.join(this.destination, packFileName);

			Logger.info(`LevelDb::Pack ${inputDbDirectory} into ${outputDbFile}`);

			const dbFileExists = await fs.existsSync(outputDbFile)
				&& fs.lstatSync(outputDbFile).isFile();

			if (dbFileExists) {
				Logger.warn(`DB file ${outputDbFile} already exists and will be replaced`);
				fs.unlinkSync(outputDbFile);
			}

			const db = new ClassicLevel(outputDbFile, {keyEncoding: "utf8", valueEncoding: "json"});
			const batch = db.batch();

			const files = fs.readdirSync(inputDbDirectory);
			const seenKeys = new Set();
			let inserted = 0;
			for (const file of files) {
				const rawData = fs.readFileSync(path.join(inputDbDirectory, file));
				const dbEntry = file.endsWith(".yml") ? yaml.load(rawData) : JSON.parse(rawData);

				let key = null;
				if (dbEntry._key) {
					key = dbEntry._key;

					delete dbEntry._key;

					seenKeys.add(key);
				}

				if (key !== null) {
					batch.put(key, dbEntry);
				}
				else {
					batch.put(dbEntry);
				}
				inserted++;
			}

			for (const key of await db.keys().all()) {
				if (!seenKeys.has(key)) {
					batch.del(key);
					Logger.info(`Removed ${key}`);
				}
			}
			await batch.write();
			await db.close();

			Logger.info(`Inserted ${inserted}/${files.length} records into ${outputDbFile}`);
		}
	}

	async _packNeDb() {
		const isDataDirectory = this.source.endsWith(".db")
			&& fs.existsSync(this.source)
			&& fs.lstatSync(this.source).isDirectory();

		let dbDirectories = [this.source];
		if (!isDataDirectory) {
			dbDirectories = globSync(`${this.source}/*.db`);
		}

		for (const inputDbDirectory of dbDirectories) {
			const packFileName = path.basename(inputDbDirectory);

			if (!await fs.existsSync(this.destination)) {
				fs.mkdirSync(this.destination, {recursive: true});
			}

			const outputDbFile = path.join(this.destination, packFileName);

			Logger.info(`NeDb::Pack ${inputDbDirectory} into ${outputDbFile}`);

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

	async _unpackLevelDb() {
		const isDirectory = fs.existsSync(this.source)
			&& fs.lstatSync(this.source).isDirectory();

		const lockPath = path.join(this.source, "LOCK");

		const isLevelDbDirectory = isDirectory && fs.existsSync(lockPath);

		let compendiumDirs = [this.source];
		if (!isLevelDbDirectory) {
			compendiumDirs = readdirSync(this.source, {withFileTypes: true})
				.filter(entry => entry.isDirectory())
				.map(entry => path.join(this.source, entry.name));

			compendiumDirs = compendiumDirs.filter(entry => {
				return fs.existsSync(path.join(entry, "LOCK"));
			});
		}

		for (const compendiumDir of compendiumDirs) {
			const db = new ClassicLevel(
				compendiumDir,
				{
					keyEncoding: "utf8",
					valueEncoding: "json",
				}
			);
			const basename = path.basename(compendiumDir);

			const outputDir = path.join(this.destination, `${basename}.db`);

			if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir, {recursive: true});
			}

			for await (const [key, value] of db.iterator()) {
				const name = value.name
					? `${value.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}__${value._id}`
					: key;

				value._key = key;

				// Tidy up some junky top-level fields we don't want to store
				delete value._stats;
				delete value.ownership;
				delete value.flags;
				delete value.sort;

				const basefileName = `${outputDir}/${name}`;
				switch (this.outputFormat) {
					case "yaml":
						Logger.log(`Writing ${basefileName}.yml`);
						fs.writeFileSync(`${basefileName}.yml`, yaml.dump(value));
						break;
					case "json":
						Logger.log(`Writing ${basefileName}.json`);

						let jsonData = stringify(value, {space: "\t", undef: true});
						jsonData += "\n";

						fs.writeFileSync(`${basefileName}.json`, jsonData);
						break;
				}
			}

			await db.close();
		}
	}

	async _unpackNeDb() {
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
					? `${doc.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}__${doc._id}`
					: doc._id;

				// Tidy up some junky top-level fields we don't want to store
				delete doc._stats;
				delete doc.ownership;
				delete doc.flags;
				delete doc.sort;

				const basefileName = `${outputDir}/${name}`;
				switch (this.outputFormat) {
					case "yaml":
						Logger.log(`Writing ${basefileName}.yml`);
						let yamlData = yaml.dump(doc);
						yamlData += "\n";

						fs.writeFileSync(`${basefileName}.yml`, yamlData);
						break;
					case "json":
						Logger.log(`Writing ${basefileName}.json`);

						let jsonData = stringify(doc, {space: "\t", undef: true});
						jsonData += "\n";

						fs.writeFileSync(`${basefileName}.json`, jsonData);
						break;
				}
			}
		}
	}
}
