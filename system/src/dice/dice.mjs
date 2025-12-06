
/**
 * Functions for handling Shadowdark dice roles
*/


export function addStandardFormGroups(config) {
	// Generate prompt form data
	const appfields = foundry.applications.fields;
	config.mainFormGroups ??= [];

	if (config?.mainRoll?.formula) {
		// Roll Prompt
		const rollInput = appfields.createTextInput({name: "mainRoll.formula", value: config.mainRoll.formula});
		const rollFormGroup = appfields.createFormGroup({
			input: rollInput,
			label: config?.mainRoll?.label,
			hint: config?.mainRoll?.tooltips,
			localize: true,
		});
		config.mainFormGroups.push(rollFormGroup);
	}

	if (config?.damageRoll?.formula) {
		// Damage Prompt
		const damageInput = appfields.createTextInput({name: "damageRoll.formula", value: config.damageRoll.formula});
		const damageFormGroup = appfields.createFormGroup({
			input: damageInput,
			label: config?.damageRoll?.label,
			hint: config?.damageRoll?.tooltips,
		});
		config.mainFormGroups.push(damageFormGroup);
	}

	// TODO add optional form groups
}


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
 * @returns {string}
 */
export function createToolTip(name, value, prefix="+") {
	if (prefix==="adv") {
		return `${name} (${value > 0 ? "adv" : "dis"})`;
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
 * @param {Object} options shdowdark specific options for describing a single roll
 * @param {Object} rolldata data used to parse attributes included in roll formulas
 * @returns {RollSD}
 */
export async function roll(options, rolldata={}) {
	if ( !options?.formula) throw new Error("Missing required property: config.formula");

	// apply advantage or disadvantage
	if (options.advantage) {
		options.formula = applyAdvantage(options.formula, options.advantage);
	}

	if (options.type === "damage") {
		// apply momentum mode
		if (game.settings.get("shadowdark", "useMomentumMode")) {
			options.formula = applyExploding(options.formula);
		}
	}

	return await new shadowdark.dice.RollSD(options.formula, rolldata, options).evaluate();
}

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
	game.dice3d.waitFor3DAnimationByMessageID(msg.id).then(() =>
		msg.update({content})
	);

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
export async function rollDialog(config) {

	// get global role default if rollMode not set
	config.rollMode ??= game.settings.get("core", "rollMode");
	config.type ??= "";
	config.heading ??= "";

	// adds attack, damage and optional form groups to the dialog prompt
	addStandardFormGroups(config);

	await Hooks.call("SD-Roll-Dialog", config);

	if (config.skipPrompt) return 1;

	// Generate prompt content by merging options into prompData.
	const DIALOG_TEMPLATE = "systems/shadowdark/templates/dialog/roll.hbs";
	const promptData = {
		rollModes: CONFIG.Dice.rollModes,
	};
	foundry.utils.mergeObject(promptData, config);
	const content = await foundry.applications.handlebars.renderTemplate(
		DIALOG_TEMPLATE,
		promptData
	);

	// callback function for dialog to get inputed mode
	const callbackHandler = ((event, button, dialog) => {
		const formData = new FormDataExtended(button.form).object;
		// determine advantage based on button press
		let adv = 0;
		if (button.dataset.action === "advantage") adv = 1;
		else if (button.dataset.action === "disadvantage") adv = -1;
		formData["mainRoll.advantage"] = adv;
		return formData;
	});

	const dialogData = {
		window: { title: config.type },
		content,
		classes: [],
		buttons: [{
			action: "normal",
			default: config?.mainRoll?.advantage === 0,
			label: game.i18n.localize("SHADOWDARK.roll.normal"),
			style: {order: "1"},
			callback: callbackHandler,
		}, {
			action: "advantage",
			default: config?.mainRoll?.advantage === 1,
			label: game.i18n.localize("SHADOWDARK.roll.advantage"),
			style: {order: "0"},
			callback: callbackHandler,
		}, {
			action: "disadvantage",
			default: config?.mainRoll?.advantage === -1,
			label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
			style: {order: "2"},
			callback: callbackHandler,
		}],
	};

	// Show roll prompt
	const result = await foundry.applications.api.DialogV2.wait(dialogData);
	if (!result) return false; // if closed, cancel roll action

	// TODO handle optional bonuses

	const expandedData = foundry.utils.expandObject(result);
	foundry.utils.mergeObject(config, expandedData);
	return true;
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
	await ChatMessage.create(chatData);

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
