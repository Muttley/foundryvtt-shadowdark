
/**
 * Functions for handling Shadowdark dice roles
*/

/**
 * Applies advantage or disadvantage to the provided roll formula
 * @param {string} formula // roll formula
 * @param {int} adv // 1: advantage | -1: disadvantage
 * @returns {string} // new roll formula
 */
export function applyAdvantage(formula, adv) {
	return formula.replace(/^(\d*)d(\d+)/, function(match, dice, sides) {
		if (sides) {
			if (adv > 0) return `2d${sides}kh`;
			if (adv < 0) return `2d${sides}kl`;
		}
		return match;
	});
}

/**
 * Applies exploding dice to the provided roll formula
 * @param {string} formula // roll formula
 * @returns {string} // new roll formula
 */
export function applyExploding(formula) {
	return formula.replace(/^(\d*)d(\d+)/, function(match, dice, sides) {
		return `${match}x`;
	});
}

/**
 * Coverts a name value pair into a string tooltip
 * @param {string} name 	Name of the tooltip entry
 * @param {*} value 		Value the tools tip entry provides
 * @param {string} prefix 	Prefix to include before positive values
 * @param {string} key 		Key identifier (checked for "advantage")
 * @returns {string}
 */
export function createToolTip(name, value, prefix="+", key="") {
	// test for well known keys
	if (key.includes("advantage")) {
		const text = value > 0
			? game.i18n.localize("SHADOWDARK.roll.tooltip.advantage")
			: game.i18n.localize("SHADOWDARK.roll.tooltip.disadvantage");
		return `${name} (${text})`;
	}
	else if (key.includes("critical-success")) {
		return `${name} (${game.i18n.localize("SHADOWDARK.roll.tooltip.critical_success")} ${value})`;
	}
	else if (key.includes("critical-failure")) {
		return `${name} (${game.i18n.localize("SHADOWDARK.roll.tooltip.critical_failure")} ${value})`;
	}
	else if (key.includes("critical-multiplier")) {
		return `${name} (${game.i18n.localize("SHADOWDARK.roll.tooltip.critical_multiplier")} ${value})`;
	}
	else if (key.includes("upgrade-damage-die")) {
		return `${name} (${game.i18n.localize("SHADOWDARK.roll.tooltip.upgrade_die")} ${value})`;
	}
	else if (key.includes("extra-damage-die")) {
		return `${name} (${game.i18n.localize("SHADOWDARK.roll.tooltip.extra_die")} ${value})`;
	}
	else {
		return `${name} (${value > 0 ? prefix : ""}${value})`;
	}
}

export function formatBonus(bonus) {
	if (typeof bonus === "number") {
		if (bonus === 0) return "";
		if (bonus > 0) return ` +${bonus}`;
		if (bonus < 0) return ` ${bonus}`;
	}
	return bonus;
}

/**
 * Used to resolve deterministic roll formulas using provided roll data
 * @param {string} formula 			Roll formula to resolve
 * @param {*} rollData 				Actor rolldata
 * @param {*} forceDeterministic 	Return only deterministic results
 * @returns {string}
 */
export function resolveFormula(formula, rollData={}, forceDeterministic=false) {
	const r = new Roll(formula.toString(), rollData);
	if (r.isDeterministic) {
		try {
			r.evaluateSync();
		}
		catch(err) {
			if (forceDeterministic) {
				return null;
			}
		}
		return r.total;
	}
	else if (forceDeterministic) {
		return null;
	}
	else {
		return formula;
	}
}

/**
 * // Wrapper function for creating a roll using shadowdark specific options.
 * // Requires options.formula
 * @param {Object} config shdowdark specific options for describing a single roll
 * @param {Object} rolldata data used to parse attributes included in roll formulas
 * @returns {RollSD}
 */
export async function roll(config, rolldata={}) {
	if ( !config?.formula) throw new Error("Missing required property: config.formula");

	// apply advantage or disadvantage
	if (config.advantage) {
		config.formula = applyAdvantage(config.formula, config.advantage);
	}

	if (config.type === "damage") {
		// apply momentum mode
		if (game.settings.get("shadowdark", "useMomentumMode")) {
			config.formula = applyExploding(config.formula);
		}
	}
	return await new shadowdark.dice.RollSD(config.formula, rolldata, config).evaluate();
}

/**
 * Rolls damage for an existing chat message and updates the message with the result
 * @param {ChatMessage} msg Chat message containing the attack roll
 * @returns {boolean|undefined} false if damage already exists or no formula, undefined otherwise
 */
export async function rollDamageFromMessage(msg) {
	const config = msg?.rollConfig;
	if (!config) return; // TODO Error message
	if (!config.damageRoll?.formula || msg.getRoll("damage")) return false;
	const actor = game.actors.get(config.actorId);
	if (!actor) return; // TODO Error message
	config.damageRoll.type = "damage";
	const damageRoll = await roll(config.damageRoll, actor.getRollData());
	config.damageRoll.html = await damageRoll.render();

	// Generate template data a new content
	const template = "systems/shadowdark/templates/chat/roll-card.hbs";
	const templateData = {...config};
	templateData.actor = actor;
	templateData.mainRoll.html = await msg.getRoll("main").render();
	templateData.damageRoll.html = await damageRoll.render();
	if (config.itemUuid) {
		templateData.item = await fromUuid(config.itemUuid);
	}
	if (config.targetUuid) {
		templateData.target = await fromUuid(config.targetUuid);
	}
	const content = await foundry.applications.handlebars.renderTemplate(template, templateData);

	// update message with new roll and content
	await msg.update({rolls: [...msg.rolls, damageRoll]});
	if (game.dice3d && !damageRoll.isDeterministic) {
		game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(() =>
			msg.update({content})
		);
	}
	else {
		msg.update({content});
	}
}

/**
 * Opens a rollDialog based on the provided Shadowdark roll config.
 * @param {object} config :
		title: {String} - Title to be displayed
		advantage: {Int} - 0: Normal, 1 for Advantage, -1 disadvantage
		formGroups: {Array} - formsGroups to be included in the roll prompt
		skipPrompt: {Bool} - show a dialog prompt during a roll?
		rollingMode: {option}
 * @returns {bool} /returns false if closed without submit
 */
export async function rollDialog(config, dataFunction) {

	// get global role default if rollMode not set
	config.rollMode ??= game.settings.get("core", "rollMode");
	config.type ??= "";
	config.heading ??= "";

	// skip dialog if configured
	if (config.skipPrompt) return true;

	// Show roll prompt and wait for close
	const dialog = new shadowdark.apps.RollDialogSD(config, dataFunction);
	dialog.render({force: true});

	const result = await new Promise(resolve => {
		dialog.addEventListener("close", () => {
			resolve(dialog.submitted ? dialog.result : false);
		}, {once: true});
	});

	return result ? true : false;
}

/**
 * Creates a chat message and one or more rolls based on provided configuration
 * @param {Object} config describes a rolling event with one or more rolls
 * @returns {chatMessageSD}
 */
export async function rollFromConfig(config) {
	if (!config.mainRoll.formula) {
		console.error("Error: missing required config property: mainRoll.formula");
		return false;
	}
	const actor = game.actors.get(config.actorId);
	if (!actor) {
		console.error("Error: missing or invalid config property: actorId");
		return false;
	}

	// evaluate main roll
	const rolls = [];
	config.mainRoll.type = "main";
	const mainRoll = await roll(config.mainRoll, actor.getRollData());
	rolls.push(mainRoll);

	if (mainRoll.success && config?.damageRoll?.formula) {
		// await rollDamageFromMessage(message);
		config.damageRoll.needed = true;
	}

	// render roll
	const chatData = await shadowdark.chat.renderRollMessage(config, rolls);
	const msg = await ChatMessage.create(chatData);

	if (game.settings.get("shadowdark", "rollDamage") && config?.damageRoll?.needed) {
		await rollDamageFromMessage(msg);
	}

	return mainRoll;
}

export function setRollTarget(config={}) {
	// Set target and target AC if targeting is enabled
	if (game.settings.get("shadowdark", "enableTargeting")) {
		const target = game.user.targets.first();
		if (target) {
			config.targetUuid ??= target.document.uuid;
		}
		const targetAC = target?.actor?.system?.attributes?.ac?.value;
		if (targetAC) {
			config.mainRoll ??= {};
			config.mainRoll.dc ??= targetAC;
		}
	}
}

export function upgradeDie(die, modifier=0) {
	const shadowdarkDice = Object.values(CONFIG.SHADOWDARK.WEAPON_BASE_DAMAGE_DIE_ONLY);
	let index = shadowdarkDice.indexOf(die);
	// make sure die is on the list
	if (index === -1) return die;

	let newIndex = index + modifier;
	newIndex = Math.max(0, Math.min(shadowdarkDice.length - 1, newIndex));

	return shadowdarkDice[newIndex];
}
