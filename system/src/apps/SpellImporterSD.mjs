export default class SpellImporter extends FormApplication {
	/**
	 * Contains an importer function to import spell stat blocks
	 */

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["spell-importer"],
			width: 300,
			resizable: false,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/spell-importer.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.apps.spell-importer.title");
		return `${title}`;
	}

	/** @inheritdoc */
	async _updateObject(event, formData) {
		event.preventDefault();
		try {
			let newSpell = await this._importSpell(formData.spellText);
			ui.notifications.info(`Successfully Created: ${newSpell.name} [${newSpell._id}]`);
			ui.sidebar.activateTab("items");

		}
		catch(error) {
			ui.notifications.error(`Failed to fully parse the spell stat block. ${error}`);
		}
	}

	/** @inheritdoc */
	_onSubmit(event) {
		event.preventDefault();
		super._onSubmit(event);
	}

	_toTitleCase(str) {
		return str.replace(/\w\S*/g, m => m.charAt(0).toUpperCase() + m.substr(1).toLowerCase());
	}

	_toCamelCase(str) {
		return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
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
		const titleName = this._toTitleCase(parsedText[1]);
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
