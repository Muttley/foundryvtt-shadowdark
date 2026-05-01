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
		const config = {skipPrompt: event.shiftKey};

		// Active actor, or inactive actor + token on scene allowed
		if (!(speaker.actor && speaker.scene)) {
			return ui.notifications.warn(
				game.i18n.localize("SHADOWDARK.hotbar.noActorSelected")
			);
		}

		// get actor using macro
		let actor = game.actors.get(speaker.actor);
		if (!actor?.system?.isPC) return;

		// Get items matching name on the macro
		const items = actor.items.filter(i => i.name === itemName);

		// no items of itemName found on actor
		if (items.length === 0) {
			return ui.notifications.error(
				game.i18n.format("SHADOWDARK.hotbar.noItemWithName", {
					actorName: actor.name,
					itemName,
				})
			);
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
		const item = items[0];

		// special case for light sources
		if (item?.system?.light?.isSource === true) {

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
				let lightSource = item;
				items.forEach(x => {
					if (x.system.light.remainingSecs < lightSource.system.remainingSecs) {
						lightSource = x;
					}
				});
				await lightSource.parent.sheet._toggleLightSource(lightSource);
			}
		}

		// special case for wands
		else if (item.system.isWand) {

			const availableSpells = item.system.spells.filter(s => !s.lost);
			if (availableSpells.length === 0) {
				return ui.notifications.warn(
					game.i18n.format("SHADOWDARK.hotbar.wandAllSpellsLost", { itemName })
				);
			}

			let spellUuid;
			if (availableSpells.length === 1) {
				spellUuid = availableSpells[0].uuid;
			}
			else {
				const spellObjs = await Promise.all(
					availableSpells.map(s => fromUuid(s.uuid))
				);

				const optionsHtml = spellObjs
					.map((s, i) => `<option value="${availableSpells[i].uuid}">${s?.name ?? availableSpells[i].uuid}</option>`)
					.join("");

				spellUuid = await foundry.applications.api.DialogV2.prompt({
					window: { title: game.i18n.localize("SHADOWDARK.dialog.effect.choice.spell") },
					content: `<select name="spell">${optionsHtml}</select>`,
					ok: {
						label: game.i18n.localize("SHADOWDARK.dialog.general.select"),
						callback: (_event, button) => button.form.elements.spell.value,
					},
				});
			}
			if (!spellUuid) return;

			actor.system.castSpell(spellUuid, { itemUuid: item.uuid, ...config});
		}

		else if (item.system.isScroll) {
			actor.system.castSpell(item.system?.spellUuid, {itemUuid: item.uuid, ...config});
		}
		else if (item.system.isSpell) actor.system.castSpell(item.uuid, config);
		else if (item.system.isAbility) actor.system.useAbility(item.uuid, config);
		else if (item.system.isWeapon) actor.system.rollAttack(item.uuid, config);
		else if (item.type === "Potion") actor.usePotion(item._id);
		else item.sheet.render(true);
	}
}
