import ImporterSD from "./ImporterSD.mjs";
import { translateSpell } from "./spell-importer-parser.mjs";

export default class SpellImporter extends ImporterSD {
	static DEFAULT_OPTIONS = {
		id: "sd-spell-importer",
		window: {
			title: "SHADOWDARK.apps.spell-importer.title",
		},
	};

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/apps/spell-importer.hbs",
		},
	};

	static IMPORTER_CONFIG = {
		textField: "spellText",
		sidebarTab: "items",
		errorMessage: "Failed to fully parse the spell stat block.",
	};

	async _import(spellText) {
		return this._importSpell(spellText);
	}

	async _importSpell(spellText) {
		const classDocuments = (await shadowdark.compendiums.classes()).contents;
		const spellData = translateSpell(spellText, classDocuments, {
			spellDurations: CONFIG.SHADOWDARK.SPELL_DURATIONS,
			spellImage: CONFIG.SHADOWDARK.DEFAULTS.ITEM_IMAGES.Spell,
			spellRanges: CONFIG.SHADOWDARK.SPELL_RANGES,
		});
		return Item.create(spellData);
	}
}
