export default class ChecksSD {

	static async registerEnrichers() {
		// load custom text enrichers
		// [[check DC STAT]]
		// [[request DC STAT]]
		CONFIG.TextEditor.enrichers.push({
			pattern: /\[\[(?<command>check|request)\s(?<dc>\d+)\s(?<stat>\w{3})\]\]/g,
			enricher: async (match, options) => {
				let { command, dc, stat } = match.groups;

				// Check for invalid data
				if (!parseInt(dc)) return;
				if (CONFIG.SHADOWDARK.ABILITY_KEYS.includes(stat.toLowerCase())) {
					stat = stat.toLowerCase();
				}
				else {
					return;
				}

				// create replacement html
				const link = document.createElement("a");
				link.className = "content-link";
				link.dataset.command = command;
				link.dataset.dc = dc;
				link.dataset.stat = stat;
				const linkText = `${game.i18n.localize("SHADOWDARK.class-ability.dc.label")} ${dc} ${game.i18n.localize(`SHADOWDARK.ability_${stat}`)}`.toUpperCase();
				switch (command) {
					case "check":
						link.innerHTML = `<i class="fa-solid fa-dice-d20"></i>${linkText}`;
						break;
					case "request":
						link.innerHTML = `<i class="fa-solid fa-comment"></i>${linkText}`;
						break;
				}
				return link;
			},
		});

		document.body.addEventListener("click", this.checkHandler);
	}

	static async checkHandler(event) {
		let data = event.target?.dataset;
		if ( !data.command ) return;

		switch (data.command) {
			case "check":
				let options = {};
				if (event.shiftKey) {
					options.fastForward = true;
				}
				shadowdark.checks.rollCheck(data.dc, data.stat, options);
				break;
			case "request":
				shadowdark.checks.displayRequest(data.dc, data.stat);
				break;
		}
	}

	static async rollCheck(dc, stat, options={}) {
		let actor = game.user.character;
		if (!actor) {
			ui.notification.error(
				game.i18n.localize("SHADOWDARK.error.general.no_character_selected")
			);
		}
		if (dc) {
			options.target = dc;
		}
		actor.rollAbility(stat.toLowerCase(), options);
	}


	static async displayRequest(dc, stat) {
		const HTML = `<div style="text-align:center">[[check ${dc} ${stat}]]</div>`;
		const chatData = {
			user: game.user._id,
			flavor: game.i18n.localize("SHADOWDARK.check.requesting"),
			content: HTML,
		};
		ChatMessage.create(chatData, {});
	}

}
