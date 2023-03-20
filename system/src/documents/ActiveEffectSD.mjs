export default class ActiveEffectSD extends ActiveEffect {

	/**
	 *
	 * @param {Event} event 					- The event that triggers the change
	 * @param {ActorSD|ItemSD} owner 	-	Owning document from which the change was triggered
	 */
	static onChangeActiveEffect(event, owner) {
		event.preventDefault();

		const activeEffectDataClasses = ["talent-option-data", "magic-item-option-data"];

		if (!event.currentTarget) return;
		if (!activeEffectDataClasses.includes(event.target.className)) return;

		// Get the target
		const target = $(event.currentTarget);
		const li = target.closest("li");
		const targetEffect = li[0].dataset.effectId
			? owner.effects.get(li[0].dataset.effectId) : null;

		// Get Effect Attribute Key & new value
		const attributeKey = target.attr("name");
		const newValue = event.currentTarget.value;

		const updates = targetEffect.changes.map(c =>
			c.key === attributeKey ? {...c, value: newValue } : c);

		// Update the effect
		return targetEffect.update({ changes: updates });
	}

	/**
   *
   * @param {MouseEvent} event      - The left-click event on the effect control
   * @param {ActorSD|ItemSD} owner  - The owning document which manages this effect
   * @returns {Promise|null}        - Promise that resolves when the changes are complete.
   */
	static onManageActiveEffect(event, owner) {
		event.preventDefault();
		const a = event.currentTarget;
		const li = a.closest("li");
		const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
		switch ( a.dataset.action ) {
			case "activate":
				return effect.update({disabled: !effect.disabled});
			case "create":
				return owner.createEmbeddedDocuments("ActiveEffect", [{
					label: game.i18n.localize("SHADOWDARK.effect.new"),
					icon: "icons/svg/aura.svg",
					origin: owner.uuid,
					"duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
				}]);
			case "edit":
				return effect.sheet.render(true);
			case "delete":
				return effect.delete();
		}
	}

	/**
   * Categorizes Active Effects data structure for Active Effects currently
   * being applied to an Actor or Item.
   * @param {ActiveEffectSD[]} effects  - Array of Active Effects instances to prepare
   *                                      sheet data for
	 * @param {ActorSD|ItemSD} owner  		- The owning document which manages this effect
   * @returns {object}                  - Data for rendering
   */
	static prepareActiveEffectCategories(effects, owner) {
		// Define effect header categories
		const categories = {
			talent: {
				type: "talent",
				label: game.i18n.localize("SHADOWDARK.effect.talent"),
				effects: [],
				hidden: true,
			},
			spell: {
				type: "spell",
				label: game.i18n.localize("SHADOWDARK.effect.spell"),
				effects: [],
				hidden: true,
			},
			item: {
				type: "item",
				label: game.i18n.localize("SHADOWDARK.effect.item"),
				effects: [],
				hidden: true,
			},
			temporary: {
				type: "temporary",
				label: game.i18n.localize("SHADOWDARK.effect.temporary"),
				effects: [],
				hidden: true,
			},
			suppressed: {
				type: "suppressed",
				label: game.i18n.localize("SHADOWDARK.effect.unavailable"),
				effects: [],
				hidden: true,
			},
			custom: {
				type: "custom",
				label: game.i18n.localize("SHADOWDARK.effect.custom"),
				effects: [],
				hidden: true,
			},
		};

		let category;

		if (owner.isTalent()) {
			category = categories.talent;
		}
		else if (owner.isMagicItem()) {
			category = categories.item;
		}
		else if (owner.isSpell()) {
			category = categories.spell;
		}

		for ( let e of effects ) {
			e._getSourceName();
			// Push custom talent effects to category, always
			if (
				owner.isTalent()
				&& !Object.keys(CONFIG.SHADOWDARK.TALENT_TYPES).includes(e.label)
			) categories.talent.effects.push(e);
			if (
				owner.isMagicItem()
				&& !Object.keys(CONFIG.SHADOWDARK.MAGIC_ITEM_EFFECT_TYPES).includes(e.label)
			) categories.item.effects.push(e);
			else if ( e.disabled ) categories.suppressed.effects.push(e);
			else category.effects.push(e);
		}

		category.hidden = !category.effects.length;
		categories.temporary.hidden = !categories.temporary.effects.length;
		return categories;
	}
}
