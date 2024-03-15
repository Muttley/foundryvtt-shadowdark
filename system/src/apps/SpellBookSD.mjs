export default class SpellBookSD extends FormApplication {

	constructor(classUuid) {
	    super();
		this.classID = classUuid;
		console.log(this.classID);
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
		};

		// data.class = await fromUuid(this.classID);

		for (let pack of game.packs) {
			if (pack.metadata.type !== "Item") continue;

			let ids = pack.index.filter(d => (d.type === "Spell")).map(d => d._id);

			for (const id of ids) {
				const spell = await pack.getDocument(id);
				if (spell.system.class.includes(this.classID)) {
					data.spellList.push(spell);
				}
			}

		}

		/* Dedupe and sort the list alphabetically
		docs = Array.from(new Set(docs)).sort((a, b) => a.name.localeCompare(b.name));

		const collection = new Collection();

		for (let d of docs) {
			collection.set(d.id, d);
		}
		*/
		console.log(data);
		return data;
	}

	async _onToggle(event) {
		const spellObj = this.spells.find(x => x ===$(event.currentTarget).data("spell-id"));
		console.log(spellObj);
	}

}
