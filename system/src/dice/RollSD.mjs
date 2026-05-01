export default class RollSD extends foundry.dice.Roll {

	static CHAT_TEMPLATE = "systems/shadowdark/templates/dice/roll.hbs";

	static TOOLTIP_TEMPLATE = "systems/shadowdark/templates/dice/tooltip.hbs";

	get criticalFailure() {
		if (this._evaluated && this.dice.length > 0 && this.options?.canCritical) {
			const baseDie = this.dice[0];
			const target = this.options?.criticalFailureAt ?? 1;
			return target ? baseDie.total <= target : false;
		}
		else {
			return null;
		}
	}

	get criticalSuccess() {
		if (this._evaluated && this.dice.length > 0 && this.options?.canCritical) {
			const baseDie = this.dice[0];
			const target = this.options?.criticalSuccessAt ?? baseDie.faces;
			return target ? baseDie.total >= target : false;
		}
		else {
			return null;
		}
	}

	get success() {
		if (!this._evaluated || !this.options?.dc) return null;
		return this.total >= this.options?.dc;
	}

	async _prepareChatRenderContext({flavor, isPrivate=false, ...options}={}) {
		const context = await super._prepareChatRenderContext(
			{flavor, isPrivate, ...options}
		);

		context.options = this.options;
		context.damage = this.options.type === "damage";

		// context for success or failure
		if (this.criticalSuccess) {
			context.success = "critical-success";
			context.successLabel = game.i18n.localize("SHADOWDARK.roll.label.critical_success");
		}
		else if (this.criticalFailure) {
			context.success = "critical-failure";
			context.successLabel = game.i18n.localize("SHADOWDARK.roll.label.critical_failure");
		}
		else if (this.success) {
			context.success = "success";
			context.successLabel = game.i18n.localize("SHADOWDARK.roll.label.success");
		}
		else if (this.success === false) {
			context.success = "failure";
			context.successLabel = game.i18n.localize("SHADOWDARK.roll.label.failure");
		}
		else {
			context.success = "";
			context.successLabel = ""; // No DC
		}

		return context;
	}

	async getTooltip() {
		const parts = this.dice.map(d => d.getTooltipData());
		return foundry.applications.handlebars.renderTemplate(
			this.constructor.TOOLTIP_TEMPLATE,
			{parts, rollTooltips: this.options?.tooltips});
	}

}
