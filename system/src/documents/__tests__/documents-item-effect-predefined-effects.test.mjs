/* eslint-disable no-unused-expressions */
/**
 * @file Contains tests for effect item documents. This part only
 * tests the predefined effects.
 *
 * Please note that Effects that require user input are
 * tested in e2e-documents-item-effect.test.mjs
 */
import {
	createMockItemByKey,
	createMockActorByKey,
	cleanUpItemsByKey,
	cleanUpActorsByKey,
	waitForInput,
} from "../../testing/testUtils.mjs";

export const key = "shadowdark.documents.item.effect.predefined";
export const options = {
	displayName: "Shadowdark: Documents: Item, Effect: Predefined Effects",
	preSelected: true,
};

const predefinedEffects = await foundry.utils.fetchJsonWithTimeout(
	"systems/shadowdark/assets/mappings/map-predefined-effects.json"
);

const createMockItem = async type => createMockItemByKey(key, "Effect");
const createMockPlayer = async () => createMockActorByKey(key, "Player");

const cleanUpActorItems = async _a => {
	_a.items.forEach(async i => await i.delete());
	await waitForInput();
};

// Add the pre-defined effect
const createPrefabEffect = async (key, _pde) => {
	const _e = await createMockItem();
	await _e.sheet._createPredefinedEffect(key, _pde);
	await waitForInput();
	return _e;
};

export default ({ describe, it, before, after, afterEach, expect }) => {
	after(() => {
		cleanUpItemsByKey(key);
	});

	describe("Predefined Effect Tests", () => {
		let _p = {};

		after(() => {
			cleanUpItemsByKey(key);
			cleanUpActorsByKey(key);
		});

		before(async () => {
			_p = await createMockPlayer();
			await _p.updateArmorClass();
			await waitForInput();
		});

		describe("sanity checks", () => {
			it("Mock actor is defined", () => {
				expect(_p).is.not.undefined;
				expect(_p.system.abilities.str.base).equal(10);
				expect(_p.system.abilities.dex.base).equal(10);
				expect(_p.system.abilities.con.base).equal(10);
				expect(_p.system.abilities.int.base).equal(10);
				expect(_p.system.abilities.wis.base).equal(10);
				expect(_p.system.abilities.cha.base).equal(10);
				expect(_p.system.abilities.str.bonus).equal(0);
				expect(_p.system.abilities.dex.bonus).equal(0);
				expect(_p.system.abilities.con.bonus).equal(0);
				expect(_p.system.abilities.int.bonus).equal(0);
				expect(_p.system.abilities.wis.bonus).equal(0);
				expect(_p.system.abilities.cha.bonus).equal(0);
				expect(_p.system.attributes.ac.value).equal(10);
			});

			it("Predefined effects could be read", () => {
				expect(predefinedEffects).is.not.undefined;
				expect(typeof predefinedEffects).equal("object");
				expect(Object.entries(predefinedEffects).length > 0).is.true;
			});
		});

		describe("Ability score improvements", () => {
			const createASITest = async (key, asi) => {
				expect(_p.items.size).equal(0);
				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.abilities[asi].bonus).equal(1);
				await _pe[0].delete();
			};

			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("abilityImprovementStr", async () => {
				await createASITest("abilityImprovementStr", "str");
			});

			it("abilityImprovementDex", async () => {
				await createASITest("abilityImprovementDex", "dex");
			});

			it("abilityImprovementCon", async () => {
				await createASITest("abilityImprovementCon", "con");
			});

			it("abilityImprovementInt", async () => {
				await createASITest("abilityImprovementInt", "int");
			});

			it("abilityImprovementWis", async () => {
				await createASITest("abilityImprovementWis", "wis");
			});

			it("abilityImprovementCha", async () => {
				await createASITest("abilityImprovementCha", "cha");
			});
		});

		describe("Armor class bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("acBonus", async () => {
				const key = "acBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.attributes.ac.value).equal(10);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				await _p.updateArmorClass();
				await waitForInput();

				expect(_p.system.attributes.ac.value).equal(11);
				await _pe[0].delete();
			});
		});

		describe("Additional gear slots", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("additionalGearSlots", async () => {
				const key = "additionalGearSlots";
				expect(_p.items.size).equal(0);
				expect(_p.numGearSlots()).equal(10);
				expect(_p.system.bonuses.gearSlots).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.gearSlots).equal(1);
				expect(_p.numGearSlots()).equal(11);
				await _pe[0].delete();
			});
		});

		describe("Attack Bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
				await cleanUpItemsByKey(key);
			});

			// TODO: This only checks that the effects are carried over to the
			//        item. This seems to be the way Foundry works, and will probably
			//        change with V11.
			it("weaponAttackBonus", async () => {
				const testKey = "weaponAttackBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.attackBonus).is.undefined;

				const _pde = predefinedEffects[testKey];
				expect(_pde).is.not.undefined;

				// @note: Only for weapons!
				const _e = await createMockItemByKey(key, "Weapon");
				expect(_e.system.bonuses.attackBonus).equal(0);

				await _e.sheet._createPredefinedEffect(testKey, _pde);
				await waitForInput();

				expect(_e.effects.contents[0].transfer).is.false;

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].effects.contents[0].changes[0].key).equal("system.bonuses.attackBonus");
				expect(_pe[0].effects.contents[0].changes[0].value).equal("1");
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.attackBonus).is.undefined;
				await _pe[0].delete();
			});
		});

		describe("Additional Backstab die", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("backstabDie", async () => {
				const key = "backstabDie";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.backstabDie).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.backstabDie).equal(1);
				await _pe[0].delete();
			});
		});

		describe("Critical Failure threshold", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("criticalFailureThreshold", async () => {
				const key = "criticalFailureThreshold";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.critical.failureThreshold).equal(1);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.critical.failureThreshold).equal(3);
				await _pe[0].delete();
			});
		});

		describe("Critical Success threshold", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("criticalSuccessThreshold", async () => {
				const key = "criticalSuccessThreshold";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.critical.successThreshold).equal(20);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.critical.successThreshold).equal(18);
				await _pe[0].delete();
			});
		});

		describe("Critical damage multiplier", () => {
			after(async () => {
				await cleanUpActorItems(_p);
				await cleanUpItemsByKey(key);
			});

			// TODO: This only checks that the effects are carried over to the
			//        item. This seems to be the way Foundry works, and will probably
			//        change with V11.
			it("critMultiplier", async () => {
				const testKey = "critMultiplier";
				expect(_p.items.size).equal(0);
				expect(_p.system.damage).is.undefined;

				const _pde = predefinedEffects[testKey];
				expect(_pde).is.not.undefined;

				// @note: Only for weapons!
				const _e = await createMockItemByKey(key, "Weapon");
				expect(_e.system.bonuses.critical.multiplier).equal(2);

				await _e.sheet._createPredefinedEffect(testKey, _pde);
				await waitForInput();

				expect(_e.effects.contents[0].transfer).is.false;
				expect(_e.effects.contents[0].changes[0].key)
					.equal("system.bonuses.critical.multiplier");
				expect(_e.effects.contents[0].changes[0].value)
					.equal("4");

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].effects.contents[0].changes[0].key)
					.equal("system.bonuses.critical.multiplier");
				expect(_pe[0].effects.contents[0].changes[0].value).equal("4");
				expect(_p.items.size).equal(1);

				expect(_p.system.damage).is.undefined;
				await _pe[0].delete();
			});
		});

		describe("Damage bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
				await cleanUpItemsByKey(key);
			});

			// TODO: This only checks that the effects are carried over to the
			//        item. This seems to be the way Foundry works, and will probably
			//        change with V11.
			it("weaponDamageBonus", async () => {
				const testKey = "weaponDamageBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.damageBonus).is.undefined;

				const _pde = predefinedEffects[testKey];
				expect(_pde).is.not.undefined;

				// @note: Only for weapons!
				const _e = await createMockItemByKey(key, "Weapon");
				expect(_e.system.bonuses.damageBonus).equal(0);

				await _e.sheet._createPredefinedEffect(testKey, _pde);
				await waitForInput();

				expect(_e.effects.contents[0].transfer).is.false;

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].effects.contents[0].changes[0].key).equal("system.bonuses.damageBonus");
				expect(_pe[0].effects.contents[0].changes[0].value).equal("1");
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.damageBonus).is.undefined;
				await _pe[0].delete();
			});
		});

		describe("Damage multiplier", () => {
			after(async () => {
				await cleanUpActorItems(_p);
				await cleanUpItemsByKey(key);
			});

			// TODO: This only checks that the effects are carried over to the
			//        item. This seems to be the way Foundry works, and will probably
			//        change with V11.
			it("damageMultiplier", async () => {
				const testKey = "damageMultiplier";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.damageMultiplier).equal(1);

				const _pde = predefinedEffects[testKey];
				expect(_pde).is.not.undefined;

				// @note: Only for weapons!
				const _e = await createMockItemByKey(key, "Weapon");
				expect(_e.system.bonuses.damageMultiplier).equal(1);

				await _e.sheet._createPredefinedEffect(testKey, _pde);
				await waitForInput();

				expect(_e.effects.contents[0].transfer).is.true;

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_pe[0].effects.contents[0].changes[0].key).equal("system.bonuses.damageMultiplier");
				expect(_pe[0].effects.contents[0].changes[0].value).equal("2");
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.damageMultiplier).equal(2);
				await _pe[0].delete();
			});
		});

		describe("Advantage: HP Rolls", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("hpAdvantage", async () => {
				const key = "hpAdvantage";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.advantage.length).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.advantage.length).equal(1);
				expect(_p.system.bonuses.advantage).contains("hp");
				await _pe[0].delete();
			});
		});

		describe("Advantage: Initiative", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("initAdvantage", async () => {
				const key = "initAdvantage";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.advantage.length).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.advantage.length).equal(1);
				expect(_p.system.bonuses.advantage).contains("initiative");
				await _pe[0].delete();
			});
		});

		describe("Melee Attack bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("meleeAttackBonus", async () => {
				const key = "meleeAttackBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.meleeAttackBonus).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.meleeAttackBonus).equal(1);
				await _pe[0].delete();
			});
		});

		describe("Melee Damage bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("meleeDamageBonus", async () => {
				const key = "meleeDamageBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.meleeDamageBonus).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.meleeDamageBonus).equal(1);
				await _pe[0].delete();
			});
		});

		describe("Permanent ability score", () => {
			const createPermAbilityTest = async (key, abi) => {
				expect(_p.items.size).equal(0);
				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.abilities[abi].base).equal(18);
				expect(_p.system.abilities[abi].bonus).equal(0);
				expect(_p.system.abilities[abi].mod).equal(4);
				await _pe[0].delete();
			};

			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("permanentAbilityStr", async () => {
				await createPermAbilityTest("permanentAbilityStr", "str");
			});

			it("permanentAbilityDex", async () => {
				await createPermAbilityTest("permanentAbilityDex", "dex");
			});

			it("permanentAbilityCon", async () => {
				await createPermAbilityTest("permanentAbilityCon", "con");
			});

			it("permanentAbilityInt", async () => {
				await createPermAbilityTest("permanentAbilityInt", "int");
			});

			it("permanentAbilityWis", async () => {
				await createPermAbilityTest("permanentAbilityWis", "wis");
			});

			it("permanentAbilityCha", async () => {
				await createPermAbilityTest("permanentAbilityCha", "cha");
			});
		});

		describe("Ranged Attack bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("rangedAttackBonus", async () => {
				const key = "rangedAttackBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.rangedAttackBonus).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.rangedAttackBonus).equal(1);
				await _pe[0].delete();
			});
		});

		describe("Ranged Damage bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("rangedDamageBonus", async () => {
				const key = "rangedDamageBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.rangedDamageBonus).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.rangedDamageBonus).equal(1);
				await _pe[0].delete();
			});
		});

		describe("Spellcasting Check Bonus", () => {
			after(async () => {
				await cleanUpActorItems(_p);
			});

			it("spellCastingBonus", async () => {
				const key = "spellCastingBonus";
				expect(_p.items.size).equal(0);
				expect(_p.system.bonuses.spellcastingCheckBonus).equal(0);

				const _pde = predefinedEffects[key];
				expect(_pde).is.not.undefined;

				const _e = await createPrefabEffect(key, _pde);

				const _pe = await _p.createEmbeddedDocuments("Item", [_e]);
				expect(_pe.length).equal(1);
				expect(_pe[0]).is.not.undefined;
				expect(_p.items.size).equal(1);

				expect(_p.system.bonuses.spellcastingCheckBonus).equal(1);
				await _pe[0].delete();
			});
		});
	});
};
