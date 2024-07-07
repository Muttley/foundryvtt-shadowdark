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
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark sheet"],
			width: 450,
			height: 650,
			left: 100,
			resizable: true,
			closeOnSubmit: true,
			submitOnChange: false,
			tabs: [
				{
					navSelector: ".SD-nav",
					contentSelector: ".SD-content-body",
					initial: "tab-tier-1",
				},
			],
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

		html.find("[data-action='show-details']").click(
			event => shadowdark.utils.toggleItemDetails(event.currentTarget)
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

		// load all spells for class based on source filter
		const spells = await shadowdark.compendiums.classSpellBook(this.classID);

		const spellList = {};
		for (const spell of spells) {
			const tier = spell.system.tier;
			if (!spellList[tier]) {
				spellList[tier] = [];
			}

			spellList[tier].push(spell);
		}

		this.data.spellList = spellList;

		return this.data;
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

}
