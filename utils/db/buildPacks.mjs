import fs from "fs";
import path from "path";
import url from "url";
import { isObject } from "util";

const DEST_DIR="system/packs/compiled";
const PACK_ID="shadowdark";

const cwd = url.fileURLToPath(new URL(".", import.meta.url));
const packsDataPath = path.resolve(cwd, "../../system/assets/db");
const destinationPath = path.resolve(cwd, `../../${DEST_DIR}`);
const packDirPaths = fs.readdirSync(packsDataPath)
	.map(dirName => path.resolve(cwd, packsDataPath, dirName));

// Load all packs into memory
const packs = packDirPaths.map(p => {
	const filenames = fs.readdirSync(p);
	const filePaths = filenames.map(f => path.resolve(p, f));

	const parsedData = filePaths.map(filePath => {
		const jsonString = fs.readFileSync(filePath, "utf-8");
		const packSource = (() => {
			try {
				return JSON.parse(jsonString);
			}
			catch(error) {
				if (error instanceof Error) {
					throw PackError(`File ${filePath} could not be parsed: ${error.message}`);
				}
			}
		})();

		const documentName = packSource?.name;
		if (documentName === undefined) {
			throw PackError(`Document contain in ${filePath} has no name.`);
		}

		const filenameForm = slugify(documentName).concat(".json");
		if (path.basename(filePath) !== filenameForm) {
			throw PackError(`Filename at ${filePath} does not reflect document name (should be ${filenameForm})`);
		}

		return packSource;
	});

	const dbFilename = path.basename(p);
	return true;
});

function createPack(packDir, parsedData) {
	const systemJson = getDataFromSystemJson();
	const metadata = systemJson.packs.find(
		pack => path.basename(pack.path) === path.basename(packDir)
	);
	if (metadata === undefined) {
		throw PackError(`Compendium at ${packDir} has no metadata in the local system.json file.`);
	}
	systemId = metadata.system;
	packId = metadata.name;
	documentType = metadata.type;

	if (!isPackData(parsedData)) {
		throw PackError(`Data supplied for ${packId} does not resemble Foundry document source data.`);
	}

	// @todo: Continue row 78 in https://github.com/foundryvtt/pf2e/blob/master/packs/scripts/lib/compendium-pack.ts
}

function isPackData(parsedData, packId) {
	return parsedData.every((maybeDocSource) => isDocumentSource(maybeDocSource, packId));
}

function isDocumentSource(maybeDocSource, packId) {
	if (!maybeDocSource.isObject()) return false;
	const checks = Object.entries({
		name: data => typeof data.name === "string",
	});

	const failedChecks = checks
		.map(([key, check]) => (check(maybeDocSource) ? null : key))
		.filter(key => key !== null);

	if (failedChecks.length > 0) {
		throw PackError(
			`Document source in (${packId}) has invalid or missing keys: ${failedChecks.join(", ")}`
		);
	}

	return true;
}

function getDataFromSystemJson() {
	const cwd = url.fileURLToPath(new URL(".", import.meta.url));
	const systemFile = path.resolve(cwd, "../../system/system.json");
	const systemJson = JSON.parse(fs.readFileSync(systemFile, "utf-8"));
	return systemJson;
}

function slugify(str) {
	str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
	str = str.toLowerCase(); // convert string to lowercase
	str = str.replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
		.replace(/\s+/g, "-") // replace spaces with hyphens
		.replace(/-+/g, "-"); // remove consecutive hyphens
	return str;
}

const PackError = message => {
	console.error(`Error: ${message}`);
	process.exit(1);
};
