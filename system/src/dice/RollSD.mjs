export default class RollSD extends foundry.dice.Roll {

	static CHAT_TEMPLATE = "systems/shadowdark/templates/dice/roll.hbs";

	static TOOLTIP_TEMPLATE = "systems/shadowdark/templates/dice/tooltip.hbs";

	get criticalFailure() {
		if (!this._evaluated || this.dice.length < 1) return null;
		const baseDie = this.dice[0];
		const target = this.options?.criticalFailureAt ?? 1;
		return target ? baseDie.total <= target : false;
	}

	get criticalSuccess() {
		if (!this._evaluated || this.dice.length < 1) return null;
		const baseDie = this.dice[0];
		const target = this.options?.criticalSuccessAt ?? baseDie.faces;
		return target ? baseDie.total >= target : false;
	}

	get success() {
		if (!this._evaluated || !this.options?.dc) return null;
		return this.total >= this.options?.dc;
	}

}
