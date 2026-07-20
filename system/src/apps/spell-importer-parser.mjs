import { parseSpell } from "shadowdark-parser";

function importError(details) {
	const error = new Error("Spell import validation failed");
	error.details = Array.isArray(details) ? details : [details];
	return error;
}

function escapeHtml(text) {
	return text.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("\"", "&quot;")
		.replaceAll("'", "&#39;");
}

function formatDescription(text) {
	return text.split(/\r?\n/).filter(Boolean).map(part =>
		`<p>${escapeHtml(part).replaceAll(/(\d+d\d+)/gi, "[[/r $&]]")}</p>`
	).join("");
}

function toConfigKey(value) {
	return value.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase());
}

function translateDuration(duration, durations) {
	const normalized = duration.trim().toLowerCase();
	if (["focus", "instant", "permanent"].includes(normalized)) {
		return {type: normalized, value: ""};
	}

	const realTime = normalized.match(/^(\d+)\s+(second|minute|hour)s?\s+real time$/);
	if (realTime) {
		const units = {second: "s", minute: "m", hour: "h"};
		return {type: "realTime", value: `${realTime[1]}${units[realTime[2]]}`};
	}

	const match = normalized.match(/^(\d+)\s+(round|turn|day)s?$/);
	if (match) {
		const type = `${match[2]}s`;
		if (type in durations) return {type, value: match[1]};
	}

	throw importError(`Unsupported spell duration: "${duration}"`);
}

function resolveClasses(classes, classDocuments) {
	const uuids = [];
	const unknown = [];
	for (const parsedClass of classes) {
		const classDocument = classDocuments.find(document =>
			document.name.toLowerCase() === parsedClass.class.toLowerCase()
		);
		if (!classDocument?.uuid) unknown.push(parsedClass.class);
		else uuids.push(classDocument.uuid);
	}
	if (unknown.length > 0) {
		throw importError(unknown.map(name => `Unknown spell class: "${name}"`));
	}
	return uuids;
}

/**
 * Convert a pasted Shadowdark spell into Foundry Spell item data.
 * @param {string} spellText
 * @param {object[]} classDocuments
 * @param {object} config Foundry configuration values needed for validation.
 * @returns {object}
 */
export function translateSpell(spellText, classDocuments, config) {
	let spell;
	try {
		spell = parseSpell(spellText);
	}
	catch(error) {
		throw importError(error instanceof Error ? error.message : String(error));
	}

	if (spell.type !== "spell" || !Number.isInteger(spell.tier)) {
		throw importError("Could not parse a valid spell tier.");
	}

	const range = toConfigKey(spell.range);
	if (!(range in config.spellRanges)) {
		throw importError(`Unsupported spell range: "${spell.range}"`);
	}

	return {
		name: spell.name.titleCase(),
		img: config.spellImage,
		type: "Spell",
		system: {
			class: resolveClasses(spell.classes, classDocuments),
			description: formatDescription(spell.description),
			duration: translateDuration(spell.duration, config.spellDurations),
			range,
			tier: spell.tier,
		},
	};
}
