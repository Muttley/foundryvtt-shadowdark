import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");

export function makeAbilityScores({
	str = 10, dex = 10, con = 10, int = 10, wis = 10, cha = 10,
} = {}) {
	const make = v => ({
		value: v,
		get mod() {
			return Math.min(4, Math.max(-4, Math.floor((v - 10) / 2)));
		},
	});
	return {
		str: make(str), dex: make(dex), con: make(con),
		int: make(int), wis: make(wis), cha: make(cha),
	};
}

export function loadItem(packDir, filename, overrides = {}) {
	const filePath = path.join(ROOT, "data/packs", packDir, filename);
	const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

	const system = { ...raw.system, ...overrides };

	return {
		...raw,
		uuid: raw._id,
		system: {
			...system,
			get isArmor() {
				return raw.type === "Armor";
			},
			get propertyNames() {
				return [];
			},
		},
	};
}

export function loadEffect(packDir, filename) {
	const filePath = path.join(ROOT, "data/packs", packDir, filename);
	const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

	return {
		...raw,
		uuid: raw._id,
		isSituational: false,
		parent: { name: raw.name, uuid: raw._id },
	};
}

export function makeActor({ abilities = {}, items = [], effects = [] } = {}) {
	return {
		abilities: makeAbilityScores(abilities),
		parent: {
			items,
			appliedEffects: effects,
			getRollData() {
				return {};
			},
		},
	};
}
