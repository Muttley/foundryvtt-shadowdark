import RollSD from "./RollSD.mjs";

// A class for making Shadowdark related dice roles
export default class DiceSD {

	/*
	rollDialog
	Base Options:
		title: {String} - Title to be displayed
		advantage: {Int} - 0: Normal, 1 for Advantage, -1 disadvantage
		formGroups: {Array} - formsGroups to be included in the roll prompt
		skipPrompt: {Bool} - show a dialog prompt during a roll?
		rollingMode: {option}
	*/
	static async rollDialog(options={}) {
		if (options.skipPrompt) return;

		const promptData = {
			rollModes: CONFIG.Dice.rollModes,
		};

		// get global role default if rollMode not set
		options.rollMode ??= game.settings.get("core", "rollMode");

		// calculate default
		const defaultButton = (() => {
			switch (options?.check?.advantage) {
				case 1: return "advantage";
				case -1: return "disadvantage";
				case 0:
				default: return "normal";
			}
		});

		// Generate prompt content by merging options into prompData.
		foundry.utils.mergeObject(promptData, options);
		const content = await renderTemplate(
			"systems/shadowdark/templates/dialog/roll-dialog.hbs",
			   promptData
		);

		// callback function for dialog to get inputed mode
		const callbackHandler = ((html, adv, reload=false) => {
			const formData = new FormDataExtended(html.find("form")[0]).object;
			formData.check = {
				advantage: adv,
			};
			return formData;
		});

		// render prompt template
		const dialogData = {
			title: "test",
			content,
			classes: ["shadowdark-dialog"],
			buttons: {
				advantage: {
					label: game.i18n.localize("SHADOWDARK.roll.advantage"),
					callback: html => {
						return callbackHandler(html, 1);
					},
				},
				normal: {
					label: game.i18n.localize("SHADOWDARK.roll.normal"),
					callback: html => {
						return callbackHandler(html, 0);
					},
				},
				disadvantage: {
					label: game.i18n.localize("SHADOWDARK.roll.disadvantage"),
					callback: html => {
						return callbackHandler(html, -1);
					},
				},
			},
			default: defaultButton(),
		};

		const result = await Dialog.wait(dialogData);
		const expandedData = foundry.utils.expandObject(result);
		foundry.utils.mergeObject(options, expandedData);
	}

	static createBonusToolTip(rollBonuses) {
		const text = rollBonuses.map(b =>
			`${b.name} (${b.value > 0 ? "+" : ""}${b.value})`
		).join(", ");
		return text;
	}

	static resolveFormula(formula, rollData={}, forceDeterministic=false) {
		const r = new Roll(formula.toString(), rollData);
		if (r.isDeterministic) {
			try {
				r.evaluateSync();
			}
			catch(err) {
				console.error("Unresolvable formula: ", formula);
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

	static applyAdvantage(formula, adv) {
		return formula.replace(/^(\d*)d(\d+)/, function(match, dice, sides) {
			if (sides) {
				if (adv > 0) return `2d${sides}kh`;
				if (adv < 0) return `2d${sides}kl`;
			}
			return match;
		});
	}

	static async Roll(parts, data, $form, adv=0, options={}) {
		return RollSD.Roll(parts, data, $form, adv=0, options={});
	}

}
