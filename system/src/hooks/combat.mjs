export const CombatHooks = {
	attach: () => {
		Hooks.on("updateCombatant", async (combatant, changes) => {
			// Prevent update permission errors for Players
			if (!game.user.isGM) return;
			await applyClockwiseInitiative(combatant, changes);
		});
	},
};

let applyingClockwise = false;

/**
 * When Clockwise Initiative is enabled, triggers a reorder of the combat tracker
 * once every combatant has rolled.
 *
 * @param {Combatant} combatant - Combatant whose data was just updated.
 * @param {object} changes - Diff object passed by Foundry's update pipeline.
 * @returns {Promise<void>}
 */
async function applyClockwiseInitiative(combatant, changes) {
	if (applyingClockwise) return;
	if (!game.settings.get("shadowdark", "useClockwiseInitiative")) return;
	if (!("initiative" in changes)) return;

	// Ensure all combatants have rolled initiative
	if (!combatant.parent.turns.every(c => c.initiative !== null)) return;

	// Prevent re-running by updateEmbeddedDocuments call in sortCombatantsClockwise(),
	// which calls Hooks#callAll again.
	applyingClockwise = true;
	try {
		await sortCombatantsClockwise(combatant);
	}
	finally {
		// Ensure applyClockwiseInitiative is reset even if this errors out
		applyingClockwise = false;
	}
}

/**
 * Reorders all combatants for Clockwise Initiative. PCs are sorted alphabetically
 * while all NPCs share a single position held by the highest-DEX NPC. Combatant
 * with the highest rolled initiative goes first, the rest follow in order.
 *
 * @param {Combatant} lastRoller - Combatant whose initiative update triggered the call.
 * @returns {Promise<void>}
 */
async function sortCombatantsClockwise(lastRoller) {

	const combat = lastRoller.parent;
	const combatants = combat.turns;

	// Will exist if a new combatant is being added to an existing combat
	const currentId = combat.combatant?.id;

	// Initiative is rolled by all PCs and only the NPC with the highest bonus
	const rollers = [];
	const npcs = [];
	const others = [];
	for (const combatant of combatants) {
		if (combatant.actor?.type === "Player") {
			rollers.push(combatant);
		}
		else if (combatant.actor?.type === "NPC") {
			npcs.push(combatant);
		}
		else {
			others.push(combatant); // Group lights and combatants who lack actors
		}
	}
	// Sort PC and "other" combatants by alphabetical order
	rollers.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
	others.sort((a, b) => (a?.name.toLowerCase() || "").localeCompare((b?.name.toLowerCase() || "")));

	if (npcs.length > 0) {
		npcs.sort((a, b) =>
			b.actor.getRollData().abilities.dex.mod - a.actor.getRollData().abilities.dex.mod);
		rollers.push(npcs[0]);
	}

	// Identify the combatant with the highest initiative
	const firstCombatant = combatants.reduce(function(prev, current) {
		return (prev && prev.initiative > current.initiative)
			? prev : current;
	});

	const firstIndex = (firstCombatant.actor.type === "NPC")
		? rollers.findIndex(c => c?.actor.type === "NPC")
		: rollers.findIndex(c => c?.actor === firstCombatant.actor);

	for (let i = 0; i < firstIndex; i++) {
		rollers.push(rollers.shift());
	}

	// Create the final initiative order as an array
	const initiativeOrder = [];

	for (const roller of rollers) {
		/* All NPCs, lights, and combatants without actors go on the GM's turn
		in order of descending initiative bonus */
		if (roller?.actor.type !== "Player") {
			initiativeOrder.push(...npcs);
			initiativeOrder.push(...others);
		}
		else {
			initiativeOrder.push(roller);
		}
	}

	// Set all combatants' initiatives in descending order all at once
	// to prevent multiple calls to Hooks#callAll
	const updates = initiativeOrder.map((c, i) => ({
		_id: c.id,
		initiative: initiativeOrder.length - i,
	}));
	await combat.updateEmbeddedDocuments("Combatant", updates);

	// Ensure the turn order remains with the same combatant
	if (currentId) {
		await combat.update({ turn: combat.turns.findIndex(t => t.id === currentId) });
	}

	// Post a reminder to the chat that clockwise initiative is active
	let messageData = foundry.utils.mergeObject({
		flavor: game.i18n.format("SHADOWDARK.chat.clockwise_initiative", {
			name: ((firstCombatant.actor.type === "NPC")
				? `${game.i18n.localize("USER.RoleGamemaster")}`
				: firstCombatant.name),
		}),
	});

	await ChatMessage.implementation.create(messageData);

}
