export default class LevelUpSD extends FormApplication {

	constructor(uid) {
	    super();
	    this.hpRoll = 0;
		this.firstrun = true;
		this.data = {};
		this.data.actor = game.actors.get(uid);
	}

	/** @inheritdoc */
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: 300,
			resizable: false,
			closeOnSubmit: false,
			submitOnChange: false,
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

		html.find("[data-action='roll-talent']").click(
			event => this._onRollTalent(event)
		);
	}

	/** @override */
	async getData(options) {
		if (this.firstrun) {
			this.firstrun = false;
			this.data.class = await fromUuid(this.data.actor.system.class);
			this.data.talentTable = await fromUuid(this.data.class.system.classTalentTable);
			console.log(this.data);
		}
		return this.data;
	}


	async _onRollHP(event) {
		event.preventDefault();

		this.data.actor.rollHP();
	}

	async _onViewTalentTable(event) {
		this.data.talentTable.sheet.render(true);
	}

	async _onRollTalent(event) {
		event.preventDefault();
		const results = await this.data.talentTable.draw();
		console.log(results.results[0]);
	}
}
