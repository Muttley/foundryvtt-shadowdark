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


	static async rollItemMacro(itemName) {
		const speaker = ChatMessage.getSpeaker();
		// Active actor, or inactive actor + token on scene allowed
		if (!(speaker.actor && speaker.scene)) {
			return ui.notifications.warn();
		}

		// get actor using macro
		let actor = game.actors.get(speaker.actor);

		// Get items matching name on the macro
		const items = actor ? actor.items.filter( x => x.name === itemName) : [];

		// no items of itemName found on actor
		if (items.length === 0) {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.hotbar.noItemWithName", {
					actorName: actor.name,
					itemName,
				})
			);
		}

		// special case for light sources
		if (items[0]?.system?.light?.isSource === true) {

			// turn off any active lights
			let lightActive = false;
			items.forEach(async x => {
				if (x.system.light.active === true) {
					lightActive = true;
					await x.parent.sheet._toggleLightSource(x);
				}
			});

			// else turn on most used up light source making itemName
			if (lightActive === false) {
				let lightSource = items[0];
				items.forEach(x => {
					if (x.system.light.remainingSecs < lightSource.system.remainingSecs) {
						lightSource = x;
					}
				});
				await lightSource.parent.sheet._toggleLightSource(lightSource);
			}
			return;
		}

		// multiple items of itemName found on actor. Warn, then use first found.
		if (items.length > 1) {
			ui.notifications.warn(
				game.i18n.format("SHADOWDARK.hotbar.moreThanOneItemWithName", {
					actorName: actor.name,
					itemName,
				})
			);
		}

		// Cast spell or wand or scroll
		if (items[0].type === "Spell" || items[0].type === "Wand" || items[0].type === "Scroll") {
			if (items[0].system.lost === true) {
				ui.notifications.warn(
					game.i18n.format("SHADOWDARK.hotbar.spellLost", {
						actorName: actor.name,
						itemName,
					})
				);
			}
			actor.castSpell(items[0]._id);
		}

		// Use class ability
		else if (items[0].type === "Class Ability") {
			if (items[0].system.lost === true) {
				ui.notifications.warn(
					game.i18n.format("SHADOWDARK.hotbar.abilityLost", {
						actorName: actor.name,
						itemName,
					})
				);
			}
			actor.useAbility(items[0]._id);
		}

		// Roll weapon attack
		else if (items[0].type === "Weapon") {
			actor.rollAttack(items[0]._id);
		}

		else if (items[0].type === "Potion") {
			actor.usePotion(items[0]._id);
		}

		// Show basic item
		else {
			items[0].sheet.render(true);
		}
	}
}
