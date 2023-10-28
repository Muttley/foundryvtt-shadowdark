export default class ShadowdarkMacro {

	static async initializeLuck(rollFormula="1d4") {
		if (!game.user.isGM) {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.macro.error.gm_role_required", {
					macro: "Initialize Luck",
				})
			);
		}
		else {
			try {
				const players = game.users.players;

				for (const player of players) {
					const actor = player.character;

					if (!actor) continue; // Player doesn't own a character

					let luckRoll = await new Roll(rollFormula).roll({async: true});
					const luckValue = parseInt(luckRoll.result);

					const updateData = {
						"system.luck.available": true,
						"system.luck.remaining": luckValue,
					};

					actor.update(updateData);
				}

				return ui.notifications.info(
					game.i18n.format("SHADOWDARK.macro.success", {
						macro: "Initialize Luck",
					})
				);
			}
			catch(e) {
				return ui.notifications.error(
					game.i18n.format("SHADOWDARK.macro.error.caught_error", {
						macro: "Initialize Luck",
						error: e,
					})
				);
			}
		}
	}

	static async openMonsterImporter() {
		new shadowdark.apps.MonsterImporterSD().render(true);
	}
}
