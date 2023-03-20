import ActiveEffectsSD from "./ActiveEffectsSD.mjs";

export default class TalentTypesSD extends ActiveEffectsSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.TALENT_TYPES,
			});
	}

	/** @inheritdoc */
	get title() {
		const title = game.i18n.localize("SHADOWDARK.app.item_properties.talent.effects.title");
		return `${title}: ${this.object.name}`;
	}

	_getIcon(key) {
		switch (key) {
			case "abilityImprovement": return "icons/skills/melee/hand-grip-staff-yellow-brown.webp";
			case "meleeAttackBonus": return "icons/skills/melee/strike-polearm-glowing-white.webp";
			case "rangedAttackBonus": return "icons/weapons/ammunition/arrow-head-war-flight.webp";
			case "meleeDamageBonus": return "icons/skills/melee/strike-axe-blood-red.webp";
			case "rangedDamageBonus": return "icons/skills/melee/strike-axe-blood-red.webp";
			case "armorBonus": return "icons/magic/defensive/shield-barrier-deflect-teal.webp";
			case "spellBonus": return "icons/magic/fire/flame-burning-fist-strike.webp";
			case "hpAdvantage": return "icons/magic/life/cross-area-circle-green-white.webp";
			case "initAdvantage": return "icons/skills/movement/feet-winged-boots-glowing-yellow.webp";
			case "spellAdvantage": return "icons/magic/air/air-smoke-casting.webp";
			case "weaponMastery": return "icons/skills/melee/weapons-crossed-swords-white-blue.webp";
			case "backstabDie": return "icons/skills/melee/strike-dagger-white-orange.webp";
			case "custom": return "icons/svg/upgrade.svg";
		}
	}

	_getChanges(key) {
		let changes = [];
		switch (key) {
			case "abilityImprovement": {
				Object.keys(CONFIG.SHADOWDARK.ABILITIES_LONG).forEach(ability => {
					changes.push({
						key: `system.abilities.${ability}.value`,
						value: "",
						mode: CONST.ACTIVE_EFFECT_MODES.ADD,
					});
				});
				break;
			}
			case "meleeAttackBonus": {
				changes.push({
					key: "system.bonuses.meleeAttackBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "rangedAttackBonus": {
				changes.push({
					key: "system.bonuses.rangedAttackBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "meleeDamageBonus": {
				changes.push({
					key: "system.bonuses.meleeDamageBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "rangedDamageBonus": {
				changes.push({
					key: "system.bonuses.rangedDamageBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "armorBonus": {
				changes.push({
					key: "system.bonuses.acBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "spellBonus": {
				changes.push({
					key: "system.bonuses.spellcastingCheckBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "hpAdvantage": {
				changes.push({
					key: "system.bonuses.advantage",
					value: "hp",
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "initAdvantage": {
				changes.push({
					key: "system.bonuses.advantage",
					value: "initiative",
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "spellAdvantage": {
				changes.push({
					key: "system.bonuses.advantage",
					value: "", // @todo
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "weaponMastery": {
				changes.push({
					key: "system.bonuses.weaponMastery",
					value: "", // @todo
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "backstabDie": {
				changes.push({
					key: "system.bonuses.backstabDie",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "custom": {
				changes.push({
					key: "",
					value: "",
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
		}
		return changes;
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
