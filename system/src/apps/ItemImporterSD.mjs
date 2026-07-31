import ImporterSD from "./ImporterSD.mjs";
import { translateMagicItem } from "./item-importer-parser.mjs";

export default class ItemImporterSD extends ImporterSD {
	static DEFAULT_OPTIONS = {
		id: "sd-item-importer",
		window: {
			title: "SHADOWDARK.apps.item-importer.title",
		},
	};

	static PARTS = {
		form: {
			template: "systems/shadowdark/templates/apps/item-importer.hbs",
		},
	};

	static IMPORTER_CONFIG = {
		textField: "itemText",
		sidebarTab: "items",
		errorMessage: "Failed to fully parse the item stat block.",
	};

	static BENEFIT_EFFECT_PATTERNS = [
		{pattern: /\+(?<value>\d+)\s+bonus\s+to\s+(?:your\s+)?armor\s+class/i, effect: "acBonus"},
		{pattern: /Strength\s+stat\s+becomes\s+(?<value>\d+)/i, effect: "permanentAbilityStr"},
		{pattern: /Dexterity\s+stat\s+becomes\s+(?<value>\d+)/i, effect: "permanentAbilityDex"},
		{pattern: /Constitution\s+stat\s+becomes\s+(?<value>\d+)/i, effect: "permanentAbilityCon"},
		{pattern: /Intelligence\s+stat\s+becomes\s+(?<value>\d+)/i, effect: "permanentAbilityInt"},
		{pattern: /Wisdom\s+stat\s+becomes\s+(?<value>\d+)/i, effect: "permanentAbilityWis"},
		{pattern: /Charisma\s+stat\s+becomes\s+(?<value>\d+)/i, effect: "permanentAbilityCha"},
	];

	_parseItem(itemText) {
		return translateMagicItem(itemText, ItemImporterSD.BENEFIT_EFFECT_PATTERNS);
	}

	async _import(itemText) {
		return this._importItem(itemText);
	}

	_buildWeaponObj(name, description, bonusHint, baseWeapon) {
		return {
			...baseWeapon,
			name,
			type: "Weapon",
			system: {
				...baseWeapon.system,
				description,
				magicItem: true,
				baseWeapon: baseWeapon.name.slugify(),
			},
		};
	}

	_buildPredefinedEffect(key, value) {
		const data = CONFIG.SHADOWDARK.PREDEFINED_EFFECTS[key];
		const effectMode = foundry.utils.getProperty(
			CONST.ACTIVE_EFFECT_MODES,
			data.mode.split(".")[2]
		);
		return {
			name: game.i18n.localize(`SHADOWDARK.item.effect.predefined_effect.${key}`),
			img: data.img,
			changes: [{key: data.effectKey, value, mode: effectMode}],
			disabled: false,
			transfer: data.transfer ?? true,
		};
	}

	_buildArmorObj(name, description, bonusHint, baseArmor) {
		const isMithral = /mithral/i.test(bonusHint.text);
		return {
			...baseArmor,
			name,
			type: "Armor",
			system: {
				...baseArmor.system,
				ac: {...baseArmor.system.ac, modifier: bonusHint.value},
				properties: isMithral ? [] : baseArmor.system.properties,
				description,
				magicItem: true,
				baseArmor: baseArmor.name.slugify(),
			},
		};
	}

	async _resolveItemType(parsed) {
		const {name, description, bonusHint, benefitEffects} = parsed;
		const effects = [];

		if (bonusHint) {
			const weapons = (await shadowdark.compendiums.baseWeapons()).contents;
			const matchedWeapon = weapons.find(weapon =>
				bonusHint.text.toLowerCase().includes(weapon.name.toLowerCase())
			);
			if (matchedWeapon) {
				effects.push(
					this._buildPredefinedEffect("weaponAttackBonus", bonusHint.value),
					this._buildPredefinedEffect("weaponDamageBonus", bonusHint.value)
				);
				for (const benefit of benefitEffects) {
					effects.push(this._buildPredefinedEffect(benefit.effect, benefit.value));
				}
				return {
					itemObj: this._buildWeaponObj(name, description, bonusHint, matchedWeapon),
					effects,
				};
			}

			const armor = (await shadowdark.compendiums.baseArmor()).contents;
			const matchedArmor = armor.find(piece =>
				bonusHint.text.toLowerCase().includes(piece.name.toLowerCase())
			);
			if (matchedArmor) {
				for (const benefit of benefitEffects) {
					effects.push(this._buildPredefinedEffect(benefit.effect, benefit.value));
				}
				return {
					itemObj: this._buildArmorObj(name, description, bonusHint, matchedArmor),
					effects,
				};
			}

			const error = new Error("Import validation failed");
			error.details = [
				"Bonus has a +N modifier but no matching weapon or armor was found in the compendium.",
			];
			throw error;
		}

		const acEffect = benefitEffects.find(benefit => benefit.effect === "acBonus");
		if (acEffect) {
			for (const benefit of benefitEffects) {
				if (benefit.effect !== "acBonus") {
					effects.push(this._buildPredefinedEffect(benefit.effect, benefit.value));
				}
			}
			return {
				itemObj: {
					name,
					type: "Armor",
					system: {
						ac: {attribute: "", base: 0, modifier: acEffect.value},
						baseArmor: "",
						properties: [],
						description,
						magicItem: true,
					},
				},
				effects,
			};
		}

		for (const benefit of benefitEffects) {
			effects.push(this._buildPredefinedEffect(benefit.effect, benefit.value));
		}
		return {
			itemObj: {name, type: "Basic", system: {description, magicItem: true}},
			effects,
		};
	}

	async _importItem(itemText) {
		const parsed = this._parseItem(itemText);
		const {itemObj, effects} = await this._resolveItemType(parsed);
		const newItem = await Item.create(itemObj);
		if (effects.length > 0) await newItem.createEmbeddedDocuments("ActiveEffect", effects);
		return newItem;
	}
}
