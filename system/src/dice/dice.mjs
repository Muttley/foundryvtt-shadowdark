
/**
 * Functions for handling Shadowdark dice roles
*/


export function addStandardFormGroups(config) {
	// Generate prompt form data
	const appfields = foundry.applications.fields;
	config.mainFormGroups ??= [];

	if (config?.check?.formula) {
		// Check Prompt
		const checkInput = appfields.createTextInput({name: "check.formula", value: config.check.formula});
		const checkFormGroup = appfields.createFormGroup({
			input: checkInput,
			label: config?.check?.label,
			hint: config?.check?.tooltips,
			localize: true,
		});
		config.mainFormGroups.push(checkFormGroup);
	}

	if (config?.damage?.formula) {
		// Damage Prompt
		const damageInput = appfields.createTextInput({name: "damage.formula", value: config.damage.formula});
		const damageFormGroup = appfields.createFormGroup({
			input: damageInput,
			label: config?.damage?.label,
			hint: config?.damage?.tooltips,
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

export async function resolveRolls(config) {
	if (!config.actor) {
		console.error("missing valid data.actor");
		return false;
	}

	const template = "systems/shadowdark/templates/chat/roll-card.hbs";
	let success = true;
	const rolls = [];

	if (config?.check?.formula) {
		const checkRoll = await roll(config.check, config.actor.getRollData());
		config.check.html = await checkRoll.render();
		rolls.push(checkRoll);
		success = checkRoll.success;
	}

	const chatData = {
		content: await renderTemplate(template, config),
		flags: { "core.canPopout": true },
		flavor: config.title ?? undefined,
		speaker: ChatMessage.getSpeaker({
			actor: config.actor,
		}),
		rolls,
		user: game.user.id,
	};

	if (config.rollMode) {
		ChatMessage.applyRollMode(chatData, config.rollMode);
	}

	const message = await ChatMessage.create(chatData);

	if (success) {
		// TODO damage Roll from Message rollDamageFromMessage
		console.log(message);
	}

}

export async function roll(config, rolldata={}) {
	if ( !config?.formula) throw new Error("Missing required property: config.formula");
	// apply advantage or disadvantage
	if (config.advantage) {
		config.formula = applyAdvantage(config.formula, config.advantage);
	}
	return await new shadowdark.dice.RollSD(config.formula, rolldata, config).evaluate();
}

export async function rollDamageFromMessage(msg) {
	// TODO complete this function
	if (!msg?.rollConfig?.damage) return false;
	if (msg.rolls.lenth > 0) return;

	if (data?.damage?.formula && success !== false) {
		const damageRoll = await roll(data.damage, data.actor.getRollData());
	}
}

/**
 * Opens a rollDialog based on the provided Shadowdark roll config.
 * @param {*} config :
		title: {String} - Title to be displayed
		advantage: {Int} - 0: Normal, 1 for Advantage, -1 disadvantage
		formGroups: {Array} - formsGroups to be included in the roll prompt
		skipPrompt: {Bool} - show a dialog prompt during a roll?
		rollingMode: {option}
 * @returns {bool}
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
	const checkHandler = ((event, button, dialog) => {
		const formData = new FormDataExtended(button.form).object;
		// determine advantage based on button press
		let adv = 0;
		if (button.dataset.action === "advantage") adv = 1;
		else if (button.dataset.action === "disadvantage") adv = -1;
		formData["check.advantage"] = adv;
		return formData;
	});

	const dialogData = {
		window: { title: config.type },
		content,
		classes: [],
		buttons: [{
			action: "normal",
			default: config?.check?.advantage === 0,
			label: game.i18n.localize("SHADOWDARK.roll.normal"),
			style: {order: "1"},
			callback: checkHandler,
		}, {
			action: "advantage",
			default: config?.check?.advantage === 1,
			label: game.i18n.localize("SHADOWDARK.roll.advantage"),
			style: {order: "0"},
			callback: checkHandler,
		}, {
			action: "disadvantage",
			default: config?.check?.advantage === -1,
			label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
			style: {order: "2"},
			callback: checkHandler,
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

export function setRollTarget(config={}) {
	// Set target and target AC if targeting is enabled
	if (game.settings.get("shadowdark", "enableTargeting")) {
		config.target ??= {};
		const target = game.user.targets.first();
		config.target.token ??= target;
		config.target.ac ??= target?.actor?.system?.attributes?.ac?.value;
	}
}
