import ImporterSD from "./ImporterSD.mjs";
import { translateMonster } from "./monster-importer-parser.mjs";

export default class MonsterImporterSD extends ImporterSD {
	static DEFAULT_OPTIONS = {
		id: "sd-monster-importer",
		window: {
			title: "SHADOWDARK.apps.monster-importer.title",
		},
	};

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/apps/monster-importer.hbs",
		},
	};

	static IMPORTER_CONFIG = {
		textField: "monsterText",
		sidebarTab: "actors",
		errorMessage: "Failed to fully parse the monster stat block.",
	};

	async _import(monsterText) {
		return this._importMonster(monsterText);
	}

	_parseMonster(monsterText) {
		return translateMonster(monsterText, {
			abilityKeys: CONFIG.SHADOWDARK.ABILITY_KEYS,
			moves: CONFIG.SHADOWDARK.NPC_MOVES,
			ranges: CONFIG.SHADOWDARK.RANGES,
			spellRanges: CONFIG.SHADOWDARK.SPELL_RANGES,
		});
	}

	async _importMonster(monsterText) {
		const {actorData, itemData} = this._parseMonster(monsterText);
		const newActor = await Actor.create(actorData);
		await newActor.createEmbeddedDocuments("Item", itemData);
		return newActor;
	}
}
