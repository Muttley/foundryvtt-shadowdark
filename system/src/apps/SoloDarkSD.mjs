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

		// get roll type from form
		const chatTemplate = "systems/shadowdark/templates/chat/solodark-card.hbs";
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

		// calculate the result
		let resultRoll = await new Roll(formula).roll();
		let result = "Yes";
		switch (true) {
			case (resultRoll._total === 1):
				result = "Extreme No";
				break;
			case (resultRoll._total < 10):
				result = "No";
				break;
			case (resultRoll._total === 10):
				result = "Twist";
				break;
			case (resultRoll._total === 20):
				result = "Extreme Yes";
				break;
		}

		if ((resultRoll._total % 2) === 1 && (resultRoll._total > 1)) {
			result.concat(", but...");
		}

		// roll on tables

		// render chat template
		const HTML = await renderTemplate(
			chatTemplate,
			{
				question: event.target.question.value,
				result,
			}
		);

		// create chat message
		const chatData = {
			user: game.user._id,
			flavor: "The Oracle",
			content: HTML,
			classes: ["shadowdark"],
			whisper: game.users.filter(u => u.isGM).map(u => u._id),
		};
		ChatMessage.create(chatData, {});

	}
}
