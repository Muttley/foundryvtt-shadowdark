import { parseMagicItem } from "shadowdark-parser";

function importError(details) {
	const error = new Error("Magic item import validation failed");
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

function formatDescription(flavorText, traits) {
	const parts = [];
	if (flavorText) parts.push(`<p><em>${escapeHtml(flavorText)}</em></p>`);
	for (const trait of traits) {
		parts.push(`<p><strong>${escapeHtml(trait.type)}.</strong> ${escapeHtml(trait.text)}</p>`);
	}
	return parts.join("");
}

/**
 * Convert pasted Shadowdark magic-item text into neutral Foundry translation data.
 * @param {string} itemText
 * @param {object[]} benefitEffectPatterns
 * @returns {object}
 */
export function translateMagicItem(itemText, benefitEffectPatterns) {
	if (!itemText.trim()) throw importError("Input is empty");

	let item;
	try {
		item = parseMagicItem(itemText.replace(/- *\r?\n/g, "-"));
	}
	catch(error) {
		throw importError(error instanceof Error ? error.message : String(error));
	}

	if (item.type !== "magicItem") {
		throw importError("Could not parse a magic item.");
	}

	const traits = item.traits.map(trait => ({type: trait.name, text: trait.description}));
	const bonus = traits.find(trait => trait.type.toLowerCase() === "bonus");
	const bonusMatch = bonus?.text.match(/^\+(\d+)/);
	const bonusHint = bonusMatch
		? {value: Number(bonusMatch[1]), text: bonus.text}
		: null;
	const benefitEffects = [];
	for (const trait of traits) {
		for (const entry of benefitEffectPatterns) {
			const match = trait.text.match(entry.pattern);
			if (match) {
				benefitEffects.push({effect: entry.effect, value: Number(match.groups.value)});
			}
		}
	}

	return {
		benefitEffects,
		bonusHint,
		description: formatDescription(item.description, traits),
		flavorText: item.description,
		name: item.name.titleCase(),
		traits,
	};
}
