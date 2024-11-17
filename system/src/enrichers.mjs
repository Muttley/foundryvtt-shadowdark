export default function registerTextEditorEnrichers() {

	CONFIG.TextEditor.enrichers.push({
		// [[check DC STAT]]
		// [[request DC STAT]]
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
			link.classList.add("skill-roll-request");
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

	$("body").on(
		"click", "a.skill-roll-request",
		shadowdark.apps.RequestCheckSD.checkHandler
	);

}
