import ActiveEffectsSD from "./ActiveEffectsSD.mjs";

export default class MagicItemEffectsSD extends ActiveEffectsSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.MAGIC_ITEM_EFFECT_TYPES,
			});
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item_properties.magic_item.effects.title");
		return `${title}: ${this.object.name}`;
	}

	// @todo: Update and set icons
	_getIcon(key) {
		switch (key) {
			case "critMultiplier": return "icons/skills/melee/hand-grip-staff-yellow-brown.webp";
			case "attackBonus": return "icons/skills/melee/strike-polearm-glowing-white.webp";
			case "damageBonus": return "icons/weapons/ammunition/arrow-head-war-flight.webp";
			case "armorBonus": return "icons/skills/melee/strike-axe-blood-red.webp";
			case "permanentAbility": return "icons/skills/melee/strike-axe-blood-red.webp";
			case "additionalGearSlots": return "icons/magic/defensive/shield-barrier-deflect-teal.webp";
			case "criticalSuccessThreshold": return "icons/magic/fire/flame-burning-fist-strike.webp";
			case "criticalFailureThreshold": return "icons/magic/life/cross-area-circle-green-white.webp";
			case "custom": return "icons/svg/upgrade.svg";
		}
	}

	_getChanges(key) {
		let transfer = false;
		let changes = [];
		switch (key) {
			case "critMultiplier": {
				changes.push({
					key: "system.damage.critMultiplier",
					value: 4,
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				});
				break;
			}
			case "attackBonus": {
				changes.push({
					key: "system.attackBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "damageBonus": {
				changes.push({
					key: "system.damage.bonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "armorBonus": {
				changes.push({
					key: "system.ac.base",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "permanentAbility": {
				changes.push({
					key: "system.abilities.str.value",
					value: 18,
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				});
				transfer = true;
				break;
			}
			case "criticalSuccessThreshold": {
				changes.push({
					key: "system.bonuses.critical.successThreshold",
					value: 18,
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				});
				transfer = true;
				break;
			}
			case "criticalFailureThreshold": {
				changes.push({
					key: "system.bonuses.critical.failureThreshold",
					value: 3,
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				});
				transfer = true;
				break;
			}
		}
		return [changes, transfer];
	}

	async _updateObject(event, formData) {
		const newEffects = [];
		const flipEffects = [];

		for ( const [key, value] of Object.entries(this.effects)) {
			const effectExists = this.object.effects.find(ef => ef.label === key);
			const [changes, transfer] = this._getChanges(key);
			if (effectExists && value.selected && effectExists.disabled) {
				flipEffects.push(effectExists);
			}
			else if (effectExists && !value.selected && !effectExists.disabled) {
				flipEffects.push(effectExists);
			}
			else if (!effectExists && value.selected) {
				newEffects.push({
					label: key,
					icon: this._getIcon(key),
					origin: this.object.uuid,
					changes,
					disabled: false,
					transfer,
				});
			}
		}

		if (newEffects.length > 0) {
			await this.object.createEmbeddedDocuments("ActiveEffect", newEffects);
		}
		if (flipEffects.length > 0) {
			flipEffects.forEach(async ef => await ef.update({disabled: !ef.disabled}));
		}

		super._updateObject(event, formData);
	}
}
