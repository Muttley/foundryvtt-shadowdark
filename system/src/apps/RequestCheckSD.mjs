export default class RequestCheckSD extends foundry.appv1.api.FormApplication {
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["shadowdark"],
			template: "systems/shadowdark/templates/apps/request-check.hbs",
			width: 400,
			title: game.i18n.localize("SHADOWDARK.apps.request-check.title"),
			closeOnSubmit: false,
		});
	}


	static async checkHandler(event) {
		const data = event.target?.dataset ?? {};

		if (!data.command) return;

		switch (data.command) {
			case "check":
				const actor = await shadowdark.utils.getCurrentActor();
				if (!actor) {
					return ui.notifications.error(
						game.i18n.localize("SHADOWDARK.error.general.no_character_selected")
					);
				}

				const options = {
					target: data.dc,
					stat: data.stat,
				};

				if (event.shiftKey) {
					options.fastForward = true;
				}

				return actor.rollAbility(data.stat.toLowerCase(), options);
			case "request":
				return RequestCheckSD.displayRequest(data.dc, data.stat);
		}
	}


	static async displayRequest(dc, stat) {
		shadowdark.chat.renderRollRequestMessage(
			await shadowdark.utils.getCurrentActor(),
			{
				templateData: {
					title: game.i18n.localize("SHADOWDARK.check.requesting"),
					body: `[[check ${dc} ${stat}]]`,
				},
			},
			CONST.DICE_ROLL_MODES.PUBLIC
		);
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
				RequestCheckSD.displayRequest(data.difficulty, data.stat);
				break;
			default:
				shadowdark.error("Request Check Error");
		}
	}

}
