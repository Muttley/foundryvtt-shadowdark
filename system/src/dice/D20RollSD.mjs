export default class D20RollSD extends Roll {

	constructor(formula, data, options) {
		super(formula, data, options);

		if (!this.options.configured) this.configureModifiers();
	}

	configureModifiers() {
		this.options.configured = true;
	}

	static async d20Roll({
		item = null,
		parts,
		data,
		template,
		title,
		speaker,
		flavor,
		onClose,
		dialogOptions,
		rollMode = game.settings.get("core", "rollMode"),
		rollType = "",
		fastForward = false,
	}) {
		const _roll = async (rollParts, adv, $form) => {
			let flav = flavor instanceof Function ? flavor(rollParts, data) : title;
			if (adv === 1) {
				rollParts[0] = ["2d20kh"];
				flav = game.i18n.format("SHADOWDARK.Roll.AdvantageTitle", { title: title });
			}
			else if (adv === -1) {
				rollParts[0] = ["2d20kl"];
				flav = game.i18n.format("SHADOWDARK.Roll.DisadvantageTitle", { title: title });
			}

			// Check if itemBonus is defined
			if ($form) data.itemBonus = $form.find("[name=item-bonus]").val();
			if ((!data.itemBonus || data.itemBonus === 0) && rollParts.indexOf("@itemBonus") !== -1) rollParts.splice(rollParts.indexOf("@itemBonus"), 1);

			// Check if abilityBonus is defined
			if ($form) data.abilityBonus = $form.find("[name=ability-bonus]").val();
			if ((!data.abilityBonus || data.abilityBonus === 0) && rollParts.indexOf("@abilityBonus") !== -1) rollParts.splice(rollParts.indexOf("@abilityBonus"), 1);

			// Check if talentBonus is defind
			if ($form) data.talentBonus = $form.find("[name=talent-bonus]").val();
			if ((!data.talentBonus || data.abilityBonus === 0) && rollParts.indexOf("@talentBonus") !== -1) rollParts.splice(rollParts.indexOf("@talentBonus"), 1);

			// Execute roll and send it to chat
			const roll = await new Roll(rollParts.join("+"), data).roll({ async: true });
			const origin = item ? { uuid: item.uuid, type: item.type } : null;
			roll.toMessage(
				{
					speaker,
					flavor: flav,
					flags: {
						shadowdark: {
							context: {
								type: rollType,
							},
							origin,
						},
					},
				},
				{
					rollMode: $form ? ($form.find("[name=rollMode]").val()) : rollMode,
				}
			);
		};

		// Modify the roll and handle fast-forwarding
		parts.unshift("1d20");
		if ( fastForward ) {
			return _roll(parts, 0);
		}
		else {
			if (parts.indexOf("@abilityBonus") === -1) parts = parts.concat(["@abilityBonus"]);
			if (parts.indexOf("@itemBonus") === -1) parts = parts.concat(["@itemBonus"]);
			if (parts.indexOf("@talentBonus") === -1) parts = parts.concat(["@talentBonus"]);

			// Render dialog
			template = template || "systems/shadowdark/templates/dialog/roll-dialog.hbs";
			const dialogData = {
				data,
				rollMode,
				formula: parts.join(" + "),
				rollModes: CONFIG.Dice.rollModes,
			};

			const content = await renderTemplate(template, dialogData);
			let roll;

			return new Promise(resolve => {
				new Dialog(
					{
						title,
						content,
						buttons: {
							advantage: {
								label: game.i18n.localize("SHADOWDARK.Roll.Advantage"),
								callback: async html => {
									roll = await _roll(parts, 1, html);
								},
							},
							normal: {
								label: game.i18n.localize("SHADOWDARK.Roll.Normal"),
								callback: async html => {
									roll = await _roll(parts, 0, html);
								},
							},
							disadvantage: {
								label: game.i18n.localize("SHADOWDARK.Roll.Disadvantage"),
								callback: async html => {
									roll = await _roll(parts, -1, html);
								},
							},
						},
						default: game.i18n.localize("SHADOWDARK.Roll.Normal"),
						close: html => {
							if (onClose) onClose(html, parts, data);
							resolve(roll);
						},
				  },
					dialogOptions
				).render(true);
			});
		}
	}
}
