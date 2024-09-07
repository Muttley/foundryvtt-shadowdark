export default class SolodarkSD extends FormApplication {

	/** @inheritdoc */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark"],
			width: 350,
			resizable: false,
		});
	}

	/** @inheritdoc */
	get template() {
		return "systems/shadowdark/templates/apps/solodark.hbs";
	}

	/** @inheritdoc */
	get title() {
		const title = "SoloDark";
		return `${title}`;
	}


	/** @inheritdoc */
	async _onSubmit(event) {
		event.preventDefault();

		let formula = "";
		switch (event.submitter.name) {
			case "adv":
				formula = "2d20kh";
				break;
			case "dis":
				formula = "2d20kl";
				break;
			default:
				formula = "d20";
		}

		let resultRoll = await new Roll(formula).roll();

		// ChatMessage.applyRollMode(chatData, "gmroll");
		// close

	}
}
