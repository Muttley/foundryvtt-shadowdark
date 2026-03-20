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

		// context for success or failure
		if (this.criticalSuccess) context.successLabel = "Critical Success";
		else if (this.criticalFailure) context.successLabel = "Critical Failure";
		else if (this.success) context.successLabel = "Success";
		else if (this.success === false) context.successLabel = "Failure";
		else context.successLabel = ""; // No DC

		context.label = this.options?.label ?? null;

		return context;
	}

	async getTooltip() {
		const parts = this.dice.map(d => d.getTooltipData());
		return foundry.applications.handlebars.renderTemplate(
			this.constructor.TOOLTIP_TEMPLATE,
			{parts, rollTooltips: this.options?.tooltips});
	}

}
