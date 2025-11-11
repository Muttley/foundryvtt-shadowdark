export default class SolodarkSD extends foundry.appv1.api.FormApplication {
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
			result = result.concat(", but...");
		}

		shadowdark.utils.diceSound();

		// display results to chat
		const HTML = await renderTemplate(
			"systems/shadowdark/templates/chat/solodark-card.hbs",
			{
				question: event.target.question.value,
				result,
			}
		);

		const chatData = {
			user: game.user._id,
			content: HTML,
			whisper: game.users.filter(u => u.isGM).map(u => u._id),
		};
		ChatMessage.create(chatData, {});

	}

	static async rollPrompt() {

		const verbTable = await fromUuid("Compendium.shadowdark.rollable-tables.RollTable.1xuTMmp7d9BKkAgk");
		const nounTable = await fromUuid("Compendium.shadowdark.rollable-tables.RollTable.7cYFj7NH2XbHVakm");

		let result = await verbTable.draw({displayChat: false});
		const verb = result.results[0].text;

		result = await nounTable.draw({displayChat: false});
		const noun = result.results[0].text;

		shadowdark.utils.diceSound();
		const HTML = await renderTemplate(
			"systems/shadowdark/templates/chat/solodark-prompt-card.hbs",
			{verb, noun}
		);

		// create chat message
		const chatData = {
			user: game.user._id,
			content: HTML,
			whisper: game.users.filter(u => u.isGM).map(u => u._id),
		};
		ChatMessage.create(chatData, {});
	}
}
