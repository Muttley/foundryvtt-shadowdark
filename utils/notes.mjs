import fs from "fs";
import { marked } from "marked";

import stringify from "json-stable-stringify-pretty";

const NOTES_SRC_PATH = "./RELEASE_NOTES.md";
const JOURNAL_JSON =
	"./data/packs/documentation.db/release_notes__CG5T5H4KazrCJ9nt.json";

const WIKI_URL =
	"https://raw.githubusercontent.com/wiki/Muttley/foundryvtt-shadowdark/Data-Model-References.md";

const WIKI_SECTIONS = [
	{
		file: "./data/packs/documentation.db/actor_data__y3ovQbxPQvCEci0L.json",
		section: "Actor Data",
	},
	{
		file: "./data/packs/documentation.db/rolling__mgSr0zDq4ZWjExKf.json",
		section: "Rolling",
	},
	{
		file: "./data/packs/documentation.db/hooks__VqvDOWrKHMcgndn2.json",
		section: "Hooks",
	},
];

function compileReleaseNotes() {
	const source = fs.readFileSync(NOTES_SRC_PATH, "utf8");
	const html = marked.parse(source);

	const journalJson = fs.readFileSync(JOURNAL_JSON, "utf8");
	const journal = JSON.parse(journalJson);
	journal.text.content = `${html}`;

	let jsonData = stringify(journal, {space: "\t", undef: true});
	jsonData += "\n";

	fs.writeFileSync(JOURNAL_JSON, jsonData);
}

async function compileWikiDocs() {
	const response = await fetch(WIKI_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch wiki page: HTTP ${response.status}`);
	}

	// parse each section of the wiki page
	const sections = {};
	let currentSection = null;
	let currentLines = [];

	for (const line of (await response.text()).replace(/\r\n/g, "\n").split("\n")) {
		if (line.startsWith("# ")) {
			if (currentSection !== null) {
				sections[currentSection] = currentLines.join("\n").trim();
			}
			currentSection = line.slice(2).trim();
			currentLines = [];
		}
		else if (currentSection !== null) {
			currentLines.push(line);
		}
	}

	if (currentSection !== null) {
		sections[currentSection] = currentLines.join("\n").trim();
	}

	for (const { file, section } of WIKI_SECTIONS) {
		const body = sections[section];

		// Check for new sections in the wiki and ignore if there isn't matching file
		if (!body) {
			console.warn(`Wiki section "${section}" not found — skipping.`);
			continue;
		}

		// parse markdown to HTML using marked
		const html = marked.parse(body);

		const journalJson = fs.readFileSync(file, "utf8");
		const journal = JSON.parse(journalJson);
		journal.text.content = `${html}`;

		let jsonData = stringify(journal, {space: "\t", undef: true});
		jsonData += "\n";

		fs.writeFileSync(file, jsonData);
	}
}

async function compile(cb) {
	compileReleaseNotes();
	await compileWikiDocs();
	cb();
}

export { compile };
