export default class RequestCheckSD extends FormApplication {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark"],
			template: "systems/shadowdark/templates/apps/request-check.hbs",
			width: 400,
			title: game.i18n.localize("SHADOWDARK.apps.request-check.title"),
			closeOnSubmit: false,
		});
	}

	activateListeners(html) {
		super.activateListeners(html);

		html.find(".custom-dc").click(
			event => {
				$(event.target).siblings()[0].checked=true;
			}
		);
	}

	/** @override */
	async getData() {
		return {
			stats: CONFIG.SHADOWDARK.ABILITIES_LONG,
			difficulty: {
				9: `9 (${game.i18n.localize("SHADOWDARK.apps.request-check.easy")})`,
				12: `12 (${game.i18n.localize("SHADOWDARK.apps.request-check.normal")})`,
				15: `15 (${game.i18n.localize("SHADOWDARK.apps.request-check.hard")})`,
				18: `18 (${game.i18n.localize("SHADOWDARK.apps.request-check.extreme")})`,
			},
		};
	}

	/** @inheritdoc */
	async _updateObject(event, data) {

		if (data.custom) {
			data.difficulty = data.custom;
		}
		data.difficulty = parseInt(data.difficulty);

		switch (event.submitter.name) {
			case "request-copy":
				let linkText = `[[request ${data.difficulty} ${data.stat}]]`;
				await navigator.clipboard.writeText(linkText);
				ui.notifications.info(game.i18n.localize("SHADOWDARK.apps.request-check.copied"));
				break;
			case "request-check":
				shadowdark.checks.displayRequest(data.difficulty, data.stat);
				this.close();
				break;
			default:
				shadowdark.log("Request Check Error");
		}
	}

}
