export default class LevelUpSD extends FormApplication {

	constructor(uid) {
	    super();
	    this.hpRoll = 0;
		this.firstrun = true;
		this.data = {};
		this.data.actor = game.actors.get(uid);
		this.data.talents = [];
		this.data.spells = [];
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: 350,
			resizable: false,
			closeOnSubmit: true,
			submitOnChange: false,
			dragDrop: [{dragSelector: ".item[draggable=true]"}],
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/level-up.hbs";
	}

	/** @inheritdoc */
	get title() {
	    const title = game.i18n.localize("SHADOWDARK.apps.level-up.title");
		return `${title}`;
	}

	/** @inheritdoc */
	activateListeners(html) {
		super.activateListeners(html);

		html.find("[data-action='roll-hp']").click(
			event => this._onRollHP(event)
		);

		html.find("[data-action='view-talent-table']").click(
			event => this._onViewTalentTable(event)
		);

		html.find("[data-action='delete-talent']").click(
			event => this._onDeleteTalent($(event.currentTarget).data("item"))
		);

		html.find("[data-action='roll-talent']").click(
			event => this._onRollTalent(event)
		);

		html.find("[data-action='finalize-level-up']").click(
			event => this._onFinalizeLevelUp(event)
		);
	}

	/** @override */
	async getData(options) {
		if (this.firstrun) {
			this.firstrun = false;
			this.data.class = await fromUuid(this.data.actor.system.class);
			this.data.talentTable = await fromUuid(this.data.class.system.classTalentTable);
			this.data.targetLevel = this.data.actor.system.level.value +1;
			this.data.talentGained = (this.data.targetLevel % 2 !== 0);
			this.data.isSpellCaster = (this.data.class.system.spellcasting.class !== "__not_spellcaster__");
			console.log(this.data);
		}
		return this.data;
	}

	/** @override */
	async _onDrop(event) {
		const eventData = TextEditor.getDragEventData(event);
		const itemObj = await fromUuid(eventData.uuid);
		console.log(itemObj);
		if (itemObj && eventData.type === "Item") {
			switch (itemObj.type) {
				case "Talent":
					this._onDropTalent(itemObj);
					break;
				case "Spell":
					this._onDropSpell(itemObj);
					break;
				default:
					break;
			}
		}
		return super._onDrop();
	}

	async _onRollHP() {
		this.data.actor.rollHP();
		ui.sidebar.activateTab("chat");
	}

	async _onViewTalentTable() {
		this.data.talentTable.sheet.render(true);
	}

	async _onRollTalent() {
		const results = await this.data.talentTable.draw();
		ui.sidebar.activateTab("chat");
		console.log(results.results[0]);
	}

	_onDropTalent(talentObj) {
		this.data.talents.push(talentObj);
		this.render();
	}

	_onDeleteTalent(index) {
		this.data.talents.splice(index, 1);
		this.render();
	}

	_onDropSpell(spellObj) {
		this.data.spells.push(spellObj);
		this.render();
	}

	_onDeleteSpell(index) {
		this.data.spells.splice(index, 1);
		this.render();
	}

	async _onFinalizeLevelUp() {
		// do stuff here
		const newXP = this.data.actor.system.level.xp - (this.data.actor.system.level.value * 10);
		this.data.actor.update({
			"system.level.value": this.data.targetLevel,
			"system.level.xp": newXP,
		});
		this.data.actor.sheet.render(true);
		this.close();

	}
}
