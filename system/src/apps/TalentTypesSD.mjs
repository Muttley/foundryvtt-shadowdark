import ItemPropertiesSD from "./ItemPropertiesSD.mjs";

export default class TalentTypesSD extends ItemPropertiesSD {
	constructor(object, options) {
		super(
			object,
			{
				data: CONFIG.SHADOWDARK.TALENT_TYPES,
				systemKey: "properties",
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
			case "attackBonus": return "icons/skills/melee/strike-polearm-glowing-white.webp";
			case "damageBonus": return "icons/skills/melee/strike-axe-blood-red.webp";
			case "armorBonus": return "icons/magic/defensive/shield-barrier-deflect-teal.webp";
			case "spellBonus": return "icons/magic/fire/flame-burning-fist-strike.webp";
			case "initAdvantage": return "icons/skills/movement/feet-winged-boots-glowing-yellow.webp";
			case "spellAdvantage": return "icons/magic/air/air-smoke-casting.webp";
			case "weaponMastery": return "icons/skills/melee/weapons-crossed-swords-white-blue.webp";
			case "backstabDie": return "icons/skills/melee/strike-dagger-white-orange.webp";
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
			case "attackBonus": {
				changes.push({
					key: "system.talent.attackBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "damageBonus": {
				changes.push({
					key: "system.talent.damageBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "armorBonus": {
				changes.push({
					key: "system.talent.acBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "spellBonus": {
				changes.push({
					key: "system.talent.spellCheckBonus",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "initAdvantage": {
				changes.push({
					key: "system.talent.initiativeAdvantage",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				});
				break;
			}
			case "spellAdvantage": {
				changes.push({
					key: "system.talent.advantageSpells",
					value: "this.object.system.spellName",
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "weaponMastery": {
				changes.push({
					key: "system.talent.weaponMasteryTypes",
					value: "this.object.system.weaponType",
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
			case "backstabDie": {
				changes.push({
					key: "system.talent.backstabDie",
					value: 1,
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
				});
				break;
			}
		}
		return changes;
	}

	async _onPropertySelect(event) {
		await super._onPropertySelect(event);

		let newEffects = [];
		let flipEffects = [];

		for ( const [key, value] of Object.entries(this.properties)) {
			const effectExists = this.object.effects.find(ef => ef.label === key);
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
					changes: this._getChanges(key),
					disabled: false,
					transfer: true,
				});
			}
		}

		if (newEffects.length > 0) {
			await this.object.createEmbeddedDocuments("ActiveEffect", newEffects);
		}
		if (flipEffects.length > 0) {
			flipEffects.forEach(async ef => await ef.update({disabled: !ef.disabled}));
		}

		this.object.sheet.render(true);

		console.log(`new: ${newEffects}`);
		console.log(`flip: ${flipEffects}`);
	}
}
