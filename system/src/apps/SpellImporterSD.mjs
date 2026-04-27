import ImporterSD from "./ImporterSD.mjs";

export default class SpellImporter extends ImporterSD {
	/**
	 * Contains an importer function to import spell stat blocks
	 */

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

	/** @override */
	async _import(spellText) {
		return this._importSpell(spellText);
	}

	/**
	 * Parses pasted text representing a spell and creates an spell item from it.
	 * @param {string} string - String data posted by user
	 * @returns {ActorSD}
	 */
	async _importSpell(spellText) {
		// trim spaces from the end of each line:
		spellText = spellText.replace(/[^\S\r\n]+$/gm, "");

		// parse spell text into 4 main parts:
		const parsedText = spellText.match([
			/(.*)\n/,							// parsedText[1] matches title
			/Tier\s*(\d),/,						// parsedText[2] matches tier
			/\s*([\S\s]*?)/,					// parsedText[3] matches classes
			/Duration:\s*(\d*)\s*/,				// parsedText[4] matches duration value
			/\s*([\S\s]*?)\n/,					// parsedText[5] matches duration type
			/Range:\s*([\S\s]*?)\n/,			// parsedText[6] matches range
			/([\S\s]*)/,						// parsedText[7] matches description
		].map(function(r) {
			return r.source;
		}).join(""));

		// set 4 main variables, removing newlines
		const titleName = parsedText[1].titleCase();
		const tier = parsedText[2];
		const classes = parsedText[3].trim().split(", ");
		let durationType = parsedText[5].replace(/(\r\n|\n|\r)/gm, " ");
		const isRealTime = durationType.toLowerCase().includes("real time");
		const durationValue = `${parsedText[4]}${isRealTime ? durationType.charAt(0) : ""}`;
		const range = parsedText[6].replace(/(\r\n|\n|\r)/gm, " ");
		const description = parsedText[7].replace(/(\r\n|\n|\r)/gm, " ");

		if (["round", "turn", "day"].includes(durationType.toLowerCase())) {
			durationType += "s";
		}

		let classObj = (
			await (shadowdark.compendiums.classes())
		).contents.filter(
			c => classes.includes(c.name.toLowerCase())
		);

		let classIDs = classObj.map(c => `Compendium.shadowdark.classes.Item.${c._id}`);

		let spellObj = {
			name: titleName,
			img: CONFIG.SHADOWDARK.DEFAULTS.ITEM_IMAGES.Spell,
			type: "Spell",
			system: {
				class: classIDs,
				description: description,
				duration: {
					type: isRealTime ? "realTime" : durationType.toLowerCase(),
					value: durationValue || undefined,
				},
				range: range.toLowerCase(),
				tier: tier,
			},
		};

		const newSpell = await Item.create(spellObj);

		return newSpell;
	}
}
