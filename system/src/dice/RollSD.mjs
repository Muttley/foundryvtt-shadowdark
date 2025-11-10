export default class RollSD extends Roll {

	static CHAT_TEMPLATE = "systems/shadowdark/templates/dice/roll.hbs";

	static TOOLTIP_TEMPLATE = "systems/shadowdark/templates/dice/tooltip.hbs";

	constructor(config={}, rollData={}) {
		// maintain backwards compatibility
		if (typeof config === "string") config = {formula: config};
		if ( !config?.formula) throw new Error("Missing required property: config.formula");

		// apply advantage or disadvantage
		if (config.advantage) {
			config.formula = shadowdark.dice.applyAdvantage(config.formula, config.advantage);
		}

		super(config.formula, rollData);
		this.config = config;
	}

	get criticalFailure() {
		if (!this._evaluated || this.dice.length < 1) return null;
		const baseDie = this.dice[0];
		const target = this.config?.criticalFailureAt ?? 1;
		return target ? baseDie.total <= target : false;
	}

	get criticalSuccess() {
		if (!this._evaluated || this.dice.length < 1) return null;
		const baseDie = this.dice[0];
		const target = this.config?.criticalSuccessAt ?? baseDie.faces;
		return target ? baseDie.total >= target : false;
	}

	get success() {
		if (!this._evaluated || !this.config?.dc) return null;
		return this.total >= this.config?.dc;
	}

}
