export default class ChecksSD {

	static async registerEnrichers() {
		console.warn("enricher");
		// load custom text enrichers
		// [[/check STAT DC]]
		// [[/request STAT DC]]
		CONFIG.TextEditor.enrichers.push({
			pattern: /\[\[\/(?<command>check|request)\s(?<stat>\w{3})\s(?<dc>\d+)\]\]/g,
			enricher: async (match, options) => {
				let { command, stat, dc } = match.groups;
				const link = document.createElement("a");
				link.dataset.command = command;
				link.dataset.stat = stat;
				link.dataset.dc = dc;
				switch (command) {
					case "check":
						link.innerHTML = `<i class="fa-solid fa-dice-d20"></i>DC ${dc} ${stat}`;
						break;
					case "request":
						link.innerHTML = `<i class="fa-solid fa-comment"></i>DC ${dc} ${stat}`;
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

		let options = {};
		if (event.shiftKey) {
			options.fastForward = true;
		}

		switch (data.command) {
			case "check":
				let actor = game.user.character;
				if (actor) {
					actor.rollAbility(data.stat, options);
				}
				else {
					ui.notification.error("You do not have a character selected!");
				}

				break;
			case "request":
				console.log("Request Check");
				break;
		}
	}

}
