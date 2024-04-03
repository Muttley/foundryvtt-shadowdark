let hasSpells = [];

Handlebars.registerHelper("hasspell", spell => {
	return (hasSpells.includes(spell));
});

export default class SpellBookSD extends FormApplication {

	constructor(classUuid, characterUid = "") {
	    super();
		this.classID = classUuid;

		if (characterUid !== "") {
			let actorObj = game.actors.get(characterUid);
			hasSpells = actorObj.items.filter(d => (d.type === "Spell")).map(x => x.name);
			// hasSpells = Object.fromEntries(this.hasSpells.map(x => [x.name, true]));
		}
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: 350,
			resizable: true,
			closeOnSubmit: true,
			submitOnChange: false,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/spell-book.hbs";
	}

	/** @inheritdoc */
	get title() {
	    const title = game.i18n.localize("SHADOWDARK.apps.spell-book.title");
		return `${title}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-action='toggle']").click(
			event => this._onToggle(event)
		);

	}

	/** @override */
	async getData() {

		let data = {
			class: await fromUuid(this.classID),
			spellList: [],
			hasSpells: this.hasSpells,
		};

		// get source filter settings
		const sources = game.settings.get("shadowdark", "sourceFilters") ?? [];
		const sourcesSet = (sources.length > 0);

		// load all spells for class based on source filter
		let unsortedSpells = [];
		for (let pack of game.packs) {
			if (pack.metadata.type !== "Item") continue;

			let ids = pack.index.filter(d => (d.type === "Spell")).map(d => d._id);

			for (const id of ids) {
				const spell = await pack.getDocument(id);
				const source = spell.system?.source?.title ?? "";
				if (spell.system.class.includes(this.classID)) {
					if (source !== "" && sourcesSet && !sources.includes(source)) {
						continue;
					}
					unsortedSpells.push(spell);
				}
			}

		}

		// sort spells
		let sortedSpells = unsortedSpells.sort(
			(a, b) => a.name < b.name ? -1 : 1);

		// group spells by tier
		data.spellList = Object.groupBy(sortedSpells, ({system}) => system.tier);
		return data;
	}

	async _onToggle(event) {
		const spellObj = this.spells.find(x => x ===$(event.currentTarget).data("spell-id"));
		console.log(spellObj);
	}

}
