export default class EncounterSD extends Combat {
	async rollInitiative(ids, {formula=null, updateTurn=true, messageOptions={}}={}) {
		// Roll clockwise initiative (rulebook page 83) if that setting is selected
		if (game.settings.get("shadowdark", "useClockwiseInitiative")) {
			// Clear existing initiatives
			super.resetAll()

			// Structure input data
			const currentId = this.combatant?.id;
			const chatRollMode = game.settings.get("core", "rollMode");

			// Initiative is rolled by all PCs and only the NPC with the highest bonus
			const rollers = []
			const npcs = []
			for (const combatant of this.combatants) {
				if (combatant.actor.type === "Player") rollers.push(combatant)
				else if (combatant.actor.type === "NPC") npcs.push(combatant)
			}
			if (npcs.length > 0) {
				npcs.sort((a, b) =>
					b.actor.getRollData().initiativeBonus - a.actor.getRollData().initiativeBonus)
				rollers.push(npcs[0])
			}

			// Get roll results for all combatants who get to roll initiative
			const messages = [];
			const rollResults = await Promise.all(
				rollers.map(async (combatant, index) => {
					const roll = combatant.getInitiativeRoll(formula)
					await roll.evaluate({async: true})

					// Construct chat message data
					let messageData = foundry.utils.mergeObject({
						speaker: ((combatant.actor.type === "NPC") ?
							null :
							ChatMessage.getSpeaker({
								actor: combatant.actor,
								token: combatant.token,
								alias: combatant.name
							})),
						flavor: game.i18n.format("COMBAT.RollsInitiative", {name: ((combatant.actor.type === "NPC") ? `${game.i18n.localize("SHADOWDARK.dialog.gm")}` : combatant.name)}),
						flags: {"core.initiativeRoll": true}
					}, messageOptions);
					const rollChatData = await roll.toMessage(messageData, {create: false});

					// If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
					rollChatData.rollMode = "rollMode" in messageOptions ? messageOptions.rollMode
						: (combatant.hidden ? CONST.DICE_ROLL_MODES.PRIVATE : chatRollMode );

					// Play 1 sound for the whole rolled set
					if ( index > 0 ) rollChatData.sound = null;
					messages.push(rollChatData);

					return {combatant: combatant, prelimInitiative: roll.total}
				})
			)

			// Identify the combatant with the highest initiative
			const firstCombatant = rollResults.reduce(function(prev, current) {
				return (prev && prev.prelimInitiative > current.prelimInitiative)
					? prev : current
			}).combatant

			// Only consider users who have a character fighting in the current combat
			const activeUsers = [
				game.users.activeGM,
				...(game.users.players.filter((p) => this.combatants.find((c) => c.actor === p.character)))
			]

			// Rearrange user list so that the first combatant's owner goes first, and the rest follow in a predetermined order
			const firstIndex = (firstCombatant.actor.type === "NPC") ?
				activeUsers.findIndex((p) => p === game.users.activeGM) :
				activeUsers.findIndex((p) => p?.character === firstCombatant.actor)
			for (let i = 0; i < firstIndex; i++) {
				activeUsers.push(activeUsers.shift())
			}

			// Sort combatants according to their owner's position in the clockwise initiative order.
			const initiativeOrder = []
			for (const user of activeUsers) {
				// All NPCs go on the GM's turn in order of descending initiative bonus
				if (user === game.users.activeGM) initiativeOrder.push(...npcs)
				else {
					const c = this.combatants.find((c) => c.actor === user.character)
					if (c) initiativeOrder.push(c)
				}
			}

			// Set all combatants' initiatives in descending order
			for (let i = 0; i < initiativeOrder.length; i++) {
				super.setInitiative(initiativeOrder[i].id, initiativeOrder.length - i)
			}

			// Ensure the turn order remains with the same combatant
			if ( updateTurn && currentId ) {
				await this.update({turn: this.turns.findIndex(t => t.id === currentId)});
			}

			// Post initiative rolls to chat
			await ChatMessage.implementation.create(messages)

			// Post a reminder to the chat that clockwise initiative is active
			let messageData = foundry.utils.mergeObject({
				flavor: game.i18n.format("SHADOWDARK.chat.clockwise_initiative", {
					name: ((firstCombatant.actor.type === "NPC") ?
						`${game.i18n.localize("USER.RoleGamemaster")}` :
						firstCombatant.name)
				})
			}, messageOptions);
			await ChatMessage.implementation.create(messageData);
			return this;
		}

		// If circular initiative is not selected, use the default Foundry method
		else super.rollInitiative(ids, {formula, updateTurn, messageOptions})
	}
}
