import { parseStatblock } from "shadowdark-parser";

const ALIGNMENTS = {
	Lawful: "lawful",
	Neutral: "neutral",
	Chaotic: "chaotic",
};

const CRITICAL = {
	failureThreshold: 1,
	multiplier: 2,
	successThreshold: 20,
};

function importError(details) {
	const error = new Error("Monster import validation failed");
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
	return `<p>${escapeHtml(text).replaceAll(/(\d+d\d+)/gi, "[[/r $&]]")}</p>`;
}

function toConfigKey(value) {
	return value.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase());
}

function getNumber(value, label) {
	const number = Number(value);
	if (!Number.isInteger(number)) {
		throw importError(`${label} must be an integer: "${value}"`);
	}
	return number;
}

function getConfiguredKey(value, choices, label) {
	const key = toConfigKey(value);
	if (!(key in choices)) {
		throw importError(`Unsupported ${label}: "${value}"`);
	}
	return key;
}

function translateDamage(damage) {
	const parts = damage.split("+").map(part => part.trim()).filter(Boolean);
	const value = parts.shift() ?? "";
	const dice = value.match(/^(\d+)d\d+$/i);
	let damageBonus = 0;
	const special = [];

	for (const part of parts) {
		if (/^-?\d+$/.test(part)) {
			damageBonus = Number(part);
		}
		else {
			special.push(part);
		}
	}

	return {
		damage: {
			...(dice ? {numDice: Number(dice[1])} : {}),
			special: special.join(", "),
			value,
		},
		damageBonus,
	};
}

function translateAttack(attack, config) {
	const attackBonus = attack.bonus ? getNumber(attack.bonus, `Attack bonus for ${attack.name}`) : 0;
	const ranges = attack.range
		? attack.range.split(/[,/]/).map(range => getConfiguredKey(range.trim(), config.ranges, "attack range"))
		: [];
	const attackData = {
		name: attack.name,
		type: "NPC Special Attack",
		system: {
			attack: {num: attack.quantity ? getNumber(attack.quantity, `Attack quantity for ${attack.name}`) : 1},
			bonuses: {attackBonus},
			ranges,
		},
	};

	if (attack.damage) {
		const parsedDamage = translateDamage(attack.damage);
		attackData.type = "NPC Attack";
		attackData.system.attackType = "physical";
		attackData.system.damage = parsedDamage.damage;
		attackData.system.bonuses = {
			attackBonus,
			critical: CRITICAL,
			damageBonus: parsedDamage.damageBonus,
		};
		if (ranges.length === 0) ranges.push("close");
	}

	return attackData;
}

function findSpellRange(text, config) {
	const normalized = text.toLowerCase();
	for (const range of Object.keys(config.spellRanges)) {
		const words = range.replace(/([A-Z])/g, " $1").toLowerCase();
		if (normalized.includes(words)) return range;
	}
	return "";
}

function translateSpellTrait(trait, match, config) {
	const dc = trait.description.match(/\bDC (\d+)\b/i);
	if (!dc) throw importError(`Spell trait is missing a DC: "${trait.name}"`);

	const ability = match[2].toLowerCase();
	if (!config.abilityKeys.includes(ability)) {
		throw importError(`Unsupported spellcasting ability: "${match[2]}"`);
	}

	const description = trait.description.replace(/^DC \d+\.\s*/i, "");
	const rounds = description.match(/\b(\d+) rounds?\b/i);
	const days = description.match(/\b(\d+) days?\b/i);
	let duration = {type: "instant", value: -1};
	if (rounds) duration = {type: "rounds", value: rounds[1]};
	else if (days) duration = {type: "days", value: days[1]};
	else if (/\bfocus\b/i.test(description)) duration = {type: "focus", value: -1};

	return {
		ability,
		item: {
			name: match[1].trim(),
			type: "Spell",
			system: {
				description: formatDescription(description),
				duration,
				range: findSpellRange(description, config),
				tier: Number(dc[1]) - 10,
			},
		},
	};
}

function formatAttack(attack) {
	return [
		attack.quantity,
		attack.name,
		attack.range ? `(${attack.range})` : "",
		attack.bonus ?? "",
		attack.damage ? `(${attack.damage})` : "",
	].filter(Boolean).join(" ");
}

function generateNotes(monster) {
	const stats = [
		`AC ${monster.ac}${monster.armor ? ` (${monster.armor})` : ""}`,
		`HP ${monster.hp}`,
		`ATK ${monster.attacks.map(group => group.map(formatAttack).join(" and ")).join(" or ")}`,
		`MV ${monster.movementDistance}${monster.movementType ? ` (${monster.movementType})` : ""}`,
		`S ${monster.strength}`,
		`D ${monster.dexterity}`,
		`C ${monster.constitution}`,
		`I ${monster.intelligence}`,
		`W ${monster.wisdom}`,
		`Ch ${monster.charisma}`,
		`AL ${monster.alignment.charAt(0)}`,
		`LV ${monster.level}`,
	].join(", ").replace(/AC|HP|ATK|MV|S|D|Ch|C|I|W|AL|LV/g, "<strong>$&</strong>");
	const traits = monster.traits.map(trait =>
		`<p><strong>${escapeHtml(trait.name)}.</strong> ${escapeHtml(trait.description)}</p>`
	).join("");
	return `<p><i>${escapeHtml(monster.description)}</i></p><p>${stats}</p>${traits}`;
}

/**
 * Convert a pasted Shadowdark monster into Foundry NPC and embedded Item data.
 * @param {string} monsterText
 * @param {object} config Foundry configuration values needed for key validation.
 * @returns {{actorData: object, itemData: object[]}}
 */
export function translateMonster(monsterText, config) {
	let monster;
	try {
		monster = parseStatblock(monsterText);
	}
	catch(error) {
		throw importError(error instanceof Error ? error.message : String(error));
	}

	if (typeof monster.hp !== "number" || typeof monster.level !== "number") {
		throw importError("Variable HP and level values are not supported by Foundry NPCs.");
	}
	if (!(monster.alignment in ALIGNMENTS)) {
		throw importError(`Unsupported alignment: "${monster.alignment}"`);
	}

	const attacks = monster.attacks.flat().map(attack => translateAttack(attack, config));
	const spellAttack = attacks.find(attack => attack.name.toLowerCase() === "spell");
	const itemData = attacks.filter(attack => attack.name.toLowerCase() !== "spell");
	let spellAbility = "";

	for (const trait of monster.traits) {
		const spellMatch = trait.name.match(/^(.*)\s+\(([a-z]+) Spell\)$/i);
		if (spellMatch) {
			const spell = translateSpellTrait(trait, spellMatch, config);
			spellAbility = spell.ability;
			itemData.push(spell.item);
			continue;
		}

		const specialAttack = itemData.find(item =>
			item.type === "NPC Special Attack" && item.name.toLowerCase() === trait.name.toLowerCase()
		);
		if (specialAttack) {
			specialAttack.system.description = formatDescription(trait.description);
			continue;
		}

		itemData.push({
			name: trait.name,
			type: "NPC Feature",
			system: {description: formatDescription(trait.description), predefinedEffects: ""},
		});
	}

	return {
		actorData: {
			name: monster.name,
			img: "systems/shadowdark/assets/tokens/cowled_token_red.webp",
			type: "NPC",
			system: {
				abilities: {
					str: {mod: monster.strength}, dex: {mod: monster.dexterity},
					con: {mod: monster.constitution}, int: {mod: monster.intelligence},
					wis: {mod: monster.wisdom}, cha: {mod: monster.charisma},
				},
				alignment: ALIGNMENTS[monster.alignment],
				attributes: {ac: {value: monster.ac}, hp: {max: monster.hp, value: monster.hp}},
				darkAdapted: true,
				level: {value: monster.level},
				move: getConfiguredKey(monster.movementDistance, config.moves, "movement distance"),
				moveNote: monster.movementType ?? "",
				notes: generateNotes(monster),
				spellcasting: {
					ability: spellAbility,
					attacks: spellAttack?.system.attack.num ?? 0,
					bonus: spellAttack?.system.bonuses.attackBonus ?? 0,
				},
			},
		},
		itemData,
	};
}
