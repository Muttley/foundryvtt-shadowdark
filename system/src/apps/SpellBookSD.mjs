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
		}
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: 450,
			left: 100,
			resizable: true,
			closeOnSubmit: true,
			submitOnChange: false,
			dragDrop: [{dragSelector: ".item[draggable=true]"}],
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

		html.find("[data-action='show-description']").click(
			event => this._onToggle(event)
		);

	}

	/** @inheritdoc */
	_canDragStart() {
		return true;
	}

	/** @override */
	async getData() {

		this.data = {
			class: await fromUuid(this.classID),
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
		this.data.spellList = Object.groupBy(sortedSpells, ({system}) => system.tier);

		return this.data;
	}

	async _onToggle(event) {
		event.preventDefault();

		const tableRow = $(event.currentTarget);
		const key1 = event.currentTarget.dataset.key1;
		const key2 = event.currentTarget.dataset.key2;

		const spellObj = this.data.spellList[key1][key2];

		if (tableRow.hasClass("expanded")) {
			const detailsRow = tableRow.next(".item-details");
			const detailsDiv = detailsRow.find("td > .item-details__slidedown");
			detailsDiv.slideUp(200, () => detailsRow.remove());
		}
		else {
			const description = this._formatDescription(spellObj.system.description);

			const detailsRow = document.createElement("tr");
			detailsRow.classList.add("item-details");

			const detailsData = document.createElement("td");
			detailsData.setAttribute("colspan", 3);

			const detailsDiv = document.createElement("div");
			detailsDiv.setAttribute("style", "display: none");

			detailsDiv.insertAdjacentHTML("afterbegin", description);
			detailsDiv.classList.add("item-details__slidedown");

			detailsData.appendChild(detailsDiv);
			detailsRow.appendChild(detailsData);

			tableRow.after(detailsRow);

			$(detailsDiv).slideDown(200);
		}

		tableRow.toggleClass("expanded");

	}

	async _onDragStart(event) {
		// Add item type and uuid of the spell to the drag event data
		// Needed as formApps don't seem to have the same default event handlers as sheets
		if (event.currentTarget.dataset.uuid) {
			event.dataTransfer.setData("text/plain", JSON.stringify(
				{
					type: "Item",
					uuid: event.currentTarget.dataset.uuid,
				})
			);
		}
		super._onDragStart(event);
	}

	_formatDescription(text) {

		const description = TextEditor.enrichHTML(
			jQuery(text.replace(/<p><\/p>/g, " ")).text(),
			{
				async: false,
				cache: false,
			}
		);
		return description;
	}

}
